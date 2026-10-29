---
title: "Money rules"
description: "Every constant and function in lib/rules, with its source."
---

# Money rules (`lib/rules/`)

Pure functions, no database, no network. All amounts are **integer bani** (1 RON = 100 bani). Every constant has a named source in `config.ts`.

## Constants

| Constant | Value | Source / reason |
|---|---|---|
| `STANDARD_RETIREMENT_AGE` | 65 | Law 360/2023 |
| `RETIREMENT_HORIZON_YEARS` | 15 | INS, life expectancy at 65 (~14.9 years) |
| `STATE_PENSION_REPLACEMENT_RATE` | 0.48 | CNPP, OECD Pensions at a Glance |
| `TARGET_RETIREMENT_REPLACEMENT_RATE` | 0.65 | OECD planning guideline |
| `FULL_CONTRIBUTION_YEARS` | 35 | Law 360/2023, art. 49 |
| `PILLAR_TWO_CONTRIBUTION_RATE` | 0.0475 | Law 411/2004, 4.75% of gross since 2024 |
| `NET_TO_GROSS_RATIO` | 0.585 | Fiscal Code: 25% CAS, 10% CASS, 10% tax |
| `RO_INFLATION_BY_YEAR` | 2016–2025 | INS yearly CPI |
| `INFLATION_10Y_AVERAGE` | ≈ 0.052 | geometric mean |
| `PENSION_FUND_NOMINAL_RETURN` | 0.075 | ASF, Pillar II 2008–2024 |
| `REAL_RETURN_AFTER_INFLATION` | ≈ 0.022 | computed |
| `FLOAT_INTEREST_RATE` | 0.05 | assumption, close to the BNR deposit rate |
| `DAYS_PER_MONTH` | 30.4167 | 365.25 ÷ 12 |
| `TIER_THRESHOLDS` | 0.60, 0.72, 0.85, 1.00 | tuned on the test personas |
| `XP_PER_DAY` · `STREAK_BONUS_XP` | 10 · 20 | game balance |
| `FIRST_LEVEL_XP` · `LEVEL_XP_GROWTH` | 300 · 1.25 | game balance |
| `WELCOME_BONUS_XP` | 260 | first accepted month levels up |

## Functions

| Function | Returns |
|---|---|
| `roundUp(amountBani, rule)` | the round-up of one payment (step rule: 12.30 with 5 RON → 270 bani; an exact multiple → 0) |
| `jarTotal(parts, cap?)` | a month's total, optionally capped |
| `projectedRetirementIncome(input)` | state, Pillar II, Pillar III and total monthly income at 65, replacement ratio, state rate, growth factor |
| `tierFromRatio(ratio)` · `firstLevelOfTier(tier)` | the starting tier and level |
| `daysOfFreedomFromSalary(savings, salary, stateRate?)` | days in today's money, without growth |
| `daysAtRetirement(amount, salary, income)` | days an amount buys at 65 (with real growth) |
| `xpFromContributions(contributions, salary, income)` | XP earned from accepted months, with streak bonuses |
| `levelState(startLevel, xp)` | level, tier, slots, XP into the level, next unlock |
| `slotsAtLevel(level)` · `slotUnlockedAt(level)` | what the island shows; which slot a level upgrades |
| `floatInterestBani(amount, days, rate?)` | interest on money held for `days` |
| `profileError(facts, year?)` | the first problem with the user's answers, or `null` |
| `formatFreedom(days)` · `formatRatio(r)` · `formatRon(bani)` | display strings: "3 years 2 months", "79%", "1,293.50 RON" |

## Profile limits

`lib/rules/profile-limits.ts`, used in the browser and on the server:

| Field | Rule |
|---|---|
| Net salary | 2,000 – 100,000 RON a month |
| Age | 18 – 64 |
| Years worked | 0 – (age − 16) |

## From rows to screens: `lifestyleNumbers()`

`lib/data/lifestyle-state.ts` turns a user's rows into everything the app shows. It's pure, so the reveal (in the browser), the loader, the actions, the seed and the tests all get the same numbers.

```ts
const numbers = lifestyleNumbers({
  birthYear, netSalaryBani, yearsWorked,
  assets,             // pension_assets rows
  jars,               // monthly_jars rows
  storedStartLevel,   // the level never goes down
  welcomeBonusXp,     // 260 for new accounts
})
// → { age, income, startLevel, level, totalDays, daysFromApp, contributedBani }
```
