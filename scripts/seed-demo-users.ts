// `npm run seed:demo-users`: fills the admin panel with fictional savers, so /admin shows
// what the business looks like after ~10 months. `npm run seed:demo-users -- --remove` deletes them.
//
// Everything is fictional (emails @lifegrowth.test, invented names). Numbers are on the
// optimistic side but stay realistic: net salaries 5,500–14,000 RON, 4–6% of salary saved
// plus round-ups, ~93% of month-end offers accepted, 5%/year on the month we hold the money.
import fs from 'node:fs'
import { floatInterestBani } from '../lib/rules'
import { oneMonthLater } from '../lib/server/money-flow'
import { unwrap } from '../lib/server/unwrap'
import { createAdminClient } from '../lib/supabase/admin'

for (const file of ['.env.local', '.env']) {
  if (fs.existsSync(file)) process.loadEnvFile(file)
}
const db = createAdminClient()

const EMAIL_DOMAIN = '@lifegrowth.test'
const EMAIL_PREFIX = 'saver-'
const CURRENT_MONTH = '2026-10'
// New savers per month, January → October 2026: steady word-of-mouth growth.
const SIGNUPS = [
  ['2026-01', 8], ['2026-02', 11], ['2026-03', 15], ['2026-04', 20], ['2026-05', 27],
  ['2026-06', 34], ['2026-07', 42], ['2026-08', 51], ['2026-09', 60], ['2026-10', 70],
] as const

const JAR_DEFAULTS = {
  accepted_amount_bani: null,
  collected_at: null,
  invest_on: null,
  invested_at: null,
  float_interest_bani: 0,
  payment_status: null,
}

const FIRST_NAMES = ['Ana', 'Mihai', 'Ioana', 'Andrei', 'Elena', 'Radu', 'Maria', 'Vlad', 'Cristina', 'Bogdan', 'Alexandra', 'Tudor', 'Diana', 'Stefan', 'Raluca', 'Paul', 'Irina', 'Dan', 'Larisa', 'Sorin']
const LAST_NAMES = ['Popa', 'Ionescu', 'Stan', 'Dumitru', 'Matei', 'Constantin', 'Marin', 'Tudor', 'Florea', 'Lungu', 'Munteanu', 'Barbu', 'Ene', 'Nistor', 'Oprea']

/** Deterministic pseudo-random numbers: the same demo every time it's seeded. */
function random(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}
const between = (seed: number, min: number, max: number) => Math.round(min + random(seed) * (max - min))

function monthsFrom(start: string) {
  const months: string[] = []
  let month = start
  while (month <= CURRENT_MONTH) {
    months.push(month)
    month = oneMonthLater(`${month}-01`).slice(0, 7)
  }
  return months
}

async function existingDemoUsers() {
  const users = []
  for (let page = 1; ; page++) {
    const { users: batch } = unwrap(await db.auth.admin.listUsers({ page, perPage: 1000 }))
    users.push(...batch.filter((user) => user.email?.startsWith(EMAIL_PREFIX) && user.email.endsWith(EMAIL_DOMAIN)))
    if (batch.length < 1000) return users
  }
}

async function removeDemoUsers() {
  const users = await existingDemoUsers()
  for (const user of users) unwrap(await db.auth.admin.deleteUser(user.id)) // their rows cascade
  console.log(`Removed ${users.length} demo savers`)
}

async function createDemoUsers() {
  let n = 0
  let jarsCreated = 0
  for (const [signupMonth, count] of SIGNUPS) {
    for (let i = 0; i < count; i++, n++) {
      const name = `${FIRST_NAMES[n % FIRST_NAMES.length]} ${LAST_NAMES[(n * 7) % LAST_NAMES.length]}`
      const { user } = unwrap(
        await db.auth.admin.createUser({
          email: `${EMAIL_PREFIX}${String(n + 1).padStart(3, '0')}${EMAIL_DOMAIN}`,
          password: crypto.randomUUID(), // nobody logs in as a demo saver
          email_confirm: true,
          user_metadata: { full_name: name },
        }),
      )
      const salaryBani = between(n + 1, 5500, 14000) * 100
      const sharePercent = between(n + 2, 4, 6)
      unwrap(
        await db
          .from('profiles')
          .update({
            birth_year: between(n + 3, 1984, 1996),
            net_salary_bani: salaryBani,
            years_worked: between(n + 4, 6, 16),
            roundup_rule_bani: [500, 500, 1000][n % 3],
            salary_percent_bp: sharePercent * 100,
            card_linked: true,
            bank_name: 'Demo Bank',
            bank_card_last4: String(between(n + 5, 1000, 9999)),
            onboarding_completed: true,
            start_level: 9,
            last_seen_level: 9,
            terms_accepted_at: `${signupMonth}-03T10:00:00Z`,
          })
          .eq('id', user!.id),
      )

      // One jar per month since signing up. The month before this one is held by us now
      // ("collected"); older ones are already in Pillar III with the interest recorded.
      const rows = monthsFrom(signupMonth).map((month, m) => {
        const roundupsBani = between(n * 31 + m, 6000, 14000)
        const salaryShareBani = Math.round((salaryBani * sharePercent) / 100)
        const totalBani = roundupsBani + salaryShareBani
        const base = { user_id: user!.id, month, roundups_bani: roundupsBani, salary_bani: salaryShareBani, total_bani: totalBani }
        if (month === CURRENT_MONTH) return { ...base, status: 'open' as const }
        if (random(n * 17 + m) < 0.07) return { ...base, status: 'declined' as const }

        // Some savers add more than suggested (up to 1.5×).
        const acceptedBani = random(n * 13 + m) < 0.2 ? Math.round(totalBani * 1.5) : totalBani
        const collectedOn = oneMonthLater(`${month}-01`)
        const investOn = oneMonthLater(collectedOn)
        if (investOn > `${CURRENT_MONTH}-28`) {
          return { ...base, status: 'collected' as const, accepted_amount_bani: acceptedBani, collected_at: `${collectedOn}T09:00:00Z`, invest_on: investOn, payment_status: 'succeeded' }
        }
        const daysHeld = Math.round((Date.parse(investOn) - Date.parse(collectedOn)) / 86_400_000)
        return {
          ...base,
          status: 'invested' as const,
          accepted_amount_bani: acceptedBani,
          collected_at: `${collectedOn}T09:00:00Z`,
          invest_on: investOn,
          invested_at: `${investOn}T09:05:00Z`,
          float_interest_bani: floatInterestBani(acceptedBani, daysHeld),
          payment_status: 'succeeded',
        }
      })
      // Every row gets the same keys, so a bulk insert never turns a missing key into null.
      const normalised = rows.map((row) => ({ ...JAR_DEFAULTS, ...row }))
      unwrap(await db.from('monthly_jars').insert(normalised))
      jarsCreated += rows.length
    }
    console.log(`${signupMonth}: ${count} new savers`)
  }
  console.log(`Created ${n} demo savers and ${jarsCreated} months`)
}

async function main() {
  await removeDemoUsers() // start clean every time
  if (!process.argv.includes('--remove')) await createDemoUsers()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
