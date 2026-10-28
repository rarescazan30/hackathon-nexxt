// Turns a user's DB rows into the numbers the app shows: days of freedom, starting tier,
// XP and level. Pure (no DB calls), so the loader, the server actions and the seed agree.
// Relative imports so scripts can use it with jiti.
import {
  daysAddedFromAmount,
  daysOfFreedomFromSalary,
  firstLevelOfTier,
  levelState,
  projectedRetirementIncome,
  tierFromRatio,
  xpFromContributions,
  type Contribution,
  type LevelState,
  type RetirementIncome,
} from '../rules'

/** Jar statuses that count as "the user put this money in". */
export const CONTRIBUTED_STATUSES = ['accepted', 'collected', 'invested'] as const

export interface LifestyleInput {
  birthYear: number | null
  netSalaryBani: number | null
  yearsWorked: number | null
  assets: { type: string; balance_bani: number }[]
  jars: { month: string; status: string; accepted_amount_bani: number | null }[]
  /** Defaults to the current year. */
  year?: number
}

export interface LifestyleNumbers {
  age: number
  income: RetirementIncome
  startLevel: number
  contributions: Contribution[]
  contributedBani: number
  level: LevelState
  /** Days of retirement covered by all private savings (assets + contributions). */
  totalDays: number
  /** The part of totalDays added through the app. */
  daysFromApp: number
}

function sumBalances(assets: LifestyleInput['assets'], type: string) {
  return assets.filter((asset) => asset.type === type).reduce((sum, asset) => sum + asset.balance_bani, 0)
}

export function lifestyleNumbers(input: LifestyleInput): LifestyleNumbers {
  const year = input.year ?? new Date().getFullYear()
  const age = input.birthYear ? year - input.birthYear : 35
  const salary = input.netSalaryBani ?? 0

  const income = projectedRetirementIncome({
    age,
    netSalaryBani: salary,
    yearsWorked: input.yearsWorked ?? 0,
    pillarTwoBani: sumBalances(input.assets, 'pillar2'),
    pillarThreeBani: sumBalances(input.assets, 'pillar3'),
  })
  const startLevel = firstLevelOfTier(tierFromRatio(income.replacementRatio))

  const contributions = input.jars
    .filter((jar) => (CONTRIBUTED_STATUSES as readonly string[]).includes(jar.status))
    .map((jar) => ({ month: jar.month, amountBani: jar.accepted_amount_bani ?? 0 }))
  const contributedBani = contributions.reduce((sum, c) => sum + c.amountBani, 0)
  const level = levelState(startLevel, xpFromContributions(contributions, salary))

  const assetsBani = input.assets.reduce((sum, asset) => sum + asset.balance_bani, 0)
  return {
    age,
    income,
    startLevel,
    contributions,
    contributedBani,
    level,
    totalDays: daysOfFreedomFromSalary(assetsBani + contributedBani, salary).base,
    daysFromApp: daysAddedFromAmount(contributedBani, salary).base,
  }
}
