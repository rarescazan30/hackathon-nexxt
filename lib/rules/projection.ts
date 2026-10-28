// Compound growth projections across 3 Romanian market scenarios in integer bani.
// Deterministic formulas only, returning ranges (pessimistic / base / optimistic).

import { REAL_RETURN_RATES, STANDARD_RETIREMENT_AGE } from "./config";

export interface ProjectionBands {
  pessimistic: number; // integer bani
  base: number;        // integer bani
  optimistic: number;  // integer bani
}

export interface ProjectionTimelinePoint {
  age: number;
  elapsedYears: number;
  pessimisticBani: number;
  baseBani: number;
  optimisticBani: number;
}

export interface ProjectionTimelineOptions {
  currentAge: number;
  retirementAge?: number;
  initialPortfolioBani: number;
  monthlyContributionBani: number;
  stepYears?: number;
}

/**
 * Projects the future value of an initial sum plus regular monthly contributions
 * over a given number of years at an annual real rate of return.
 *
 * @param initialBani - Current portfolio balance in integer bani.
 * @param monthlyContributionBani - Monthly deposit in integer bani.
 * @param years - Investment horizon in years (can be fractional, e.g. 0.5 for 6 months).
 * @param annualRealRate - Real annual rate as decimal (e.g. 0.045 for 4.5%).
 * @returns Future value in integer bani.
 */
export function project(
  initialBani: number,
  monthlyContributionBani: number,
  years: number,
  annualRealRate: number
): number {
  const safeInitial = Math.max(0, Math.floor(initialBani || 0));
  const safeMonthly = Math.max(0, Math.floor(monthlyContributionBani || 0));
  const safeYears = Math.max(0, years || 0);

  if (safeYears === 0) {
    return safeInitial;
  }

  const months = Math.round(safeYears * 12);
  if (months === 0) {
    return safeInitial;
  }

  // Zero interest rate edge-case
  if (Math.abs(annualRealRate) < 1e-7) {
    return safeInitial + safeMonthly * months;
  }

  // Monthly effective compounding rate from annual real return
  const monthlyRate = Math.pow(1 + annualRealRate, 1 / 12) - 1;

  // Future value of existing capital
  const fvInitial = safeInitial * Math.pow(1 + monthlyRate, months);

  // Future value of ordinary monthly annuity (contributions at end of each month)
  const fvContributions =
    safeMonthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);

  return Math.round(fvInitial + fvContributions);
}

/**
 * Computes future value projections across the 3 standard Romanian market scenarios.
 *
 * @param initialBani - Starting balance in integer bani.
 * @param monthlyContributionBani - Monthly deposit in integer bani.
 * @param years - Horizon in years.
 * @param rates - Custom scenario rates (defaults to REAL_RETURN_RATES).
 * @returns ProjectionBands in integer bani.
 */
export function projectRange(
  initialBani: number,
  monthlyContributionBani: number,
  years: number,
  rates: { pessimistic: number; base: number; optimistic: number } = REAL_RETURN_RATES
): ProjectionBands {
  return {
    pessimistic: project(initialBani, monthlyContributionBani, years, rates.pessimistic),
    base: project(initialBani, monthlyContributionBani, years, rates.base),
    optimistic: project(initialBani, monthlyContributionBani, years, rates.optimistic),
  };
}

/**
 * Generates milestone points along the timeline from current age to retirement age.
 * Powers the interactive chart in the Progres tab.
 */
export function generateProjectionTimeline({
  currentAge,
  retirementAge = STANDARD_RETIREMENT_AGE,
  initialPortfolioBani,
  monthlyContributionBani,
  stepYears = 3,
}: ProjectionTimelineOptions): ProjectionTimelinePoint[] {
  const targetAge = Math.max(currentAge, retirementAge);
  const totalYears = targetAge - currentAge;
  const points: ProjectionTimelinePoint[] = [];

  const safeStep = Math.max(1, stepYears);

  for (let elapsed = 0; elapsed <= totalYears; elapsed += safeStep) {
    const age = currentAge + elapsed;
    const bands = projectRange(
      initialPortfolioBani,
      monthlyContributionBani,
      elapsed
    );

    points.push({
      age,
      elapsedYears: elapsed,
      pessimisticBani: bands.pessimistic,
      baseBani: bands.base,
      optimisticBani: bands.optimistic,
    });
  }

  // Ensure the exact retirement age is the final point if not aligned with stepYears
  const lastPoint = points[points.length - 1];
  if (!lastPoint || lastPoint.age !== targetAge) {
    const bands = projectRange(
      initialPortfolioBani,
      monthlyContributionBani,
      totalYears
    );
    points.push({
      age: targetAge,
      elapsedYears: totalYears,
      pessimisticBani: bands.pessimistic,
      baseBani: bands.base,
      optimisticBani: bands.optimistic,
    });
  }

  return points;
}

