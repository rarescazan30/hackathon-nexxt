// Retirement lifestyle: starting tier from the projected pension, XP from contributions,
// levels, and the display helpers for days and money (English UI).
// Deterministic, integer bani for money, no external dependencies.

import {
  REAL_RETURN_AFTER_INFLATION,
  RETIREMENT_HORIZON_YEARS,
  STANDARD_RETIREMENT_AGE,
  STATE_PENSION_REPLACEMENT_RATE,
} from "./config";
import { daysOfFreedomFromSalary } from "./freedom";
import { project } from "./projection";

/**
 * Contribution years for a full public pension.
 * Source: Legea nr. 360/2023, Art. 49 (stagiu complet de cotizare: 35 de ani).
 */
export const FULL_CONTRIBUTION_YEARS = 35;

/**
 * Share of the gross salary paid into Pillar II.
 * Source: Legea nr. 411/2004 as amended; 4.75% of gross since 1 January 2024.
 */
export const PILLAR_TWO_CONTRIBUTION_RATE = 0.0475;

/**
 * Net salary as a share of gross for a standard employment contract:
 * gross − 25% CAS − 10% CASS − 10% income tax on the rest = 58.5% of gross.
 * Source: Codul Fiscal (Legea nr. 227/2015), Art. 138, 156, 64.
 */
export const NET_TO_GROSS_RATIO = 0.585;

/**
 * Real growth of pension savings: the funds' long-run return minus the last 10 years of
 * Romanian inflation (~2.2% a year, see config.ts). Used for income and days of freedom.
 */
export const LIFESTYLE_RETURN_RATE = REAL_RETURN_AFTER_INFLATION;

/**
 * Replacement ratio (retirement income ÷ today's net salary) at which each tier starts.
 * Tier 1 below the first value. First guess, tuned against the personas: someone with a
 * full state pension and no private pension stays in tier 1; a typical 30–40 year old
 * with Pillar II lands in tier 2–3.
 */
export const TIER_THRESHOLDS = [0.6, 0.72, 0.85, 1.0] as const;

export const TIER_COUNT = 5;
export const SLOTS = ["home", "transport", "food", "extras"] as const;
export type Slot = (typeof SLOTS)[number];
export const MAX_LEVEL = TIER_COUNT * SLOTS.length; // 20

/**
 * XP for each day of freedom added through the app. Days now include growth until 65
 * (about ×2 for a 34-year-old), so a day is worth 10 XP to keep the same pace of levels.
 */
export const XP_PER_DAY = 10;
/** Extra XP for a contribution in the month right after another contribution. */
export const STREAK_BONUS_XP = 20;
/**
 * XP a new account starts with. The first level-up costs FIRST_LEVEL_XP (300), so the first
 * month the user says yes to (4+ days of freedom, ~100 RON for a 6,500 RON salary) already
 * upgrades the island.
 */
export const WELCOME_BONUS_XP = 260;
/** XP for the first level-up after onboarding; each next one costs 25% more (rounded to 50). */
export const FIRST_LEVEL_XP = 300;
export const LEVEL_XP_GROWTH = 1.25;

export interface RetirementIncomeInput {
  age: number;
  netSalaryBani: number;
  yearsWorked: number;
  pillarTwoBani: number;
  pillarThreeBani: number;
  retirementAge?: number;
}

export interface RetirementIncome {
  statePensionBani: number;
  pillarTwoMonthlyBani: number;
  pillarThreeMonthlyBani: number;
  totalMonthlyBani: number;
  /** totalMonthlyBani ÷ net salary today, e.g. 0.74 = 74%. */
  replacementRatio: number;
  /**
   * The state pension as a share of today's net salary for this person (48% with a full
   * contribution record, less without). Days of freedom use the same rate, so the two
   * numbers on screen tell one story.
   */
  stateReplacementRate: number;
  /**
   * What 1 RON saved today is worth at retirement, in today's money (real growth after
   * inflation), e.g. 1.96 for 31 years at 2.2%. Days of freedom use it too.
   */
  growthToRetirement: number;
}

/**
 * Projected monthly income at retirement, in today's money (real returns).
 * - State pension: the standard replacement rate, scaled down if the person
 *   won't reach a full contribution record.
 * - Pillar II: today's balance plus future mandatory contributions, grown to
 *   retirement, then spread over the retirement horizon.
 * - Pillar III: today's balance grown to retirement, spread the same way.
 */
