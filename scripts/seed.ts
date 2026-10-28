// `npm run seed`: fills Supabase with Pillar III, the test user Andrei (34) and the admin account.
// Safe to run again: it deletes Andrei (everything of his cascades) and recreates him.
// Uses the secret key, so it only runs on a developer machine with .env.local.
import fs from 'node:fs'
import path from 'node:path'
import { Psd2Transaction } from '../lib/contracts'
import {
  firstLevelOfTier,
  formatRon,
  levelState,
  parseDecimalStringToBani,
  projectedRetirementIncome,
  tierFromRatio,
  xpFromContributions,
} from '../lib/rules'
import { rebuildJar } from '../lib/server/jar'
import { answerOffer, collectJar, investJar, offerJar, oneMonthLater } from '../lib/server/money-flow'
import { mockIdPrefix } from '../lib/server/mock-bank'
import { unwrap } from '../lib/server/unwrap'
import { createAdminClient } from '../lib/supabase/admin'
import {
  CURRENT_MONTH,
  MONTHS,
  PRICE_DATES,
  PRODUCTS,
  UNIT_PRICES_BANI,
  transactionsForMonth,
} from './seed-data'

for (const file of ['.env.local', '.env']) {
  if (fs.existsSync(file)) process.loadEnvFile(file)
}

const email = process.env.DEMO_USER_EMAIL
const password = process.env.DEMO_USER_PASSWORD
if (!email || !password) {
  throw new Error('Set DEMO_USER_EMAIL and DEMO_USER_PASSWORD in .env.local')
}

const persona = JSON.parse(fs.readFileSync(path.join('data', 'personas', 'andrei.json'), 'utf8'))
const db = createAdminClient()

// The newest price we have; jars due after it stay "collected" (still held by us).
const LAST_PRICE_DATE = PRICE_DATES[PRICE_DATES.length - 1]
const SALARY_SHARE_BP = 300 // 3% of the salary goes into the jar

async function recreateDemoUser() {
  const { users } = unwrap(await db.auth.admin.listUsers({ perPage: 1000 }))
  const old = users.find((user) => user.email === email)
  if (old) unwrap(await db.auth.admin.deleteUser(old.id))

  const { user } = unwrap(
    await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: 'Andrei Popescu' },
    }),
  )
  if (!user) throw new Error('Demo user was not created')
  return user.id
}

async function seedProducts() {
  // Plan v2 keeps only Pillar III; remove anything older (Andrei's old orders are already gone).
  unwrap(await db.from('products').delete().not('id', 'in', `(${PRODUCTS.map((p) => p.id).join(',')})`))
  unwrap(await db.from('products').upsert(PRODUCTS))
  const prices = PRODUCTS.flatMap((product) =>
    PRICE_DATES.map((date, i) => ({ product_id: product.id, date, unit_price_bani: UNIT_PRICES_BANI[product.id][i] })),
  )
  unwrap(await db.from('product_prices').upsert(prices, { onConflict: 'product_id,date' }))
}

async function seedProfile(userId: string) {
  unwrap(
    await db
      .from('profiles')
      .update({
        birth_year: Number(CURRENT_MONTH.slice(0, 4)) - persona.age,
        net_salary_bani: persona.salaryBani,
        years_worked: persona.yearsWorked,
        roundup_rule_bani: persona.roundUpRule.stepBani,
        roundup_multiplier: persona.roundUpRule.multiplier,
        salary_percent_bp: SALARY_SHARE_BP,
        monthly_cap_bani: persona.monthlyCapBani,
        card_linked: true,
        onboarding_completed: true,
        terms_accepted_at: `${MONTHS[0]}-01T08:00:00Z`,
      })
      .eq('id', userId),
  )
  unwrap(
    await db.from('pension_assets').insert({
      user_id: userId,
      type: 'pillar2',
      provider: 'NN Pensii',
      balance_bani: persona.pillarTwoBani,
      source: 'statement_upload',
      as_of: '2026-09-30',
    }),
  )
}

async function seedTransactions(userId: string) {
  // The current month's salary comes from the persona's sample transactions instead.
  // Same ids as the app's mock bank (mockIdPrefix), so "Simulate end of month" doesn't import them twice.
  const generated = MONTHS.flatMap((month, i) =>
    transactionsForMonth(month, i, persona.salaryBani, { includeSalary: month !== CURRENT_MONTH, idPrefix: mockIdPrefix(userId) }),
  )

  // The persona's sample transactions are the ones Ana's tests check, so they go in as-is.
  const fromPersona = persona.sampleTransactions.map((raw: unknown) => {
    const tx = Psd2Transaction.parse(raw)
    const amountBani = parseDecimalStringToBani(tx.transactionAmount.amount)
    return {
      external_id: tx.transactionId,
      booked_at: tx.bookingDate,
      amount_bani: amountBani,
      currency: tx.transactionAmount.currency,
      counterparty: tx.creditorName ?? null,
      description: tx.remittanceInformationUnstructured ?? null,
      is_card_payment: amountBani < 0,
    }
  })

  // Every row needs the same keys: in a bulk insert, a missing key becomes null, not the default.
  const rows = [...generated, ...fromPersona].map((row) => ({ currency: 'RON', ...row, user_id: userId }))
  unwrap(await db.from('transactions').insert(rows))
}

