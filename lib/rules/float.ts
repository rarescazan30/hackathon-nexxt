// Interest earned while we hold a user's monthly contribution before it goes to Pillar III.
// This is the business model (docs/plan.md, section 4). Integer bani.

/**
 * Yearly interest rate on the money held for one month. An assumption, not a quote:
 * close to the BNR deposit facility rate in 2025 (~5%). Change it here only.
 * Source: Banca Națională a României, policy rates (bnr.ro).
 */
export const FLOAT_INTEREST_RATE = 0.05;

const DAYS_PER_YEAR = 365;

/** Simple interest on `amountBani` held for `days`: 500 RON for 30 days at 5% → 205 bani. */
export function floatInterestBani(amountBani: number, days: number, yearlyRate: number = FLOAT_INTEREST_RATE): number {
  const safeAmount = Math.max(0, Math.floor(amountBani || 0));
  const safeDays = Math.max(0, days || 0);
  return Math.round((safeAmount * yearlyRate * safeDays) / DAYS_PER_YEAR);
}
