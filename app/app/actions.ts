'use server'

// What the /app buttons do. The user id always comes from the session, never from the
// browser. Jar changes go through lib/server/money-flow.ts with the admin client.
import { refresh } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { monthlyOfferMessage } from '@/lib/ai'
import { lifestyleNumbers } from '@/lib/data/lifestyle-state'
import { daysAddedFromAmount, levelState, XP_PER_DAY, STREAK_BONUS_XP } from '@/lib/rules'
import { monthRange, rebuildJar } from '@/lib/server/jar'
import { answerOffer, collectJar, investJar, offerJar } from '@/lib/server/money-flow'
import { unwrap } from '@/lib/server/unwrap'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { slotLabel } from '@/components/scene/slot-labels'

async function requireUserId() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect('/login')
  return data.user.id
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Demo button "Simulate end of month":
 * 1. money we have been holding goes to Pillar III (with the interest recorded),
 * 2. the newest open month becomes an offer, or the next month starts and is offered.
 */
export async function simulateMonthEnd() {
  const userId = await requireUserId()
  const db = createAdminClient()

  const held = unwrap(await db.from('monthly_jars').select('id').eq('user_id', userId).eq('status', 'collected'))
  for (const jar of held) await investJar(db, jar.id)

  const [profile, assets, jars] = await Promise.all([
    db.from('profiles').select('*').eq('id', userId).single().then(unwrap),
    db.from('pension_assets').select('type, balance_bani').eq('user_id', userId).then(unwrap),
    db.from('monthly_jars').select('month, status, accepted_amount_bani').eq('user_id', userId).order('month', { ascending: false }).then(unwrap),
  ])
  const latest = jars[0]
  const month = !latest || latest.status === 'open' || latest.status === 'offered' ? latest?.month : monthRange(latest.month).end.slice(0, 7)
  if (!month) return

  // Facts for the message: what accepting this month's amount would add.
  const jar = await rebuildJar(db, userId, month)
  const salary = profile.net_salary_bani ?? 0
  const numbers = lifestyleNumbers({ birthYear: profile.birth_year, netSalaryBani: salary, yearsWorked: profile.years_worked, assets, jars })
  const daysAdded = daysAddedFromAmount(jar.total_bani, salary).base
  const gainedXp = daysAdded * XP_PER_DAY + (numbers.contributions.length > 0 ? STREAK_BONUS_XP : 0)
  const after = levelState(numbers.startLevel, numbers.level.xp + gainedXp)
  const next = numbers.level.next

  const message = await monthlyOfferMessage({
    firstName: (profile.full_name ?? 'Hi').split(' ')[0],
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

/** Yes / Another amount / Not this month. On yes, the money is collected right away. */
export async function answerMonthlyOffer(input: z.infer<typeof AnswerInput>) {
  const userId = await requireUserId()
  const { jarId, accept, amountBani } = AnswerInput.parse(input)
  const db = createAdminClient()

  if (!accept) {
    await answerOffer(db, userId, jarId, { accept: false })
  } else {
    const jar = unwrap(await db.from('monthly_jars').select('total_bani').eq('id', jarId).single())
    await answerOffer(db, userId, jarId, { accept: true, amountBani: amountBani ?? jar.total_bani })
    await collectJar(db, jarId, today())
  }
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

  const db = createAdminClient()
  const latest = unwrap(await db.from('monthly_jars').select('month, status').eq('user_id', userId).order('month', { ascending: false }).limit(1))
  if (latest[0] && (latest[0].status === 'open' || latest[0].status === 'offered')) {
    await rebuildJar(db, userId, latest[0].month)
  }
  refresh()
}
