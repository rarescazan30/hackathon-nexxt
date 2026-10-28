'use server'

// What the /app buttons do. The user id always comes from the session, never from the
// browser. Jar changes go through lib/server/money-flow.ts with the admin client.
import { refresh } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { monthlyOfferMessage } from '@/lib/ai'
import { getAppData } from '@/lib/data/app-data'
import { lifestyleNumbers } from '@/lib/data/lifestyle-state'
import { daysAtRetirement, levelState, XP_PER_DAY, STREAK_BONUS_XP } from '@/lib/rules'
import { monthRange, rebuildJar } from '@/lib/server/jar'
import { importBankHistory, importMockMonth } from '@/lib/server/mock-bank'
import { answerOffer, collectJar, investJar, offerJar } from '@/lib/server/money-flow'
import { BankChoice, ProfileDataInput, saveProfileData } from '@/lib/server/profile-data'
import { unwrap } from '@/lib/server/unwrap'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { slotLabel } from '@/components/scene/slot-labels'
import { monthName } from '@/components/app/types'

async function requireUserId() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect('/login')
  return data.user.id
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

/** '2026-10' → '2026-11' */
function nextMonth(month: string) {
  return monthRange(month).end.slice(0, 7)
}

/**
 * Demo button "Simulate end of month":
 * 1. money we have been holding goes to Pillar III (with the interest recorded),
 * 2. the mock bank delivers the whole month's card payments (card-linked users),
 * 3. the newest open month becomes an offer, or the next month starts and is offered.
 */
export async function simulateMonthEnd() {
  const userId = await requireUserId()
  const db = createAdminClient()

  const held = unwrap(await db.from('monthly_jars').select('id').eq('user_id', userId).eq('status', 'collected'))
  for (const jar of held) await investJar(db, jar.id)

  const [profile, assets, jars] = await Promise.all([
    db.from('profiles').select('*').eq('id', userId).single().then(unwrap),
    db.from('pension_assets').select('type, balance_bani, as_of').eq('user_id', userId).then(unwrap),
    db.from('monthly_jars').select('month, status, accepted_amount_bani, invested_at').eq('user_id', userId).order('month', { ascending: false }).then(unwrap),
  ])
  const latest = jars[0]
  const month = !latest || latest.status === 'open' || latest.status === 'offered' ? latest?.month : nextMonth(latest.month)
  if (!month) return

  const salary = profile.net_salary_bani ?? 0
  if (profile.card_linked) await importMockMonth(db, userId, month, salary, { includeSalary: false })

  // Facts for the message: what accepting this month's amount would add.
  const jar = await rebuildJar(db, userId, month)
  const numbers = lifestyleNumbers({
    birthYear: profile.birth_year,
    netSalaryBani: salary,
    yearsWorked: profile.years_worked,
    assets,
    jars,
    storedStartLevel: profile.start_level,
  })
  const daysAdded = daysAtRetirement(jar.total_bani, salary, numbers.income)
  const gainedXp = daysAdded * XP_PER_DAY + (numbers.contributions.length > 0 ? STREAK_BONUS_XP : 0)
  const after = levelState(numbers.startLevel, numbers.level.xp + gainedXp)
  const next = numbers.level.next

  const message = await monthlyOfferMessage({
    firstName: (profile.full_name ?? 'Hi').split(' ')[0],
    month: monthName(month).split(' ')[0],
    amountBani: jar.total_bani,
    daysAdded,
    nextUnlock: next ? slotLabel(next.slot, next.tier) : null,
    levelUpNow: after.level > numbers.level.level,
  })
  await offerJar(db, userId, month, message)
  refresh()
}

const AnswerInput = z.object({
  jarId: z.uuid(),
  accept: z.boolean(),
  amountBani: z.number().int().positive().optional(),
})

/**
 * Yes / Another amount / Not this month. On yes, the money is collected right away.
 * Then the next month opens at once, so the counter (and any settings change) applies to it.
 */
export async function answerMonthlyOffer(input: z.infer<typeof AnswerInput>) {
  const userId = await requireUserId()
  const { jarId, accept, amountBani } = AnswerInput.parse(input)
  const db = createAdminClient()

  const jar = unwrap(await db.from('monthly_jars').select('month, total_bani').eq('id', jarId).eq('user_id', userId).single())
  if (!accept) {
    await answerOffer(db, userId, jarId, { accept: false })
  } else {
    await answerOffer(db, userId, jarId, { accept: true, amountBani: amountBani ?? jar.total_bani })
    await collectJar(db, jarId, today())
  }
  await rebuildJar(db, userId, nextMonth(jar.month))
  refresh()
}

/** The level-up overlay was shown: don't show it again for this level. */
export async function markLevelSeen(level: number) {
  const userId = await requireUserId()
  const supabase = await createClient()
  const safeLevel = z.number().int().min(1).max(20).parse(level)
  unwrap(await supabase.from('profiles').update({ last_seen_level: safeLevel }).eq('id', userId))
}

