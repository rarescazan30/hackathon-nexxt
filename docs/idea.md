# Idea: Zile de Libertate (working title)

Status: **direction chosen, details open.** Update this file when something is decided.

## One-liner

We don't tell you to spend less. We turn your everyday spending into days of freedom.

## Who it serves

Young people and professionals in Romania (roughly 22–40) who worry that the public
pension won't be enough and don't know where to start. Low financial literacy, little
time, no interest in tracking a budget.

## Problem

- Pension pressure: almost as many pensioners as employees; Pillar III uptake is low.
- Savings sit in current accounts, deposits or cash.
- Financial literacy in Romania is among the lowest in the EU.
- Existing tools ask for discipline (budgets, tracking). Most people quit.

All figures used in the pitch must have a source: see `docs/judging.md`.

## Core experience (end to end)

1. **Onboarding (~60 s):** goal, horizon, 3 short suitability questions → risk level
   (Low / Medium / High), rounding rule, monthly cap.
2. **Link a card** (Stripe test mode, saved once like in Uber).
3. **Spending comes in** from the bank (mock NextGenPSD2) or a statement upload
   (PDF/CSV, extracted by AI).
4. **Round-ups:** 340 → 350 lei, 10 lei go into the jar (a ledger, not real money held).
5. **End of month (automatic):** a cron job charges the jar total to the saved card
   (Stripe, off-session), then the webhook splits it by risk level into simulated orders.
6. **Days of freedom** go up. Tap any number to see where it comes from.
7. **"What if…?" agent:** "what if I add 200 lei/month?" → the number changes, as a range.

## Risk level → allocation (draft, PM to confirm real products)

| Risk | Allocation |
|---|---|
| Low | deposit / bond fund (government bonds when an issue is open) |
| Medium | Pillar III + bond fund |
| High | equity / index fund + Pillar III |

## What is real vs simulated in the prototype

| Step | Prototype | Production |
|---|---|---|
| Spending data | mock PSD2 JSON + real AI statement upload | bank via PSD2 (Raiffeisen) |
| Collecting the jar | Stripe test mode, real flow | bank debits the account directly |
| Investing | ledger in our database, historical unit prices | Raiffeisen or a licensed broker / partner |

## Where the AI matters

- Categorizing transactions and estimating which costs change in retirement.
- "What if…?" agent that calls the projection engine as a tool.
- RAG with citations over official sources (Pillar III, ASF, BVB, pension law).
- Extracting transactions from an uploaded bank statement.

## Open questions

- [ ] Exact formula for a "day of freedom" (include the estimated state pension? as a range?)
- [ ] Projection scenarios: 3 fixed scenarios or Monte Carlo band?
- [ ] Rounding rule and monthly cap defaults
- [ ] Which real Romanian products we name for each risk level
- [ ] Motivation mechanics: notifications, milestones, streaks?
- [ ] Is Stripe a sponsor/prize track? (affects how much we show it)