export function projectedRetirementIncome(input: RetirementIncomeInput): RetirementIncome {
  const salary = Math.max(0, Math.floor(input.netSalaryBani || 0));
  const retirementAge = input.retirementAge ?? STANDARD_RETIREMENT_AGE;
  const yearsLeft = Math.max(0, retirementAge - input.age);
  const retirementMonths = RETIREMENT_HORIZON_YEARS * 12;

  const contributionYears = Math.min(FULL_CONTRIBUTION_YEARS, Math.max(0, input.yearsWorked) + yearsLeft);
  const stateReplacementRate = STATE_PENSION_REPLACEMENT_RATE * (contributionYears / FULL_CONTRIBUTION_YEARS);
  const statePensionBani = Math.round(salary * stateReplacementRate);

  const grossSalaryBani = salary / NET_TO_GROSS_RATIO;
  const pillarTwoMonthlyContribution = Math.round(grossSalaryBani * PILLAR_TWO_CONTRIBUTION_RATE);
  const pillarTwoAtRetirement = project(input.pillarTwoBani, pillarTwoMonthlyContribution, yearsLeft, LIFESTYLE_RETURN_RATE);
  const pillarThreeAtRetirement = project(input.pillarThreeBani, 0, yearsLeft, LIFESTYLE_RETURN_RATE);

  const pillarTwoMonthlyBani = Math.round(pillarTwoAtRetirement / retirementMonths);
  const pillarThreeMonthlyBani = Math.round(pillarThreeAtRetirement / retirementMonths);
  const totalMonthlyBani = statePensionBani + pillarTwoMonthlyBani + pillarThreeMonthlyBani;

  return {
    statePensionBani,
    pillarTwoMonthlyBani,
    pillarThreeMonthlyBani,
    totalMonthlyBani,
    replacementRatio: salary > 0 ? totalMonthlyBani / salary : 0,
    stateReplacementRate,
    growthToRetirement: Math.pow(1 + LIFESTYLE_RETURN_RATE, yearsLeft),
  };
}

/** Replacement ratio → tier 1..5. */
export function tierFromRatio(ratio: number): number {
  return 1 + TIER_THRESHOLDS.filter((threshold) => ratio >= threshold).length;
}

/** The first level of a tier: tier 1 → 1, tier 2 → 5, tier 3 → 9, ... */
export function firstLevelOfTier(tier: number): number {
  return (Math.min(TIER_COUNT, Math.max(1, tier)) - 1) * SLOTS.length + 1;
}

/**
 * XP for the n-th level-up since onboarding (n = 1 is the first one).
 * Counted from the starting level, not from level 1, so the first upgrade comes
 * after about two months for everyone, whatever tier they start in.
 */
export function xpForLevelUp(n: number): number {
  return Math.round((FIRST_LEVEL_XP * Math.pow(LEVEL_XP_GROWTH, Math.max(1, n) - 1)) / 50) * 50;
}

export interface Contribution {
  month: string; // 'YYYY-MM'
  amountBani: number;
}

function previousMonth(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  return monthNumber === 1 ? `${year - 1}-12` : `${year}-${String(monthNumber - 1).padStart(2, "0")}`;
}

/**
 * XP earned through the app: XP_PER_DAY for each day of freedom a contribution adds,
 * plus STREAK_BONUS_XP when the previous month also had a contribution.
 */
/**
 * Days of retirement that `amountBani` saved today pays for: it grows until 65 (real,
 * after inflation), then covers the daily gap between the state pension and 65% of salary.
 */
export function daysAtRetirement(
  amountBani: number,
  netSalaryBani: number,
  income: Pick<RetirementIncome, "stateReplacementRate" | "growthToRetirement">
): number {
  const grownBani = Math.round(Math.max(0, amountBani) * income.growthToRetirement);
  return daysOfFreedomFromSalary(grownBani, netSalaryBani, income.stateReplacementRate).base;
}

export function xpFromContributions(
  contributions: Contribution[],
  netSalaryBani: number,
  income: Pick<RetirementIncome, "stateReplacementRate" | "growthToRetirement">
): number {
  const months = new Set(contributions.filter((c) => c.amountBani > 0).map((c) => c.month));
  let xp = 0;
  for (const contribution of contributions) {
    if (contribution.amountBani <= 0) continue;
    xp += daysAtRetirement(contribution.amountBani, netSalaryBani, income) * XP_PER_DAY;
    if (months.has(previousMonth(contribution.month))) xp += STREAK_BONUS_XP;
  }
  return xp;
}

export type SlotTiers = Record<Slot, number>;

