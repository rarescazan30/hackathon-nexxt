// Deterministic "Days of Freedom" (Zile de Libertate) calculation.
// Every number is grounded in Romanian pension reality and integer bani.

import type { DaysOfFreedom } from "@/lib/contracts";
import {
  DAYS_PER_MONTH,
  FREEDOM_DAY_BAND_FACTORS,
  STATE_PENSION_REPLACEMENT_RATE,
  TARGET_RETIREMENT_REPLACEMENT_RATE,
} from "./config";

export interface RetirementGapResult {
  monthlySalaryBani: number;
  targetMonthlySpendingBani: number;
  statePensionMonthlyBani: number;
  monthlyGapBani: number;
  dailyGapBani: number;
}

/**
 * Calculates the daily financial gap between the public state pension (Pillar 1)
 * and the target income needed for a comfortable retirement in Romania.
 *
 * @param monthlySalaryBani - Net monthly wage in integer bani.
 * @param targetReplacementRate - Desired retirement income ratio (default 65%).
 * @param stateReplacementRate - Expected Pillar 1 ratio (default 48%).
 * @returns Breakdown of monthly and daily gap in integer bani.
 */
export function calculateRetirementGap(
  monthlySalaryBani: number,
  targetReplacementRate: number = TARGET_RETIREMENT_REPLACEMENT_RATE,
  stateReplacementRate: number = STATE_PENSION_REPLACEMENT_RATE
): RetirementGapResult {
  const safeSalary = Math.max(0, Math.floor(monthlySalaryBani || 0));

  const targetMonthlySpendingBani = Math.round(safeSalary * targetReplacementRate);
  const statePensionMonthlyBani = Math.round(safeSalary * stateReplacementRate);
  const monthlyGapBani = Math.max(0, targetMonthlySpendingBani - statePensionMonthlyBani);

  // Daily gap needed to fund 1 Day of Freedom
  const dailyGapBani = Math.max(1, Math.round(monthlyGapBani / DAYS_PER_MONTH));

  return {
    monthlySalaryBani: safeSalary,
    targetMonthlySpendingBani,
    statePensionMonthlyBani,
    monthlyGapBani,
    dailyGapBani,
  };
}

/**
 * Computes how many Days of Freedom an accumulated savings amount represents.
 * Returns a range: { pessimistic, base, optimistic } as required by the product contract.
 *
 * @param savingsBani - Accumulated savings/investments in integer bani.
 * @param dailyRetirementSpendingBani - Daily retirement spending or gap in integer bani (default 2515 bani ~ 25.15 lei).
 * @param statePensionMonthlyBani - Optional monthly public pension. If provided, daily gap is calculated.
 * @returns DaysOfFreedom object ({ pessimistic, base, optimistic }) in whole days.
 */
export function daysOfFreedom(
  savingsBani: number,
  dailyRetirementSpendingBani: number = 2515,
  statePensionMonthlyBani?: number
): DaysOfFreedom {
  const safeSavings = Math.max(0, Math.floor(savingsBani || 0));

  let effectiveDailyGap = Math.max(1, Math.floor(dailyRetirementSpendingBani || 2515));

  if (statePensionMonthlyBani !== undefined && statePensionMonthlyBani > 0) {
    const dailyStatePension = Math.round(statePensionMonthlyBani / DAYS_PER_MONTH);
    effectiveDailyGap = Math.max(1, effectiveDailyGap - dailyStatePension);
  }

  if (safeSavings === 0) {
    return {
      pessimistic: 0,
      base: 0,
      optimistic: 0,
    };
  }

  // Base days = savings / daily gap
  const baseDays = Math.round(safeSavings / effectiveDailyGap);

  // Pessimistic assumes higher healthcare/living costs (+12% daily gap)
  const pessimisticDays = Math.round(
    safeSavings / (effectiveDailyGap * FREEDOM_DAY_BAND_FACTORS.pessimistic)
  );

  // Optimistic assumes favorable conditions / conservative investment yield during retirement (-12% daily draw)
  const optimisticDays = Math.round(
    safeSavings / (effectiveDailyGap * FREEDOM_DAY_BAND_FACTORS.optimistic)
  );

  return {
    pessimistic: Math.min(baseDays, pessimisticDays),
    base: baseDays,
    optimistic: Math.max(baseDays, optimisticDays),
  };
}

/**
 * Computes Days of Freedom tailored to a user's actual salary.
 * E.g. For Andrei (salary: 4500 lei, Pillar 2: 8200 lei), produces exactly 326 days [290, 370].
 *
 * @param savingsBani - Total private savings (Pillar 2 + Pillar 3 + investments) in integer bani.
 * @param monthlySalaryBani - Net monthly salary in integer bani.
 */
export function daysOfFreedomFromSalary(
  savingsBani: number,
  monthlySalaryBani: number
): DaysOfFreedom {
  const { dailyGapBani } = calculateRetirementGap(monthlySalaryBani);
  return daysOfFreedom(savingsBani, dailyGapBani);
}

/**
 * Computes how many Days of Freedom an additional investment amount (e.g. from round-ups or monthly deposit)
 * adds to the user's retirement.
 *
 * @param amountBani - Additional investment in integer bani.
 * @param monthlySalaryBani - Net monthly salary in integer bani.
 */
export function daysAddedFromAmount(
  amountBani: number,
  monthlySalaryBani: number
): DaysOfFreedom {
  const safeAmount = Math.max(0, Math.floor(amountBani || 0));
  if (safeAmount === 0) {
    return { pessimistic: 0, base: 0, optimistic: 0 };
  }

  const { dailyGapBani } = calculateRetirementGap(monthlySalaryBani);
  return daysOfFreedom(safeAmount, dailyGapBani);
}

