// Deterministic round-up and jar collection math in integer bani.
// No floats, no external dependencies.

import type { Psd2Transaction, RoundUp } from "@/lib/contracts";
import { DEFAULT_ROUNDUP_STEP_BANI } from "./config";

export type RoundUpPercentage = 10 | 20 | 30;
export const ALLOWED_ROUNDUP_PERCENTAGES: readonly RoundUpPercentage[] = [10, 20, 30] as const;

export interface RoundUpRule {
  /**
   * Client-selected percentage (10%, 20%, or 30%).
   * When chosen, the total sum to be paid is calculated by adding this percentage
   * to the original amount and rounding to an integer (whole Lei),
   * and the round-up is the difference (total to pay - original amount).
   */
  percentage?: RoundUpPercentage | number;

  /**
   * Directly chosen total sum to be paid in integer bani (e.g. 1500 bani = 15.00 lei).
   * The round-up is (chosenTotalBani - amountBani).
   */
  chosenTotalBani?: number;

  /**
   * Rounding target for percentage mode:
   * - "lei" (default): total to pay is rounded to whole integer Lei (e.g. 12.30 + 10% = 13.53 -> 14.00 lei total; round-up = 1.70 lei).
   * - "bani": total to pay is rounded to integer bani.
   */
  roundTo?: "lei" | "bani";

  /**
   * Round-up step in integer bani for fixed-step mode.
   * E.g. 500 = nearest 5 lei, 1000 = nearest 10 lei, 100 = nearest 1 leu.
   * Defaults to DEFAULT_ROUNDUP_STEP_BANI (500 bani / 5.00 lei) when percentage is not specified.
   */
  stepBani?: number;

  /**
   * Round-up multiplier (e.g. 1x, 2x, 5x, 10x). Defaults to 1.
   */
  multiplier?: number;
}

export interface RoundUpPaymentOption {
  percentage: RoundUpPercentage;
  totalToPayBani: number;      // Total sum chosen by the client to be paid (integer bani)
  roundUpBani: number;         // Round-up portion sent to savings jar (integer bani)
  totalToPayFormatted: string; // E.g. "14,00 lei"
  roundUpFormatted: string;    // E.g. "+1,70 lei"
  labelRo: string;             // E.g. "Plătește 14,00 lei (+1,70 lei pușculiță · 10%)"
}

/**
 * Safely parse a decimal string amount (e.g. "-12.30" or "86.40") into integer bani
 * without floating-point precision inaccuracies (never uses parseFloat * 100).
 */
export function parseDecimalStringToBani(amountStr: string): number {
  const clean = amountStr.trim().replace(",", ".");
  const isNegative = clean.startsWith("-");
  const rawAbs = isNegative ? clean.slice(1) : clean;
  const parts = rawAbs.split(".");
  const lei = parseInt(parts[0] || "0", 10);
  const baniStr = (parts[1] || "").padEnd(2, "0").slice(0, 2);
  const bani = parseInt(baniStr, 10);
  const total = lei * 100 + bani;
  return isNegative ? -total : total;
}

/**
 * Format integer bani into a standard Romanian Leu string ("12,30 lei").
 */
export function formatBaniToLei(bani: number): string {
  const isNegative = bani < 0;
  const abs = Math.abs(bani);
  const lei = Math.floor(abs / 100);
  const remainingBani = abs % 100;
  const formattedLei = lei.toLocaleString("ro-RO");
  const formattedBani = remainingBani.toString().padStart(2, "0");
  const prefix = isNegative ? "-" : "";
  return `${prefix}${formattedLei},${formattedBani} lei`;
}

/**
 * Computes the round-up amount for a single transaction in integer bani.
 *
 * Supports client-driven payment choices:
 * 1. Directly chosen total sum to be paid (chosenTotalBani):
 *    roundUp = chosenTotalBani - amountBani.
 * 2. Percentage mode (10%, 20%, 30%):
 *    The person chooses the total sum to be paid (original sum + 10%/20%/30% rounded to an integer Leu).
 *    The round-up is the difference moved to the jar (totalToPay - amountBani).
 * 3. Fixed-step mode:
 *    Rounds up to the nearest multiple (e.g. nearest 5.00 lei).
 *
 * @param amountBani - Transaction spent amount in integer bani (positive).
 * @param rule - Round-up configuration, integer step, percentage, or chosen total.
 * @returns Integer bani to move to the jar.
 */
