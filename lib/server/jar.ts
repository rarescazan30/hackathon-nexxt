// Builds one user's monthly jar: card payments → round-ups → monthly_jars.
// All math comes from lib/rules, so the DB always matches Ana's tests.
// Needs the admin client: round-ups and jars are written by the server, not the user.
// Relative imports (not "@/") so scripts/seed.ts can run this with jiti.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../supabase/database.types'
import { jarTotal, roundUp } from '../rules'

type Db = SupabaseClient<Database>

const BASIS_POINTS = 10_000

// Only a jar the user hasn't answered yet can be recalculated.
const EDITABLE_STATUSES = ['open', 'offered'] as const

/** '2026-10' → { start: '2026-10-01', end: '2026-11-01' } (end is exclusive). */
export function monthRange(month: string) {
  const [year, monthNumber] = month.split('-').map(Number)
  const next = monthNumber === 12 ? `${year + 1}-01` : `${year}-${String(monthNumber + 1).padStart(2, '0')}`
  return { start: `${month}-01`, end: `${next}-01` }
}

export async function rebuildJar(db: Db, userId: string, month: string) {
  const { data: existing } = await db
    .from('monthly_jars')
    .select('*')
    .eq('user_id', userId)
    .eq('month', month)
    .maybeSingle()
  if (existing && !(EDITABLE_STATUSES as readonly string[]).includes(existing.status)) {
    return existing
  }

  const { data: profile, error: profileError } = await db
    .from('profiles')
    .select('roundup_rule_bani, roundup_multiplier, salary_percent_bp, net_salary_bani, monthly_cap_bani')
    .eq('id', userId)
    .single()
  if (profileError) throw profileError

  const { start, end } = monthRange(month)
  const { data: payments, error: paymentsError } = await db
    .from('transactions')
    .select('id, amount_bani')
    .eq('user_id', userId)
    .eq('is_card_payment', true)
    .lt('amount_bani', 0)
    .gte('booked_at', start)
    .lt('booked_at', end)
  if (paymentsError) throw paymentsError

  const roundups = payments
    .map((payment) => ({
      user_id: userId,
      transaction_id: payment.id,
      month,
      amount_bani: roundUp(-payment.amount_bani, {
        stepBani: profile.roundup_rule_bani, // 0 = off → roundUp returns 0
        multiplier: profile.roundup_multiplier,
      }),
    }))
    .filter((row) => row.amount_bani > 0)

  // Replace this month's round-ups, so a changed rule is applied to every payment.
  const { error: deleteError } = await db.from('roundups').delete().eq('user_id', userId).eq('month', month)
  if (deleteError) throw deleteError
  if (roundups.length > 0) {
    const { error } = await db.from('roundups').insert(roundups)
    if (error) throw error
  }

  // The salary share is a % of the salary on the profile, once per month.
  const roundupsBani = jarTotal(roundups.map((row) => row.amount_bani))
  const salaryBani = Math.round(((profile.net_salary_bani ?? 0) * profile.salary_percent_bp) / BASIS_POINTS)
  const totalBani = jarTotal([roundupsBani, salaryBani], profile.monthly_cap_bani ?? undefined)

  const { data: jar, error: jarError } = await db
    .from('monthly_jars')
    .upsert(
      { user_id: userId, month, roundups_bani: roundupsBani, salary_bani: salaryBani, total_bani: totalBani },
      { onConflict: 'user_id,month' },
    )
    .select()
    .single()
  if (jarError) throw jarError
  return jar
}
