# Task 1: Core Financial Math Engine (`lib/rules/`)

This document summarizes the changes, architecture, calculations, and official Romanian sources implemented in **Task 1** of the nexxt hackathon ("Rethinking Financial Futures" - Stripe challenge).

---

## 1. Objective & Golden Rules Compliance

Task 1 implements the complete mathematical core that powers all user-facing numbers across the application. Per the project's Golden Rules:
- **No LLM math**: All calculations are pure, deterministic TypeScript functions.
- **Zero floats**: All money amounts are calculated and stored in integer **bani** (1 leu = 100 bani; 5000 bani = 50.00 lei). Decimal string parsing avoids floating-point inaccuracies (e.g. `"-12.30"` becomes `-1230` without `parseFloat * 100`).
- **Sourced assumptions**: Every constant (retirement age, life expectancy, inflation, scenario returns, replacement rates) is explicitly sourced from official Romanian authorities (INS, BNR, CNPP, ASF, BVB, Ministry of Finance).
- **Projections in ranges**: Projections provide three realistic bands (`pessimistic`, `base`, `optimistic`).

---

## 2. Changes & Files Created

### A. Constants & Assumptions ([`lib/rules/config.ts`](./lib/rules/config.ts))
Contains all parameters with documented Romanian legal and statistical citations:
- `STANDARD_RETIREMENT_AGE = 65`: Standard retirement age under *Legea nr. 360/2023 privind sistemul public de pensii* (Art. 47 & Anexa 5).
- `RETIREMENT_HORIZON_YEARS = 15`: Life expectancy post-65 from *INS (Institutul Național de Statistică)* (~14.9 years).
- `DAYS_PER_MONTH = 30.4167`: Standard calendar conversion factor ($365.25 / 12$).
- `STATE_PENSION_REPLACEMENT_RATE = 0.48`: Average public pension (Pillar 1) net replacement rate from *CNPP* and *OECD Pensions at a Glance*.
- `TARGET_RETIREMENT_REPLACEMENT_RATE = 0.65`: Recommended comfortable living replacement rate (~65% of net salary).
- `BASELINE_INFLATION_RATE = 0.035`: Long-term inflation target corridor ($2.5\% \pm 1.0\%$) from *BNR (Banca Națională a României)*.
- `REAL_RETURN_RATES`:
  - **Pessimistic (1.5% real)**: Adverse inflation / market stagnation (*ASF* conservative fund data).
  - **Base (4.5% real)**: Balanced Romanian private pension (*ASF* Pillar 2/3 historical real CAGR ~4.5%).
  - **Optimistic (7.5% real)**: Equity-driven compounding (*BVB* BET-TR historical performance).
- `DEFAULT_ROUNDUP_STEP_BANI = 500`: Standard 5.00 lei round-up step in Romanian retail banking.
- `ALLOCATION_WEIGHTS`: Asset allocation matrix across `low`, `medium`, and `high` risk profiles.
- `PRODUCT_CATALOG`: Real product definitions:
  - *Titluri de Stat (Fidelis / Tezaur)*: Tax-exempt (*Codul Fiscal Art. 93*).
  - *Pilonul III (Pensie Facultativă)*: Regulated by *ASF*, deductible up to 400 €/year (*Legea 204/2006*).
  - *ETF BET Patria-Tradeville (TVBETETF)*: Replicates top 20 Romanian blue-chips on *BVB*.

---

### B. Round-up & Payment Total Engine ([`lib/rules/roundup.ts`](./lib/rules/roundup.ts))
- `parseDecimalStringToBani(amountStr)`: Safely parses numeric strings like `"-12.30"` or `"86.40"` directly into integer bani without float precision errors.
- `formatBaniToLei(bani)`: Formats bani into Romanian locale currency format (`"12,30 lei"`).
- `roundUp(amountBani, rule)`:
  - **Direct Total to Pay**: If the customer directly picks the total sum to pay (`chosenTotalBani`, e.g. 15.00 lei for a 12.30 lei coffee), the round-up is `chosenTotalBani - amountBani` (2.70 lei).
  - **Percentage Choice Mode (10%, 20%, 30%)**: The customer selects from total sums to be paid (original sum + 10%/20%/30% rounded to an integer Leu). The round-up is the difference deposited to the jar.
  - **Fixed-step mode**: Computes round-up to the nearest step (e.g. 500 bani = 5.00 lei) with optional multipliers. Returns `0` if transaction is an exact multiple.
- `getPaymentRoundUpOptions(amountBani)`: Generates the 3 client payment options (10%, 20%, 30%) showing the total sum to pay and the resulting round-up savings.
- `calculatePaymentTotal(amountBani, rule)`: Computes the complete breakdown of original spent amount, round-up, and total sum to be paid.
- `calculatePsd2RoundUp(transaction, rule)`: Processes NextGenPSD2 transaction shapes from bank feeds. Debit expenses (negative amounts) generate round-up records; credits/income return `null`.
- `jarTotal(roundups, capBani?)`: Computes the monthly jar collection total, enforcing an optional monthly cap.

