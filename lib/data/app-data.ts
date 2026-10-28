// Loads everything the /app screens show, for the logged-in user (RLS does the filtering).
// The screens get this object as props; they never fetch on their own.
import { redirect } from 'next/navigation'
import { daysAddedFromAmount, slotUnlockedAt, type LevelState, type RetirementIncome, type Slot } from '@/lib/rules'
import { createClient } from '@/lib/supabase/server'
import { lifestyleNumbers } from './lifestyle-state'

export interface JarSummary {
  id: string
  month: string
  status: string
  roundupsBani: number
  salaryBani: number
  totalBani: number
  acceptedAmountBani: number | null
  offerMessage: string | null
  investOn: string | null
  interestBani: number
  daysAdded: number
}

export interface AppData {
  user: { firstName: string; fullName: string; email: string }
  settings: { netSalaryBani: number; roundupRuleBani: number; salaryPercentBp: number }
  freedom: { totalDays: number; daysFromApp: number }
  retirement: RetirementIncome
  level: LevelState
  /** Set when the user reached a level they haven't seen yet: play the level-up. */
  levelUp: { level: number; slot: Slot } | null
  /** The newest jar: this month's counter or offer. */
  currentJar: JarSummary | null
  roundups: { id: string; date: string; counterparty: string; spentBani: number; roundupBani: number }[]
  history: JarSummary[]
  pensions: { id: string; type: string; provider: string | null; balanceBani: number; asOf: string }[]
  contributedBani: number
}

export interface AppDataResult {
  data: AppData | null
  onboardingCompleted: boolean
}

export async function getAppData(): Promise<AppDataResult> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect('/login')

  const [profileResult, assetsResult, jarsResult] = await Promise.all([
    supabase.from('profiles').select('*').single(),
    supabase.from('pension_assets').select('*').order('as_of', { ascending: false }),
    supabase.from('monthly_jars').select('*').order('month', { ascending: false }),
  ])
  const profile = profileResult.data
  if (!profile || !profile.onboarding_completed) return { data: null, onboardingCompleted: false }

  const assets = assetsResult.data ?? []
  const jars = jarsResult.data ?? []
  const salary = profile.net_salary_bani ?? 0
  const numbers = lifestyleNumbers({
    birthYear: profile.birth_year,
    netSalaryBani: salary,
    yearsWorked: profile.years_worked,
    assets,
    jars,
  })

  const toSummary = (jar: (typeof jars)[number]): JarSummary => ({
    id: jar.id,
    month: jar.month,
    status: jar.status,
    roundupsBani: jar.roundups_bani,
    salaryBani: jar.salary_bani,
    totalBani: jar.total_bani,
    acceptedAmountBani: jar.accepted_amount_bani,
    offerMessage: jar.offer_message,
    investOn: jar.invest_on,
    interestBani: jar.float_interest_bani,
    daysAdded: daysAddedFromAmount(jar.accepted_amount_bani ?? jar.total_bani, salary).base,
  })
  const [current, ...past] = jars

  // This month's round-ups with the payment they came from.
  const { data: roundupRows } = current
    ? await supabase
        .from('roundups')
        .select('id, amount_bani, transactions(booked_at, counterparty, amount_bani)')
        .eq('month', current.month)
    : { data: [] }
  const roundups = (roundupRows ?? [])
    .map((row) => ({
      id: row.id,
      date: row.transactions?.booked_at ?? '',
      counterparty: row.transactions?.counterparty ?? 'Card payment',
      spentBani: -(row.transactions?.amount_bani ?? 0),
      roundupBani: row.amount_bani,
    }))
    .sort((a, b) => b.date.localeCompare(a.date))

  const fullName = profile.full_name ?? auth.user.email ?? 'there'
  const level = numbers.level.level
  return {
    onboardingCompleted: true,
    data: {
      user: { firstName: fullName.split(' ')[0], fullName, email: auth.user.email ?? '' },
      settings: { netSalaryBani: salary, roundupRuleBani: profile.roundup_rule_bani, salaryPercentBp: profile.salary_percent_bp },
      freedom: { totalDays: numbers.totalDays, daysFromApp: numbers.daysFromApp },
      retirement: numbers.income,
      level: numbers.level,
      levelUp: level > profile.last_seen_level ? { level, slot: slotUnlockedAt(level) } : null,
      currentJar: current ? toSummary(current) : null,
      roundups,
      history: past.map(toSummary),
      pensions: assets.map((asset) => ({
        id: asset.id,
        type: asset.type,
        provider: asset.provider,
        balanceBani: asset.balance_bani,
        asOf: asset.as_of,
      })),
      contributedBani: numbers.contributedBani,
    },
  }
}
