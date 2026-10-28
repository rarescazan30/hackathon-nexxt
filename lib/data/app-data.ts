// Loads everything the /app screens show, for the logged-in user (RLS does the filtering).
// The screens get this object as props; they never fetch on their own.
import { redirect } from 'next/navigation'
import { daysAtRetirement, roundUp, slotUnlockedAt, type LevelState, type RetirementIncome, type Slot } from '@/lib/rules'
import { isAdminEmail } from '@/lib/server/admin'
import { stripeIsConfigured } from '@/lib/server/stripe'
import { createClient } from '@/lib/supabase/server'
import { lifestyleNumbers } from './lifestyle-state'

const YEAR_MS = 365 * 86_400_000
/** Months of payment history shown before the open month (what the bank sends: ~90 days). */
const PAYMENT_HISTORY_MONTHS = 3

/** '2026-10', -3 → '2026-07' */
function addMonths(month: string, delta: number) {
  const [year, monthNumber] = month.split('-').map(Number)
  return new Date(Date.UTC(year, monthNumber - 1 + delta, 1)).toISOString().slice(0, 7)
}

export interface CardPayment {
  id: string
  month: string
  date: string
  counterparty: string
  spentBani: number
  /** The round-up this payment gives under the current rule. */
  roundupBani: number
  /** Paid before the user's first month in the app: shown as "what you could have saved". */
  beforeJoining: boolean
}

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
  user: { firstName: string; fullName: string; email: string; isAdmin: boolean }
  settings: {
    netSalaryBani: number
    birthYear: number | null
    yearsWorked: number | null
    roundupRuleBani: number
    salaryPercentBp: number
    cardLinked: boolean
    /** Open Banking (demo): the bank and card the user connected. */
    bank: { name: string; last4: string } | null
    /** The saved payment card (Stripe), e.g. { brand: 'visa', last4: '4242' }. */
    card: { brand: string; last4: string } | null
    /** Stripe test keys are set, so cards can be added and charged. */
    cardPaymentsReady: boolean
  }
  freedom: { totalDays: number; daysFromApp: number }
  retirement: RetirementIncome
  level: LevelState
  /** Set when the user reached a level they haven't seen yet: play the level-up. */
  levelUp: { level: number; slot: Slot } | null
  /** The newest jar: this month's counter or offer. */
  currentJar: JarSummary | null
  /** Card payments of the open month and the 3 before it, newest first. */
  payments: CardPayment[]
  history: JarSummary[]
  pensions: { id: string; type: string; provider: string | null; balanceBani: number; asOf: string }[]
  /** The newest statement is over a year old: funds have sent a new one by now. */
  statementIsOld: boolean
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
    storedStartLevel: profile.start_level,
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
    daysAdded: daysAtRetirement(jar.accepted_amount_bani ?? jar.total_bani, salary, numbers.income),
  })
  const [current, ...past] = jars

  // Card payments of the last few months (from the bank connection or a bank statement),
  // each with the round-up it gives under today's rule. Only the open month's count for the
  // piggy bank; older ones are history ("before LifeGrowth" when there was no month yet).
  const openMonth = current?.month ?? new Date().toISOString().slice(0, 7)
  const { data: paymentRows } = await supabase
    .from('transactions')
    .select('id, booked_at, counterparty, amount_bani')
    .eq('is_card_payment', true)
    .lt('amount_bani', 0)
    .gte('booked_at', `${addMonths(openMonth, -PAYMENT_HISTORY_MONTHS)}-01`)
    .lt('booked_at', `${addMonths(openMonth, 1)}-01`)
    .order('booked_at', { ascending: false })
  const firstMonth = jars.length > 0 ? jars[jars.length - 1].month : openMonth
  const payments = (paymentRows ?? []).map((row) => ({
    id: row.id,
    month: row.booked_at.slice(0, 7),
    date: row.booked_at,
    counterparty: row.counterparty ?? 'Card payment',
    spentBani: -row.amount_bani,
    roundupBani: roundUp(-row.amount_bani, { stepBani: profile.roundup_rule_bani, multiplier: profile.roundup_multiplier }),
    beforeJoining: row.booked_at.slice(0, 7) < firstMonth,
  }))

  const fullName = profile.full_name ?? auth.user.email ?? 'there'
  const level = numbers.level.level
  return {
    onboardingCompleted: true,
    data: {
      user: { firstName: fullName.split(' ')[0], fullName, email: auth.user.email ?? '', isAdmin: isAdminEmail(auth.user.email) },
      settings: {
        netSalaryBani: salary,
        birthYear: profile.birth_year,
        yearsWorked: profile.years_worked,
        roundupRuleBani: profile.roundup_rule_bani,
        salaryPercentBp: profile.salary_percent_bp,
        cardLinked: profile.card_linked,
        bank: profile.card_linked && profile.bank_name && profile.bank_card_last4 ? { name: profile.bank_name, last4: profile.bank_card_last4 } : null,
        card: profile.card_last4 ? { brand: profile.card_brand ?? 'card', last4: profile.card_last4 } : null,
        cardPaymentsReady: stripeIsConfigured(),
      },
      freedom: { totalDays: numbers.totalDays, daysFromApp: numbers.daysFromApp },
      retirement: numbers.income,
      level: numbers.level,
      levelUp: level > profile.last_seen_level ? { level, slot: slotUnlockedAt(level) } : null,
      currentJar: current ? toSummary(current) : null,
      payments,
      history: past.map(toSummary),
      pensions: assets.map((asset) => ({
        id: asset.id,
        type: asset.type,
        provider: asset.provider,
        balanceBani: asset.balance_bani,
        asOf: asset.as_of,
      })),
      statementIsOld: assets.length > 0 && Date.parse(assets[0].as_of) < Date.now() - YEAR_MS,
      contributedBani: numbers.contributedBani,
    },
  }
}