const SettingsInput = z.object({
  roundupRuleBani: z.union([z.literal(0), z.literal(100), z.literal(500), z.literal(1000)]),
  salaryPercentBp: z.number().int().min(0).max(2000),
})

/** Profile settings; this month's counter is recalculated with the new rule. */
export async function updateSettings(input: z.infer<typeof SettingsInput>) {
  const userId = await requireUserId()
  const settings = SettingsInput.parse(input)
  const supabase = await createClient()
  unwrap(
    await supabase
      .from('profiles')
      .update({ roundup_rule_bani: settings.roundupRuleBani, salary_percent_bp: settings.salaryPercentBp })
      .eq('id', userId),
  )

  await rebuildOpenMonth(userId)
  refresh()
}

/** Recalculates the newest month if the user hasn't answered it yet (settings or salary changed). */
async function rebuildOpenMonth(userId: string) {
  const db = createAdminClient()
  const latest = unwrap(await db.from('monthly_jars').select('month, status').eq('user_id', userId).order('month', { ascending: false }).limit(1))
  if (latest[0] && (latest[0].status === 'open' || latest[0].status === 'offered')) {
    await rebuildJar(db, userId, latest[0].month)
  }
}

/**
 * Profile → "Your details": a new salary, birth year, years worked or pension statement.
 * Same checks and save as onboarding; the level can only go up (see saveProfileData).
 */
export async function updateProfileData(input: ProfileDataInput) {
  const userId = await requireUserId()
  const data = ProfileDataInput.parse(input)
  const supabase = await createClient()

  const [profile, assets] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single().then(unwrap),
    supabase.from('pension_assets').select('type, balance_bani').eq('user_id', userId).then(unwrap),
  ])
  // Users from before start_level existed: their current starting level is the floor.
  const previousStartLevel =
    profile.start_level ??
    lifestyleNumbers({ birthYear: profile.birth_year, netSalaryBani: profile.net_salary_bani, yearsWorked: profile.years_worked, assets, jars: [] })
      .startLevel

  await saveProfileData(supabase, userId, data, previousStartLevel)
  await rebuildOpenMonth(userId) // the salary share depends on the salary
  refresh()
}

const SHARE_IMAGE_MAX_BYTES = 1024 * 1024 // same limit as the share-images bucket
const SHARE_CODE_LENGTH = 10

/** A short random id for /i/<code>; not guessable from the user id. */
function newShareCode() {
  const alphabet = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(SHARE_CODE_LENGTH))
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('')
}

/**
 * "Share my island": saves a public card with the first name, the level and the scene
 * (nothing else: no days, no money), plus the preview picture taken in the browser.
 * Sharing again updates the same link. Returns the link's path, e.g. /i/Ab3dEf9hJk.
 */
export async function createShareLink(formData: FormData): Promise<{ path: string }> {
  const userId = await requireUserId()
  const { data } = await getAppData()
  if (!data) redirect('/onboarding')

  const db = createAdminClient()
  const existing = unwrap(await db.from('share_links').select('code').eq('user_id', userId).maybeSingle())
  const code = existing?.code ?? newShareCode()

  // The picture is optional: without it the link still works, just without a preview image.
  let imagePath: string | null = null
  const image = formData.get('image')
  if (image instanceof File && image.type === 'image/png' && image.size <= SHARE_IMAGE_MAX_BYTES) {
    imagePath = `${code}.png`
    const { error } = await db.storage
      .from('share-images')
      .upload(imagePath, new Uint8Array(await image.arrayBuffer()), { contentType: 'image/png', upsert: true })
    if (error) imagePath = null
  }

  unwrap(
    await db.from('share_links').upsert(
      {
        code,
        user_id: userId,
        first_name: data.user.firstName,
        level: data.level.level,
        slots: data.level.slots,
        ...(imagePath ? { image_path: imagePath } : {}),
      },
      { onConflict: 'user_id' },
    ),
  )
  return { path: `/i/${code}` }
}

/**
 * "Open Banking (demo)" from Profile: remember the bank and card, then the bank sends the
 * last 3 months of payments plus this month so far (like a real PSD2 connection).
 */
export async function connectCard(choice: BankChoice) {
  const userId = await requireUserId()
  const { bankName, cardLast4 } = BankChoice.parse(choice)
  const db = createAdminClient()
  const profile = unwrap(
    await db
      .from('profiles')
      .update({ card_linked: true, bank_name: bankName, bank_card_last4: cardLast4 })
      .eq('id', userId)
      .select('net_salary_bani')
      .single(),
  )
  const latest = unwrap(await db.from('monthly_jars').select('month').eq('user_id', userId).order('month', { ascending: false }).limit(1))[0]
  await importBankHistory(db, userId, latest?.month ?? new Date().toISOString().slice(0, 7), profile.net_salary_bani ?? 0)
  await rebuildOpenMonth(userId)
  refresh()
}