/**
 * What the scene shows at a level. Each level upgrades one slot, in SLOTS order:
 * level 5 = home at tier 2 (the rest still tier 1), level 8 = everything at tier 2.
 */
export function slotsAtLevel(level: number): SlotTiers {
  const safeLevel = Math.min(MAX_LEVEL, Math.max(1, Math.floor(level)));
  const tier = Math.ceil(safeLevel / SLOTS.length);
  const upgradedInTier = (safeLevel - 1) % SLOTS.length; // 0 = only home is at `tier`
  const slots = {} as SlotTiers;
  SLOTS.forEach((slot, index) => {
    slots[slot] = index <= upgradedInTier ? tier : Math.max(1, tier - 1);
  });
  return slots;
}

/** The slot that changes when reaching `level` (the one to highlight on level-up). */
export function slotUnlockedAt(level: number): Slot {
  return SLOTS[(Math.max(1, level) - 1) % SLOTS.length];
}

export interface LevelState {
  level: number;
  tier: number;
  slots: SlotTiers;
  xp: number;
  xpIntoLevel: number;
  /** null at MAX_LEVEL. */
  xpForNext: number | null;
  /** What the next level unlocks, null at MAX_LEVEL. */
  next: { slot: Slot; tier: number } | null;
  /** True on the first level of tiers 2..5: the big animation + milestone card. */
  isMilestone: boolean;
}

/** Level reached from a starting level plus XP earned since. */
export function levelState(startLevel: number, xp: number): LevelState {
  const start = Math.min(MAX_LEVEL, Math.max(1, Math.floor(startLevel)));
  const costOfNext = (current: number) => xpForLevelUp(current - start + 1);
  let level = start;
  let remaining = Math.max(0, Math.floor(xp));
  while (level < MAX_LEVEL && remaining >= costOfNext(level)) {
    remaining -= costOfNext(level);
    level += 1;
  }

  const atMax = level === MAX_LEVEL;
  return {
    level,
    tier: Math.ceil(level / SLOTS.length),
    slots: slotsAtLevel(level),
    xp: Math.max(0, Math.floor(xp)),
    xpIntoLevel: remaining,
    xpForNext: atMax ? null : costOfNext(level),
    next: atMax ? null : { slot: slotUnlockedAt(level + 1), tier: Math.ceil((level + 1) / SLOTS.length) },
    isMilestone: level > 1 && (level - 1) % SLOTS.length === 0,
  };
}

const DAYS_PER_YEAR = 365;
const DAYS_PER_DISPLAY_MONTH = 30;

function plural(count: number, unit: string): string {
  return `${count} ${unit}${count === 1 ? "" : "s"}`;
}

/** Beyond the retirement horizon more days don't mean more freedom, so the display stops there. */
const MAX_FREEDOM_DAYS = RETIREMENT_HORIZON_YEARS * DAYS_PER_YEAR;

/** 12 → "12 days", 125 → "4 months 5 days", 1156 → "3 years 2 months". Two units at most. */
export function formatFreedom(days: number): string {
  const total = Math.max(0, Math.round(days));
  if (total > MAX_FREEDOM_DAYS) return `${RETIREMENT_HORIZON_YEARS}+ years`;
  const years = Math.floor(total / DAYS_PER_YEAR);
  const months = Math.floor((total % DAYS_PER_YEAR) / DAYS_PER_DISPLAY_MONTH);
  const rest = total % DAYS_PER_YEAR % DAYS_PER_DISPLAY_MONTH;

  if (years > 0) return months > 0 ? `${plural(years, "year")} ${plural(months, "month")}` : plural(years, "year");
  if (months > 0) return rest > 0 ? `${plural(months, "month")} ${plural(rest, "day")}` : plural(months, "month");
  return plural(rest, "day");
}

/** Above this the percentage stops meaning much (and a typo can make it huge). */
export const MAX_SHOWN_RATIO = 1.5;

/** 0.742 → "74%", 3.2 → "more than 150%". */
export function formatRatio(ratio: number): string {
  if (ratio > MAX_SHOWN_RATIO) return `more than ${Math.round(MAX_SHOWN_RATIO * 100)}%`;
  return `${Math.round(Math.max(0, ratio) * 100)}%`;
}

/** 129350 → "1,293.50 RON". `wholeRon` drops the decimals: "1,294 RON". */
export function formatRon(bani: number, options: { wholeRon?: boolean } = {}): string {
  const digits = options.wholeRon ? 0 : 2;
  const value = (bani / 100).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return `${value} RON`;
}
