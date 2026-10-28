// Deterministic portfolio asset allocation by risk level in integer bani.
// Integer balancing ensures zero rounding drift: sum of parts === amountBani.

import type { RiskLevel } from "@/lib/contracts";
import { ALLOCATION_WEIGHTS, PRODUCT_CATALOG } from "./config";

export interface ProductAllocation {
  productId: "pillar3" | "etfBet" | "govBonds";
  name: string;
  type: string;
  amountBani: number;
  percentage: number;
  description: string;
}

export interface AllocationResult {
  riskLevel: RiskLevel;
  totalBani: number;
  products: {
    pillar3Bani: number;
    etfBetBani: number;
    govBondsBani: number;
  };
  breakdown: ProductAllocation[];
  summaryRo: string;
}

/**
 * Splits an investment amount (in integer bani) across asset classes according to risk level.
 * Guarantees that the sum of allocated amounts equals the original total down to the exact ban.
 *
 * @param amountBani - Total integer bani to allocate.
 * @param riskLevel - Risk tolerance: "low" | "medium" | "high".
 * @returns Balanced allocation result with product details and exact integer amounts.
 */
export function allocate(amountBani: number, riskLevel: RiskLevel): AllocationResult {
  const safeTotal = Math.max(0, Math.floor(amountBani || 0));

  if (safeTotal === 0) {
    return {
      riskLevel,
      totalBani: 0,
      products: { pillar3Bani: 0, etfBetBani: 0, govBondsBani: 0 },
      breakdown: [
        {
          productId: "pillar3",
          name: PRODUCT_CATALOG.pillar3.name,
          type: PRODUCT_CATALOG.pillar3.type,
          amountBani: 0,
          percentage: ALLOCATION_WEIGHTS[riskLevel].pillar3,
          description: PRODUCT_CATALOG.pillar3.description,
        },
        {
          productId: "etfBet",
          name: PRODUCT_CATALOG.etfBet.name,
          type: PRODUCT_CATALOG.etfBet.type,
          amountBani: 0,
          percentage: ALLOCATION_WEIGHTS[riskLevel].etfBet,
          description: PRODUCT_CATALOG.etfBet.description,
        },
        {
          productId: "govBonds",
          name: PRODUCT_CATALOG.govBonds.name,
          type: PRODUCT_CATALOG.govBonds.type,
          amountBani: 0,
          percentage: ALLOCATION_WEIGHTS[riskLevel].govBonds,
          description: PRODUCT_CATALOG.govBonds.description,
        },
      ],
      summaryRo: "0 lei alocați",
    };
  }

  const weights = ALLOCATION_WEIGHTS[riskLevel] ?? ALLOCATION_WEIGHTS.medium;

  // Compute shares for two products, balancing the largest weight product with the exact remainder
  // to prevent any 1 ban rounding disparity.
  let govBondsBani = Math.round((safeTotal * weights.govBonds) / 100);
  let etfBetBani = Math.round((safeTotal * weights.etfBet) / 100);
  let pillar3Bani = safeTotal - govBondsBani - etfBetBani;

  // Guard against any negative remainder on small edge amounts
  if (pillar3Bani < 0) {
    if (govBondsBani > etfBetBani) {
      govBondsBani += pillar3Bani;
    } else {
      etfBetBani += pillar3Bani;
    }
    pillar3Bani = 0;
  }

  // Double check sum invariant
  const sum = pillar3Bani + etfBetBani + govBondsBani;
  if (sum !== safeTotal) {
    pillar3Bani += safeTotal - sum;
  }

  const breakdown: ProductAllocation[] = [
    {
      productId: "pillar3",
      name: PRODUCT_CATALOG.pillar3.name,
      type: PRODUCT_CATALOG.pillar3.type,
      amountBani: pillar3Bani,
      percentage: weights.pillar3,
      description: PRODUCT_CATALOG.pillar3.description,
    },
    {
      productId: "etfBet",
      name: PRODUCT_CATALOG.etfBet.name,
      type: PRODUCT_CATALOG.etfBet.type,
      amountBani: etfBetBani,
      percentage: weights.etfBet,
      description: PRODUCT_CATALOG.etfBet.description,
    },
    {
      productId: "govBonds",
      name: PRODUCT_CATALOG.govBonds.name,
      type: PRODUCT_CATALOG.govBonds.type,
      amountBani: govBondsBani,
      percentage: weights.govBonds,
      description: PRODUCT_CATALOG.govBonds.description,
    },
  ];

  // Human-readable summary for Romanian UI/Agent
  const activeProducts = breakdown
    .filter((p) => p.amountBani > 0)
    .map((p) => `${(p.amountBani / 100).toFixed(2).replace(".", ",")} lei în ${p.name}`)
    .join(", ");

  return {
    riskLevel,
    totalBani: safeTotal,
    products: {
      pillar3Bani,
      etfBetBani,
      govBondsBani,
    },
    breakdown,
    summaryRo: activeProducts || "0 lei alocați",
  };
}

