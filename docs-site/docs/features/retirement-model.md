---
title: "Retirement model"
description: "How income at 65, the replacement ratio and days of freedom are calculated."
---

# Retirement model

Everything here is in `lib/rules/` (`lifestyle.ts`, `freedom.ts`, `config.ts`) and is **in today's money**: growth is counted only above inflation.

## Inflation and growth

| Constant | Value | Source |
|---|---|---|
| `RO_INFLATION_BY_YEAR` | 2016 → 2025: −1.5%, 1.3%, 4.6%, 3.8%, 2.6%, 5.1%, 13.8%, 10.4%, 5.6%, 7.3% | INS yearly CPI |
| `INFLATION_10Y_AVERAGE` | ~5.2% a year (prices ×1.66 in 10 years) | geometric mean of the above |
| `PENSION_FUND_NOMINAL_RETURN` | 7.5% a year | ASF, Pillar II funds 2008–2024 |
| `REAL_RETURN_AFTER_INFLATION` | (1.075 ÷ 1.052) − 1 ≈ **2.2%** a year | computed |

```ts
// lib/rules/config.ts
export const REAL_RETURN_AFTER_INFLATION =
  (1 + PENSION_FUND_NOMINAL_RETURN) / (1 + INFLATION_10Y_AVERAGE) - 1;
```

## Expected income at 65

`projectedRetirementIncome()` adds three monthly incomes:

| Part | How |
|---|---|
| **State pension** | net salary × 48% × (contribution years ÷ 35), where contribution years = years worked + years left until 65 (max 35). Sources: CNPP/OECD, Law 360/2023. |
| **Pillar II** | today's balance + future contributions (4.75% of gross salary; gross = net ÷ 0.585), grown at 2.2% real until 65, spread over 15 years (180 months). |
| **Pillar III** | today's balance grown the same way, spread over 180 months. |

**Compared to your life today** = expected income ÷ today's net salary.

## The starting lifestyle

The replacement ratio picks one of five tiers (`TIER_THRESHOLDS`):

| Ratio | Tier | Starting level |
|---|---|---|
| < 60% | 1 · tent life | 1 |
| 60 – 72% | 2 · a small flat | 5 |
| 72 – 85% | 3 · a family house | 9 |
| 85 – 100% | 4 · a modern house | 13 |
| ≥ 100% | 5 · the villa | 17 |

## Days of freedom

> How many days of retirement your savings pay for, at 65, in today's money.

```text
daily gap   = net salary × (65% − your state pension rate) ÷ 30.4
days        = savings × (1.022 ^ years until 65) ÷ daily gap
```

- **65%** of salary is the target for a comfortable retirement (OECD guideline); the state pension covers your own rate (48% with a full career).
- Example: 34 years old, 6,500 RON net, full career, 42,000 RON in Pillar II → gap ≈ 36.3 RON/day, savings grow ×1.96 → about **6 years 1 month**.
- Above 15 years (the retirement horizon) it shows **"15+ years"**.

Each contribution adds days the same way (`daysAtRetirement()`), so the month-end offer can say "+12 days of freedom".

## No double counting

A Pillar III statement uploaded later already contains the money LifeGrowth sent there. Contributions count toward days only if they were invested **after** the newest Pillar III statement date.
