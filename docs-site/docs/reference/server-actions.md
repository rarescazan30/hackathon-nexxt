---
title: "Server actions and routes"
description: "Every Server Action and API route, what it takes and what it changes."
---

# Server actions and routes

Every action reads the user from the session, validates its input with Zod and calls `refresh()` when the page should update.

## Auth — `app/auth/actions.ts`

| Action | Does |
|---|---|
| `signIn(state, form)` | email + password → `/app` |
| `signUp(state, form)` | creates the account (name stored on the profile) → `/onboarding` |
| `/auth/signout` (route) | logs out → `/login`, or `/register` with `?next=/register` |

## Onboarding — `app/onboarding/actions.ts`

| Action | Does |
|---|---|
| `uploadDocument(formData)` | stores a PDF, reads it (pension or bank statement); bank payments are imported right away |
| `completeOnboarding(input)` | saves answers, pensions, settings, bank choice, welcome bonus; imports bank history; opens this month → `/app` |

## The app — `app/app/actions.ts`

| Action | Does |
|---|---|
| `simulateMonthEnd()` | demo time machine: invest held money, import the month's payments, make the offer |
| `answerMonthlyOffer({ jarId, accept, amountBani? })` | "Not this month" (and the no-Stripe path); opens the next month |
| `markLevelSeen(level)` | the level-up overlay was shown |
| `updateSettings({ roundupRuleBani, salaryPercentBp })` | round-up rule and salary share; rebuilds the open month |
| `updateProfileData(input)` | new salary / age / years / pensions; level never goes down |
| `createShareLink(formData)` | public share card + preview image → `/i/<code>` |
| `connectCard({ bankName, cardLast4 })` | Open Banking (demo): store the choice, import 3 months of payments |
| `disconnectBank()` | stop reading payments |

## Card payments — `app/app/card-actions.ts`

| Action | Does |
|---|---|
| `startCardSetup()` | Stripe customer + SetupIntent → `clientSecret` |
| `saveCard(setupIntentId)` | verifies it with Stripe, stores brand + last 4 |
| `removeCard()` | detaches the card |
| `payMonthWithCard({ jarId, amountBani? })` | charges the month; `paid`, `requires_action` (3-D Secure) or `failed` |
| `completeCardPayment(paymentIntentId)` | after 3-D Secure: checks with Stripe, then accepts the month |

## Routes

| Route | Method | Does |
|---|---|---|
| `/api/stripe/webhook` | POST | Stripe events → `payment_status` (signature-checked, de-duplicated) |
| `/auth/signout` | GET / POST | log out |
| `/i/[code]` | page | public shared island |
| `/admin` | page | company dashboard (admin only) |

## Domain functions — `lib/server/`

| Function | File | Does |
|---|---|---|
| `rebuildJar(db, userId, month)` | `jar.ts` | payments → round-ups → the month's totals |
| `offerJar`, `answerOffer`, `collectJar`, `investJar` | `money-flow.ts` | the month's status changes |
| `importMockMonth`, `importBankHistory` | `mock-bank.ts` | fictional bank transactions |
| `importStatementTransactions` | `statement-import.ts` | bank statement → transactions, deduplicated |
| `saveProfileData` | `profile-data.ts` | shared save for onboarding and Profile |
| `getStripe`, `stripeIsConfigured` | `stripe.ts` | lazy Stripe client, refuses live keys |