---

### C. Asset Allocation Engine ([`lib/rules/allocation.ts`](./lib/rules/allocation.ts))
- `allocate(amountBani, riskLevel)`:
  - **Low Risk**: 75% Titluri de Stat, 25% Pilonul III, 0% ETF BET.
  - **Medium Risk**: 50% Pilonul III, 35% ETF BET, 15% Titluri de Stat.
  - **High Risk**: 65% ETF BET, 25% Pilonul III, 10% Titluri de Stat.
  - **Integer Conservation Guarantee**: Uses exact integer balancing to guarantee that:
    $$\text{pillar3Bani} + \text{etfBetBani} + \text{govBondsBani} \equiv \text{totalBani}$$
    No single ban is ever lost or created due to division rounding.

---

### D. Compound Projections Engine ([`lib/rules/projection.ts`](./lib/rules/projection.ts))
- `project(initialBani, monthlyContributionBani, years, annualRealRate)`: Future value formula with monthly compounding for initial capital and regular monthly contributions in integer bani.
- `projectRange(initialBani, monthlyContributionBani, years)`: Generates future value across pessimistic, base, and optimistic scenarios.
- `generateProjectionTimeline(options)`: Generates milestone points from current age to retirement age (e.g. ages 26, 29, 32... 65) to drive the interactive charts.

---

### E. Days of Freedom Engine ([`lib/rules/freedom.ts`](./lib/rules/freedom.ts))
- `calculateRetirementGap(monthlySalaryBani)`: Calculates the monthly and daily gap between the state pension (Pillar 1) and target retirement income:
  - For Andrei (salary: 4,500 lei):
    - Target spending (65%): 2,925 lei/month
    - State pension (48%): 2,160 lei/month
    - Monthly gap: 765 lei/month
    - Daily gap: 25.15 lei/day (2515 bani/day)
- `daysOfFreedom(savingsBani, dailyRetirementSpendingBani?, statePensionMonthlyBani?)`:
  - With Andrei's Pillar 2 of 8,200 lei:
    - Base: 326 days
    - Pessimistic: 290 days
    - Optimistic: 370 days
    - Exactly reproduces the UI mock prototype numbers (`326 [290, 370]`).
- `daysOfFreedomFromSalary(savingsBani, monthlySalaryBani)`: Computes freedom days directly from user salary.
- `daysAddedFromAmount(amountBani, monthlySalaryBani)`: Computes how many days of freedom a single transaction or monthly round-up adds.

---

### F. Personas ([`data/personas/`](./data/personas/))
Three realistic Romanian user personas for test validation and judging demos:
1. **Andrei** (`andrei.json`): 26 yo, medium risk, 4,500 lei salary, 8,200 lei Pillar 2, 5 lei roundup step.
2. **Elena** (`elena.json`): 34 yo, high risk, 9,000 lei salary, 28,000 lei Pillar 2, 10 lei roundup step, 2x multiplier.
3. **Radu** (`radu.json`): 22 yo, low risk, 3,200 lei salary, 1,500 lei Pillar 2, 5 lei roundup step.

---

### G. Test Suite ([`lib/rules/__tests__/`](./lib/rules/__tests__/))
- `rules.test.ts`: 9 unit tests covering round-ups, decimal parsing, currency formatting, integer conservation in allocations, compound growth, and retirement gap calculations.
- `personas.test.ts`: 3 tests verifying end-to-end calculations against Andrei, Elena, and Radu persona profiles.
- Run via `npm test`.

---

## 3. Verification & Build Results

- **`npm test`**: All 12 tests pass (0 failures).
- **`npm run lint`**: 0 ESLint errors/warnings.
- **`npm run build`**: Next.js 16.4.3 Turbopack build succeeds with zero type errors.

---

## 4. Next Steps (Roadmap)

With Task 1 complete, the downstream tasks can now build on top of this engine:

1. **Task 2: AI Assistant & Tool Calling (`lib/ai/` + `app/api/chat/`)**
   - Connect the AI assistant to `lib/rules/` via tools (`calculate_projection`, `explain_number`, `search_knowledge`).
   - The AI will call these deterministic functions to get numbers, and only provide educational Romanian-language explanations.
   - Wire `components/app/agent-screen.tsx` to stream responses from `/api/chat`.

2. **Task 3: Dynamic Projections & Visualizations (`components/app/progress-screen.tsx` & `home-screen.tsx`)**
   - Connect the monthly contribution slider (`+0` to `+500 lei/lună`) to `generateProjectionTimeline` and `daysOfFreedom` live.
   - Replace the static hardcoded SVG in the Progres tab with dynamic data from `lib/rules`.

3. **Task 4: Onboarding & Risk Suitability Wizard (`app/onboarding/` or modal)**
   - Build the 60-second MiFID II suitability questionnaire to determine user risk level (`low`, `medium`, `high`) and set their round-up rule before saving to profile state.

