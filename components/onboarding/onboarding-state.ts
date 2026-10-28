// What the onboarding screens collect, kept as typed text until the last step.
export interface PensionDraft {
  key: string
  kind: 'pillar2' | 'pillar3'
  provider: string
  balanceRon: string
  asOf: string
  uploadId?: string
  source: 'ai' | 'sample' | 'manual'
}

export interface OnboardingDraft {
  pensions: PensionDraft[]
  birthYear: string
  netSalaryRon: string
  yearsWorked: string
  roundupRuleBani: 0 | 100 | 500 | 1000
  salaryPercentBp: number
  cardLinked: boolean
  termsAccepted: boolean
}

export const EMPTY_DRAFT: OnboardingDraft = {
  pensions: [],
  birthYear: '',
  netSalaryRon: '',
  yearsWorked: '',
  roundupRuleBani: 500,
  salaryPercentBp: 300,
  cardLinked: false,
  termsAccepted: false,
}

export function toBani(ron: string) {
  const value = Number(ron.replace(',', '.'))
  return Number.isFinite(value) ? Math.round(value * 100) : NaN
}

export function pensionIsValid(pension: PensionDraft) {
  return toBani(pension.balanceRon) >= 0 && /^\d{4}-\d{2}-\d{2}$/.test(pension.asOf)
}

export function questionsAreValid(draft: OnboardingDraft) {
  const birthYear = Number(draft.birthYear)
  const years = Number(draft.yearsWorked)
  return (
    Number.isInteger(birthYear) && birthYear >= 1940 && birthYear <= 2010 &&
    toBani(draft.netSalaryRon) > 0 &&
    draft.yearsWorked !== '' && Number.isInteger(years) && years >= 0 && years <= 60
  )
}

/** Shared styles, copied from the Profile screen inputs. */
export const INPUT_CLASS =
  'w-full rounded-xl border border-[#e2dfe8] bg-[#f1effa]/40 px-3.5 py-3 text-sm outline-none focus:border-[#6f5cc1] dark:border-[#353042] dark:bg-[#2b253a]/40'
export const LABEL_CLASS = 'mb-1.5 block text-xs font-medium text-[#858090] dark:text-[#a39cab]'
export const PRIMARY_BUTTON =
  'w-full rounded-xl bg-[#33256c] py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50'
export const SECONDARY_BUTTON =
  'w-full rounded-xl border border-[#ddd8e6] py-3 text-sm font-semibold text-[#5f4bb6] transition-colors hover:bg-[#f1effa] disabled:opacity-60 dark:border-[#353042] dark:text-[#a594f0] dark:hover:bg-[#2b253a]'