export function roundUp(amountBani: number, rule?: RoundUpRule | number): number {
  if (amountBani <= 0 || !Number.isFinite(amountBani)) {
    return 0;
  }

  // 1. Directly chosen total sum to be paid
  if (typeof rule === "object" && rule?.chosenTotalBani !== undefined) {
    const chosenTotal = Math.floor(rule.chosenTotalBani);
    return Math.max(0, chosenTotal - amountBani);
  }

  const isPercentageNumber =
    typeof rule === "number" && (rule === 10 || rule === 20 || rule === 30);

  const percentage =
    typeof rule === "object" && rule?.percentage !== undefined
      ? rule.percentage
      : isPercentageNumber
        ? rule
        : undefined;

  const multiplier =
    typeof rule === "object" && rule?.multiplier && rule.multiplier > 0
      ? Math.floor(rule.multiplier)
      : 1;

  // 2. Percentage mode (10%, 20%, 30% added to original sum, rounded to an integer total to pay)
  if (percentage !== undefined && percentage > 0) {
    const roundTo = typeof rule === "object" ? (rule.roundTo ?? "lei") : "lei";

    if (roundTo === "bani") {
      // Direct percentage in integer bani
      const rawBani = (amountBani * percentage) / 100;
      return Math.round(rawBani) * multiplier;
    }

    // Default: The person chooses the total sum to be paid (original sum + percentage rounded to integer Leu)
    // Example: 12.30 lei + 10% = 13.53 lei -> rounded to 14.00 lei total; roundUp = 1.70 lei (170 bani).
    const rawTotalLei = (amountBani * (1 + percentage / 100)) / 100;
    let roundedTotalLei = Math.round(rawTotalLei);

    // Ensure total sum to be paid is strictly higher than original purchase
    if (roundedTotalLei * 100 <= amountBani) {
      roundedTotalLei = Math.floor(amountBani / 100) + 1;
    }

    const totalToPayBani = roundedTotalLei * 100;
    const diff = totalToPayBani - amountBani;
    return diff * multiplier;
  }

  // 3. Fixed step mode (e.g. nearest 500 bani / 5.00 lei)
  const step =
    typeof rule === "number" && !isPercentageNumber
      ? rule
      : typeof rule === "object" && rule.stepBani !== undefined
        ? rule.stepBani
        : DEFAULT_ROUNDUP_STEP_BANI;

  if (step <= 0) {
    return 0;
  }

  const remainder = amountBani % step;
  if (remainder === 0) {
    return 0;
  }

  const diff = step - remainder;
  return diff * multiplier;
}

/**
 * Computes the 3 options (10%, 20%, 30%) for the total sum to be paid by the customer,
 * adding the round-up to the original sum and rounding the total to an integer number of Lei.
 *
 * @param amountBani - Original purchase price in integer bani.
 * @returns Array of 3 options with the total sum to be paid and the round-up amount.
 */
export function getPaymentRoundUpOptions(amountBani: number): RoundUpPaymentOption[] {
  const safeAmount = Math.max(0, Math.floor(amountBani || 0));
  if (safeAmount === 0) {
    return [];
  }

  return ALLOWED_ROUNDUP_PERCENTAGES.map((percentage) => {
    const roundUpBani = roundUp(safeAmount, { percentage, roundTo: "lei" });
    const totalToPayBani = safeAmount + roundUpBani;

    return {
      percentage,
      totalToPayBani,
      roundUpBani,
      totalToPayFormatted: formatBaniToLei(totalToPayBani),
      roundUpFormatted: `+${formatBaniToLei(roundUpBani)}`,
      labelRo: `Plătește ${formatBaniToLei(totalToPayBani)} (+${formatBaniToLei(roundUpBani)} în pușculiță · ${percentage}%)`,
    };
  });
}

/**
 * Calculates the complete payment breakdown: original spent amount, round-up, and total sum to be paid.
 */
export function calculatePaymentTotal(
  amountBani: number,
  rule?: RoundUpRule | number
): {
  spentBani: number;
  roundUpBani: number;
  totalToPayBani: number;
  spentFormatted: string;
  roundUpFormatted: string;
  totalToPayFormatted: string;
} {
  const safeAmount = Math.max(0, Math.floor(amountBani || 0));
  const roundUpBani = roundUp(safeAmount, rule);
  const totalToPayBani = safeAmount + roundUpBani;

  return {
    spentBani: safeAmount,
    roundUpBani,
    totalToPayBani,
    spentFormatted: formatBaniToLei(safeAmount),
    roundUpFormatted: `+${formatBaniToLei(roundUpBani)}`,
    totalToPayFormatted: formatBaniToLei(totalToPayBani),
  };
}

/**
 * Evaluates a NextGenPSD2 transaction and generates a RoundUp record if it represents an expense.
 * In PSD2 bank feeds, debit card payments are negative amounts (e.g. "-12.30").
 */
export function calculatePsd2RoundUp(
  transaction: Psd2Transaction,
  rule?: RoundUpRule | number
): RoundUp | null {
  const parsedBani = parseDecimalStringToBani(transaction.transactionAmount.amount);

  // Round-ups only apply to debit spending (negative amount)
  if (parsedBani >= 0) {
    return null;
  }

  const spentBani = Math.abs(parsedBani);
  const roundUpBani = roundUp(spentBani, rule);

  return {
    transactionId: transaction.transactionId,
    spentBani,
    roundUpBani,
  };
}

/**
 * Calculates the total monthly jar collection from an array of round-up records or amounts,
 * applying an optional monthly cap.
 *
 * @param roundups - Array of integer bani or RoundUp objects.
 * @param capBani - Optional monthly cap in integer bani.
 * @returns Total integer bani to collect at end of month.
 */
export function jarTotal(
  roundups: Array<number | { roundUpBani: number }>,
  capBani?: number
): number {
  let sum = 0;

  for (const item of roundups) {
    const val = typeof item === "number" ? item : item.roundUpBani;
    if (Number.isFinite(val) && val > 0) {
      sum += Math.floor(val);
    }
  }

  if (capBani !== undefined && capBani > 0) {
    return Math.min(sum, Math.floor(capBani));
  }

  return sum;
}
