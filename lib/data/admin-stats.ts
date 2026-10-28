// Company numbers for /admin: users, money we hold, and the interest it earns (the
// business model). Totals only, never names. Server only (admin client, all users).
import { createAdminClient } from '@/lib/supabase/admin'
import { CONTRIBUTED_STATUSES } from './lifestyle-state'

export interface AdminStats {
  users: { registered: number; onboarded: number; cardLinked: number }
  /** Accepted / collected amounts not yet sent to Pillar III. */
  heldNowBani: number
  interest: { totalBani: number; thisMonthBani: number; byMonth: { month: string; bani: number }[] }
  contributions: { count: number; totalBani: number; averageBani: number }
  /** Share of answered offers that were accepted, 0..1. */
  acceptanceRate: number
}

const HELD_STATUSES = ['accepted', 'collected']

export async function getAdminStats(): Promise<AdminStats> {
  const db = createAdminClient()
  const [profiles, jars] = await Promise.all([
    db.from('profiles').select('onboarding_completed, card_linked'),
    db.from('monthly_jars').select('month, status, accepted_amount_bani, float_interest_bani, invested_at'),
  ])
  if (profiles.error) throw profiles.error
  if (jars.error) throw jars.error

  const contributed = jars.data.filter((jar) => (CONTRIBUTED_STATUSES as readonly string[]).includes(jar.status))
  const declined = jars.data.filter((jar) => jar.status === 'declined').length
  const totalContributed = contributed.reduce((sum, jar) => sum + (jar.accepted_amount_bani ?? 0), 0)

  // Interest counts in the month we earned it: when the money went on to Pillar III.
  const interestByMonth = new Map<string, number>()
  for (const jar of jars.data) {
    if (jar.float_interest_bani <= 0) continue
    const month = jar.invested_at?.slice(0, 7) ?? jar.month
    interestByMonth.set(month, (interestByMonth.get(month) ?? 0) + jar.float_interest_bani)
  }
  const byMonth = [...interestByMonth.entries()].map(([month, bani]) => ({ month, bani })).sort((a, b) => a.month.localeCompare(b.month))
  const currentMonth = new Date().toISOString().slice(0, 7)

  return {
    users: {
      registered: profiles.data.length,
      onboarded: profiles.data.filter((p) => p.onboarding_completed).length,
      cardLinked: profiles.data.filter((p) => p.card_linked).length,
    },
    heldNowBani: jars.data.filter((jar) => HELD_STATUSES.includes(jar.status)).reduce((sum, jar) => sum + (jar.accepted_amount_bani ?? 0), 0),
    interest: {
      totalBani: byMonth.reduce((sum, row) => sum + row.bani, 0),
      thisMonthBani: interestByMonth.get(currentMonth) ?? 0,
      byMonth,
    },
    contributions: {
      count: contributed.length,
      totalBani: totalContributed,
      averageBani: contributed.length > 0 ? Math.round(totalContributed / contributed.length) : 0,
    },
    acceptanceRate: contributed.length + declined > 0 ? contributed.length / (contributed.length + declined) : 0,
  }
}
