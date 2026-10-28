# Plan v2.2 — second feedback round (28 Oct 2026)

Builds on [plan-qol.md](plan-qol.md) (v2.1, done). Same rules: current theme, English app text,
fictional data only, money in integer bani.
**Status (28 Oct 2026, 21:30): built.** Answers: Q1 icon + word, Q2 option B, Q3/Q4 card pays the monthly amount via Stripe Elements, Q5 keys added by the team later. How to test Stripe: [STRIPE_TESTING.md](STRIPE_TESTING.md).

---

## 1. UI fixes (small)

### 1.1 Logo top left: piggy bank icon **[needs answer Q1]**
- Today: `Logo` in `components/app/shell.tsx` shows the placeholder `public/logo.svg` + the word "zile.".
- Change: show the piggy bank icon (lucide `PiggyBank`, the one we had before, white on purple) in the top-left corner.

### 1.2 Landing: Sign up / Log in between the text and the island
- Remove the two buttons from the nav (nav keeps only the logo).
- Under the short text, before the island: **Sign up** (primary, full width on phones) and **Log in** (secondary) on top of each other, max width 360px.
- File: `app/page.tsx`.

### 1.3 "On date" field cut off in "Your pension documents"
- Cause: Balance and On date sit side by side (`grid-cols-2`); the browser's date input has a minimum width larger than half the card on a phone, so it spills out.
- Fix: on phones put them on two rows (`grid-cols-1 sm:grid-cols-2`) and add `min-w-0` + `w-full` to the date input.
- File: `components/pensions/pensions-editor.tsx` (used in onboarding and Profile, so both get fixed).

### 1.4 Level pill wraps ("Level" and "11" on two lines)
- Move the pill out of the row, above "If you retired today", on its own line, with `whitespace-nowrap`.
- File: `components/app/home-screen.tsx`.

### 1.5 Remove "Pay with card (demo)"
- Delete `components/app/pay-with-card.tsx`, the `payWithCard` action and its use on the Month tab.
- Round-ups in the demo then come only from the mock bank (card payments imported each simulated month). `connectCard` stays (used by 3.x).

### 1.6 Text: "+X with zile." → "+X since using our app"
- Home days card: **"+6 days since using our app"**.
- File: `components/app/home-screen.tsx`.

---

## 2. Days of freedom with the last 10 years of inflation **[needs answer Q2]**

**Data (INS, average yearly CPI):**

| 2016 | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 |
|---|---|---|---|---|---|---|---|---|---|
| −1.5% | 1.3% | 4.6% | 3.8% | 2.6% | 5.1% | 13.8% | 10.4% | 5.6% | 7.3% |

- Together: prices rose **~66%** in 10 years → **~5.2% a year** on average (geometric mean).
- Today the code assumes 3.5% (`BASELINE_INFLATION_RATE`) and isn't actually using it for days.
- 2025 comes from secondary sources citing INS; we check it on insse.ro before the pitch.

**Important to understand:** today days are in *today's money*: savings ÷ today's daily gap. If we add inflation only to the cost and not to the savings, the number collapses (42,000 RON over 31 years at 5.2% buys ~5× fewer days), which is only true if the money sits uninvested. Pension funds do grow, so the honest version applies inflation to both sides.

**Proposal (option B):**
- New constant `INFLATION_10Y_AVERAGE = 0.052`, with the table above as its source, in `lib/rules/config.ts`.
- The real return used everywhere = **nominal fund return − 10-year inflation**. With Pillar II's historical ~7.5% nominal → ~2.3% real (instead of the guessed 1.5% / 4.5%).
- Days of freedom = what today's savings will be worth **at 65, in today's money**, ÷ the daily gap. They grow with the years left, and inflation is what slows them down.
- One education line on the reveal: *"Prices rose 66% in the last 10 years. That's why money that just sits loses days."*
- Tests + persona numbers updated (Andrei's days will change).

**Option A (simpler, harsher):** keep days in today's money, add a second number: *"if this money just sat in an account, inflation would cut it to X days by 65"*.

---

## 3. Paying by card, and adding a card by hand **[needs answer Q3, Q4, Q5]**

### What a card number can and can't do (important)
- With a card number we can **charge** the card (pay the monthly amount).
- We **can't read its transactions** with a card number. Round-ups need the payment list, which comes from the bank (PSD2 / our mock bank), not from the 16 digits. So "add card by hand" = **how you pay**, not where round-ups come from.

### Never store card details ourselves
- Saving the 16 digits / CVV in our database is forbidden (PCI DSS) and the CVV may never be stored at all.
- The right way, and a good fit for the **Stripe challenge**: **Stripe Elements** in test mode. The card form (number, MM/YY, CVC, name) is Stripe's own secure field inside our page; the digits go straight to Stripe, and we only get back a token plus **brand + last 4 digits** ("Visa •• 4242").
- Test cards (e.g. 4242 4242 4242 4242, any future date, any CVC) — no real money.

### Proposed flow
1. **Profile → "Payment card"** (and optionally onboarding step 4): "Add a card" opens the Stripe card form with name on card. Saved via a SetupIntent; we store `stripe_customer_id`, `stripe_payment_method_id`, `card_brand`, `card_last4` on the profile.
2. **Month end → "Yes, add it"**: if a card is saved, we create a Stripe PaymentIntent in test mode for that amount (off-session, the saved card), store `stripe_payment_intent_id` on the jar (the column already exists), then collect as today. If the card needs 3-D Secure, Stripe shows its own confirmation screen.
3. A Stripe webhook (`/api/stripe/webhook`, signature checked with `STRIPE_WEBHOOK_SECRET`) marks the jar paid or failed.
4. Without a saved card, the Banca Demo confirmation stays as the fallback.

### What we need
- `npm install stripe @stripe/stripe-js @stripe/react-stripe-js`.
- Stripe **test** keys in `.env.local` (`STRIPE_SECRET_KEY=sk_test_…`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_…`, `STRIPE_WEBHOOK_SECRET`). They are **not set yet**.
- Migration: 4 card columns on `profiles`.
- For webhooks locally: `stripe listen --forward-to localhost:3000/api/stripe/webhook` (Stripe CLI), or through the ngrok URL.

---

## Order

| Step | Size | Depends on |
|---|---|---|
| 1 UI fixes | S | Q1 |
| 2 Inflation | M | Q2 |
| 3 Card payments | M–L | Q3–Q5, Stripe test keys |

Each step ends with lint, tests, build and a click-through.

---

## Open questions

- **Q1** Logo: piggy bank icon **with** the word "zile." next to it (as before v2.1), or **only** the icon?
- **Q2** Inflation: option B (honest projection to 65, days go up with time) or option A (keep today's days, add an "if it just sat there" warning)?
- **Q3** The manual card is for **paying the monthly amount** (round-ups still come from the bank connection). Is that what you meant?
- **Q4** OK to use **Stripe Elements** (Stripe's secure card form) instead of our own inputs? Our own fields that send the digits to our server are not allowed (PCI).
- **Q5** Can someone create a Stripe account and put the **test** keys in `.env.local`? Without them step 3 can't run.
