// Company numbers for /admin: savers, money we hold, money brought to Pillar III, and the
// interest it earns (the business model). Totals only, never names. Server only.
import { createAdminClient } from '@/lib/supabase/admin'
import { CONTRIBUTED_STATUSES } from './lifestyle-state'

const MONTHS_PER_YEAR = 12
const HELD_STATUSES = ['accepted', 'collected']
// Supabase returns at most 1,000 rows per request, so bigger tables are read in pages.
const PAGE_SIZE = 1000

export interface MonthPoint {
  month: string
  value: number
}

export interface AdminStats {
  users: { registered: number; onboarded: number; cardLinked: number }
  /** People who added money at least once. */
  savers: number
  /** Members (anyone with a month in the app) who joined this month. */
  newMembersThisMonth: number
  /** Total members at the end of each month (up to the current month). */
  membersByMonth: MonthPoint[]
  /** Members this month vs last month, e.g. 0.3 = +30%. */
  memberGrowth: number
  /** Accepted / collected amounts not yet sent to Pillar III. */
  heldNowBani: number
  /** Everything savers added through us (it ends up in Pillar III). */
  broughtToPillarThreeBani: number
  /** Money added per month (bani). */
  contributionsByMonth: MonthPoint[]
  interest: { totalBani: number; thisMonthBani: number; byMonth: MonthPoint[] }
  /** This month's interest × 12. */
  annualRunRateBani: number
  /** Annual run-rate ÷ savers. */
  revenuePerSaverYearBani: number
  averageContributionBani: number
  /** Share of answered offers that were accepted, 0..1. */
  acceptanceRate: number
}

type JarRow = { user_id: string; month: string; status: string; accepted_amount_bani: number | null; float_interest_bani: number; invested_at: string | null }

async function allJars() {
  const db = createAdminClient()
  const rows: JarRow[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await db
      .from('monthly_jars')
      .select('user_id, month, status, accepted_amount_bani, float_interest_bani, invested_at')
      .order('id')
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw error
    rows.push(...data)
    if (data.length < PAGE_SIZE) return rows
  }
}

function sumBy(rows: JarRow[], key: (row: JarRow) => string | null, value: (row: JarRow) => number): MonthPoint[] {
  const totals = new Map<string, number>()
  for (const row of rows) {
    const month = key(row)
    if (month) totals.set(month, (totals.get(month) ?? 0) + value(row))
  }
  return [...totals.entries()].map(([month, total]) => ({ month, value: total })).sort((a, b) => a.month.localeCompare(b.month))
}

export async function getAdminStats(): Promise<AdminStats> {
  const db = createAdminClient()
  const [profilesResult, jars] = await Promise.all([db.from('profiles').select('onboarding_completed, card_linked').range(0, 9999), allJars()])
  if (profilesResult.error) throw profilesResult.error
  const profiles = profilesResult.data
  const currentMonth = new Date().toISOString().slice(0, 7)

  const contributed = jars.filter((jar) => (CONTRIBUTED_STATUSES as readonly string[]).includes(jar.status))
  const declined = jars.filter((jar) => jar.status === 'declined').length
  const broughtToPillarThreeBani = contributed.reduce((sum, jar) => sum + (jar.accepted_amount_bani ?? 0), 0)

  // A member's first month = the month of their first jar.
  const firstMonth = new Map<string, string>()
  for (const jar of jars) {
    const known = firstMonth.get(jar.user_id)
    if (!known || jar.month < known) firstMonth.set(jar.user_id, jar.month)
  }
  const saverIds = new Set(contributed.map((jar) => jar.user_id))
  const joins = [...firstMonth.values()]
  // Charts stop at the current month (demo "Simulate end of month" can create future months).
  const months = [...new Set(jars.map((jar) => jar.month))].filter((month) => month <= currentMonth).sort()
  const membersByMonth = months.map((month) => ({ month, value: joins.filter((joined) => joined <= month).length }))
  const [previous, latest] = membersByMonth.slice(-2).map((point) => point.value)
  const memberGrowth = previous && latest ? latest / previous - 1 : 0

  // Interest counts in the month we earned it: when the money went on to Pillar III.
  const interestByMonth = sumBy(
    jars.filter((jar) => jar.float_interest_bani > 0),
    (jar) => jar.invested_at?.slice(0, 7) ?? jar.month,
    (jar) => jar.float_interest_bani,
  ).filter((point) => point.month <= currentMonth)
  const thisMonthBani = interestByMonth.find((point) => point.month === currentMonth)?.value ?? 0
  const annualRunRateBani = thisMonthBani * MONTHS_PER_YEAR

  return {
    users: {
      registered: profiles.length,
      onboarded: profiles.filter((p) => p.onboarding_completed).length,
      cardLinked: profiles.filter((p) => p.card_linked).length,
    },
    savers: saverIds.size,
    newMembersThisMonth: joins.filter((month) => month === currentMonth).length,
    membersByMonth,
    memberGrowth,
    heldNowBani: jars.filter((jar) => HELD_STATUSES.includes(jar.status)).reduce((sum, jar) => sum + (jar.accepted_amount_bani ?? 0), 0),
    broughtToPillarThreeBani,
    contributionsByMonth: sumBy(contributed, (jar) => jar.month, (jar) => jar.accepted_amount_bani ?? 0).filter((point) => point.month <= currentMonth),
    interest: {
      totalBani: interestByMonth.reduce((sum, point) => sum + point.value, 0),
      thisMonthBani,
      byMonth: interestByMonth,
    },
    annualRunRateBani,
    revenuePerSaverYearBani: saverIds.size > 0 ? Math.round(annualRunRateBani / saverIds.size) : 0,
    averageContributionBani: contributed.length > 0 ? Math.round(broughtToPillarThreeBani / contributed.length) : 0,
    acceptanceRate: contributed.length + declined > 0 ? contributed.length / (contributed.length + declined) : 0,
  }
}
