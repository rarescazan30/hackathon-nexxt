// Turns a user's DB rows into the numbers the app shows: days of freedom, starting tier,
// XP and level. Pure (no DB calls), so the loader, the server actions and the seed agree.
// Relative imports so scripts can use it with jiti.
import {
  daysAtRetirement,
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
  assets: { type: string; balance_bani: number; as_of?: string | null }[]
  jars: { month: string; status: string; accepted_amount_bani: number | null; invested_at?: string | null }[]
  /** profiles.start_level: the highest starting level so far (the level never goes down). */
  storedStartLevel?: number | null
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
  /**
   * Days of retirement all private savings (statements + contributions not in them yet)
   * will pay for at 65, in today's money.
   */
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
  // The starting level only goes up: a new statement or a lower salary never takes levels away.
  const startLevel = Math.max(input.storedStartLevel ?? 0, firstLevelOfTier(tierFromRatio(income.replacementRatio)))

  const contributions = input.jars
    .filter((jar) => (CONTRIBUTED_STATUSES as readonly string[]).includes(jar.status))
    .map((jar) => ({ month: jar.month, amountBani: jar.accepted_amount_bani ?? 0 }))
  const contributedBani = contributions.reduce((sum, c) => sum + c.amountBani, 0)
  const level = levelState(startLevel, xpFromContributions(contributions, salary, income))

  // Money we already sent to Pillar III shows up in the next Pillar III statement, so a
  // contribution only adds to the balances if it was invested after the newest one.
  const newestPillarThree = input.assets
    .filter((asset) => asset.type === 'pillar3' && asset.as_of)
    .reduce((newest, asset) => (asset.as_of! > newest ? asset.as_of! : newest), '')
  const notInStatementBani = input.jars
    .filter((jar) => (CONTRIBUTED_STATUSES as readonly string[]).includes(jar.status))
    .filter((jar) => !(jar.status === 'invested' && jar.invested_at && jar.invested_at.slice(0, 10) <= newestPillarThree))
    .reduce((sum, jar) => sum + (jar.accepted_amount_bani ?? 0), 0)

  const assetsBani = input.assets.reduce((sum, asset) => sum + asset.balance_bani, 0)
  return {
    age,
    income,
    startLevel,
    contributions,
    contributedBani,
    level,
    totalDays: daysAtRetirement(assetsBani + notInStatementBani, salary, income),
    daysFromApp: daysAtRetirement(contributedBani, salary, income),
  }
}