/**
 * Past months go through the real flow: offer → accept → collect on the 1st of the next
 * month → invest one month later. The current month stays open for the live demo.
 */
async function seedJars(userId: string) {
  for (const month of MONTHS) {
    if (month === CURRENT_MONTH) {
      await rebuildJar(db, userId, month)
      continue
    }
    const jar = await offerJar(db, userId, month)
    await answerOffer(db, userId, jar.id, { accept: true, amountBani: jar.total_bani })

    const collectedOn = oneMonthLater(`${month}-01`)
    await collectJar(db, jar.id, collectedOn)
    if (oneMonthLater(collectedOn) <= LAST_PRICE_DATE) {
      await investJar(db, jar.id)
    }
  }
}

/** Store Andrei's starting level and mark his current level as seen (no level-up overlay on login). */
async function markLevelSeen(userId: string) {
  const jars = unwrap(
    await db
      .from('monthly_jars')
      .select('month, accepted_amount_bani, status, float_interest_bani')
      .eq('user_id', userId)
      .order('month'),
  )
  const income = projectedRetirementIncome({
    age: persona.age,
    netSalaryBani: persona.salaryBani,
    yearsWorked: persona.yearsWorked,
    pillarTwoBani: persona.pillarTwoBani,
    pillarThreeBani: 0,
  })
  const startLevel = firstLevelOfTier(tierFromRatio(income.replacementRatio))
  const contributions = jars
    .filter((jar) => ['accepted', 'collected', 'invested'].includes(jar.status))
    .map((jar) => ({ month: jar.month, amountBani: jar.accepted_amount_bani ?? 0 }))
  const state = levelState(startLevel, xpFromContributions(contributions, persona.salaryBani))

  unwrap(await db.from('profiles').update({ last_seen_level: state.level, start_level: startLevel }).eq('id', userId))
  return { jars, income, startLevel, state }
}

// The admin account (ADMIN_EMAIL / ADMIN_PASSWORD): a finished, minimal profile so it can
// open /app, where it sees the Admin button. Created once, its password kept in sync.
const ADMIN_PROFILE = { birthYear: 1990, netSalaryBani: 650000, yearsWorked: 12 }

async function upsertAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminEmail || !adminPassword) {
    console.log('No ADMIN_EMAIL / ADMIN_PASSWORD in .env.local: skipping the admin account')
    return
  }
  const { users } = unwrap(await db.auth.admin.listUsers({ perPage: 1000 }))
  let adminId = users.find((user) => user.email === adminEmail)?.id
  if (adminId) {
    unwrap(await db.auth.admin.updateUserById(adminId, { password: adminPassword }))
  } else {
    const { user } = unwrap(
      await db.auth.admin.createUser({ email: adminEmail, password: adminPassword, email_confirm: true, user_metadata: { full_name: 'zile. Admin' } }),
    )
    adminId = user!.id
  }

  const income = projectedRetirementIncome({
    age: Number(CURRENT_MONTH.slice(0, 4)) - ADMIN_PROFILE.birthYear,
    netSalaryBani: ADMIN_PROFILE.netSalaryBani,
    yearsWorked: ADMIN_PROFILE.yearsWorked,
    pillarTwoBani: 0,
    pillarThreeBani: 0,
  })
  const startLevel = firstLevelOfTier(tierFromRatio(income.replacementRatio))
  unwrap(
    await db
      .from('profiles')
      .update({
        birth_year: ADMIN_PROFILE.birthYear,
        net_salary_bani: ADMIN_PROFILE.netSalaryBani,
        years_worked: ADMIN_PROFILE.yearsWorked,
        start_level: startLevel,
        last_seen_level: startLevel,
        onboarding_completed: true,
        terms_accepted_at: new Date().toISOString(),
      })
      .eq('id', adminId),
  )
  console.log(`Admin account ready: ${adminEmail}`)
}

async function main() {
  await upsertAdminUser()
  const userId = await recreateDemoUser()
  await seedProducts()
  await seedProfile(userId)
  await seedTransactions(userId)
  await seedJars(userId)
  const { jars, income, startLevel, state } = await markLevelSeen(userId)

  console.log(`Seeded demo user ${email}`)
  console.table(
    jars.map((jar) => ({
      month: jar.month,
      status: jar.status,
      amount: jar.accepted_amount_bani ? formatRon(jar.accepted_amount_bani) : '-',
      interest: formatRon(jar.float_interest_bani),
    })),
  )
  console.log(
    `Replacement ratio ${(income.replacementRatio * 100).toFixed(1)}% → start level ${startLevel}; ` +
      `now level ${state.level} (${state.xpIntoLevel}/${state.xpForNext} XP), next: ${state.next?.slot}`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
