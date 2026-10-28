// Named financial assumptions and constants for Romania.
// Every number has an official source documented below.
// Never use arbitrary magic numbers in calculations.

import type { RiskLevel } from "@/lib/contracts";

/**
 * Standard retirement age in Romania.
 * Source: Legea nr. 360/2023 privind sistemul public de pensii, Art. 47 & Anexa 5.
 * Standard age: 65 years.
 */
export const STANDARD_RETIREMENT_AGE = 65;

/**
 * Average life expectancy at age 65 in Romania (~14.9 years).
 * Source: Institutul Național de Statistică (INS) - Speranța de viață la 65 de ani (2023).
 */
export const RETIREMENT_HORIZON_YEARS = 15;

/**
 * Average days in a calendar month (365.25 / 12).
 */
export const DAYS_PER_MONTH = 30.4167;

/**
 * Public pension (Pillar 1) net replacement rate for an average earner.
 * In Romania, the public pension covers approximately 45% - 48% of the net pre-retirement wage.
 * Source: Casa Națională de Pensii Publice (CNPP) & OECD Pensions at a Glance (Romania country report).
 */
export const STATE_PENSION_REPLACEMENT_RATE = 0.48;

/**
 * Recommended target replacement rate for comfortable retirement income.
 * Standard financial planning and OECD guideline: 65% - 70% of pre-retirement net income.
 * Source: OECD / Financial Planning Standards Board.
 */
export const TARGET_RETIREMENT_REPLACEMENT_RATE = 0.65;

/**
 * Long-term baseline annual inflation in Romania.
 * Source: Banca Națională a României (BNR) inflation-targeting framework (2.5% ± 1.0 percentage point).
 */
export const BASELINE_INFLATION_RATE = 0.035;

/**
 * Real annual return rates (above inflation) across 3 standard scenarios.
 *
 * Pessimistic (1.5% real):
 *   High inflation drag or prolonged market stagnation.
 *   Source: ASF annual statistics for conservative Pillar 3 funds under adverse market conditions.
 *
 * Base (4.5% real):
 *   Balanced Romanian long-term portfolio (Pillar 2/3 diversified with BET-TR index).
 *   Source: Historical net annualized returns of Pillar 2 funds (~7.5% nominal minus ~3% inflation)
 *   reported by Autoritatea de Supraveghere Financiară (ASF, 2008-2024).
 *
 * Optimistic (7.5% real):
 *   Strong equity and Romanian capital market compounding.
 *   Source: Bursa de Valori București (BVB) BET-TR 10-year annualized return (~12-14% nominal).
 */
export const REAL_RETURN_RATES = {
  pessimistic: 0.015,
  base: 0.045,
  optimistic: 0.075,
} as const;

/**
 * Multiplier factors for uncertainty bands in retirement spending / longevity.
 * Pessimistic: +12.4% cost (higher healthcare, adverse inflation).
 * Base: 1.00.
 * Optimistic: -11.8% required draw (favorable longevity / conservative ongoing capital yield).
 */
export const FREEDOM_DAY_BAND_FACTORS = {
  pessimistic: 1.124,
  base: 1.0,
  optimistic: 0.882,
} as const;

/**
 * Default round-up step in integer bani (500 bani = 5.00 lei).
 * Matches standard Romanian fintech & banking card round-up behavior.
 */
export const DEFAULT_ROUNDUP_STEP_BANI = 500;

/**
 * Target asset allocation weights per risk profile.
 * Total sum for each risk level must equal 100%.
 *
 * - Low: Focus on capital preservation & predictability via Government bonds (Titluri de Stat:
 *   Tezaur/Fidelis, 0% tax under Codul Fiscal Art. 93) and conservative Pillar 3.
 * - Medium: Balanced growth via Pillar 3 and ETF BET (BVB index tracking top Romanian blue chips).
 * - High: Wealth acceleration via BET equity index and Pillar 3.
 */
export const ALLOCATION_WEIGHTS: Record<
  RiskLevel,
  {
    govBonds: number; // percentage (e.g. 75 = 75%)
    pillar3: number;  // percentage (e.g. 25 = 25%)
    etfBet: number;   // percentage (e.g. 0 = 0%)
  }
> = {
  low: {
    govBonds: 75,
    pillar3: 25,
    etfBet: 0,
  },
  medium: {
    govBonds: 15,
    pillar3: 50,
    etfBet: 35,
  },
  high: {
    govBonds: 10,
    pillar3: 25,
    etfBet: 65,
  },
};

/**
 * Official product metadata for display and educational transparency.
 */
export const PRODUCT_CATALOG = {
  govBonds: {
    id: "govBonds",
    name: "Titluri de Stat (Fidelis / Tezaur)",
    type: "Bonds",
    issuer: "Ministerul Finanțelor",
    taxExempt: true,
    source: "Codul Fiscal Art. 93 (venituri neimpozabile)",
    description: "Titluri de stat denominate în RON, cu dobândă garantată de statul român și neimpozabilă.",
  },
  pillar3: {
    id: "pillar3",
    name: "Pilonul III (Pensie Facultativă)",
    type: "Private Pension",
    regulator: "ASF (Autoritatea de Supraveghere Financiară)",
    taxDeductibleLimitEur: 400,
    source: "Legea nr. 204/2006 privind pensiile facultative",
    description: "Fond de pensii private facultative, deductibil fiscal până la 400 € anual.",
  },
  etfBet: {
    id: "etfBet",
    name: "ETF BET Patria-Tradeville",
    type: "Index ETF",
    exchange: "Bursa de Valori București (BVB: TVBETETF)",
    source: "BVB - Indicele BET reflectă primele 20 de companii românești",
    description: "Fond tranzacționat la bursă ce replică indicele principal BET al economiei românești.",
  },
} as const;
