# lib/rules/: deterministic money math

Owner: **Backend Lead**. Read the root `AGENTS.md` first.

## Purpose

All calculations that produce numbers the user sees: round-ups, monthly allocation by
risk level, projections, days of freedom. This is what makes the product trustworthy:
**the AI never computes these.**

## Rules

- Pure functions only: no database, no network, no `Date.now()` inside (pass dates in).
- Money in **integer bani**. Rates as decimals (0.05 = 5%).
- Every assumption (inflation, return per scenario, retirement age…) is a named
  constant in one config file, with a comment pointing to its source.
- Projections return a **range** (pessimistic / base / optimistic), never a single
  "exact" number.
- Each function has tests built from the personas in `data/`. A judge may ask to see one.

## Planned functions (draft)

- `roundUp(amountBani, rule)` → round-up for one transaction
- `jarTotal(roundups, cap)` → amount to collect this month
- `allocate(amountBani, riskLevel)` → split across products
- `project(portfolio, contributions, years, scenario)` → future value
- `daysOfFreedom(savings, dailyRetirementSpending, statePension?)` → range of days
