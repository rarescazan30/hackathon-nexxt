---
title: "Onboarding"
description: "The four steps from sign-up to 'Start saving'."
---

# Onboarding

Route `/onboarding`, component `components/onboarding/onboarding-flow.tsx`. Four screens; **nothing is saved until the last one**, then `completeOnboarding()` writes everything at once.

```mermaid
flowchart LR
  S1[1 · Pension documents] --> S2[2 · Three questions] --> S3[3 · The reveal] --> S4[4 · Piggy bank] --> APP[/app]
```

## 1 · Pension documents

- Upload a **Pillar II or Pillar III statement** (PDF, max 5 MB). The AI reads provider, balance and date; the user checks and can edit them. See [PDF reader](pdf-reader.md).
- **Add a pension by hand** / **Add another pension**: a new card starts as the pillar that is still missing.
- If the AI can't read the file, a manual card opens by itself.
- "I don't have a private pension" is always possible.

## 2 · Three questions

Birth year, net monthly salary, years worked. Checked in the browser *and* on the server by the same function, `profileError()` (`lib/rules/profile-limits.ts`):

| Rule | Why |
|---|---|
| Net salary 2,000 – 100,000 RON | A typo like `1` made the reveal show 41,161% |
| Age 18 – 64 | At 65 you're already retired |
| Years worked ≤ age − 16 | You can't have worked longer than you've been of working age |

## 3 · The reveal

`components/onboarding/reveal-step.tsx`. The numbers are computed in the browser by the same pure function the server uses, `lifestyleNumbers()`:

- the island at the user's **starting level** and what each slot is (home, transport, food, extras);
- **expected income at 65** (RON/month);
- **compared to your life today** (%; shown as "more than 150%" above that);
- **days of freedom** the savings buy at 65, counting up;
- a note on inflation and the **welcome bonus** (+260 XP).

How these are calculated: [Retirement model](retirement-model.md).

## 4 · Piggy bank

- **Round up each card payment** to 1, 5 or 10 RON (or off). Example: coffee 12.30 RON → +2.70 RON with 5 RON.
- **Share of salary** each month: 0, 1, 3 or 5%.
- **Connect your bank** → [Open Banking (demo)](open-banking.md), or **upload a bank statement** instead.
- Accept the terms (the one-month hold and who keeps the interest are spelled out) → **Start saving**.

## What `completeOnboarding()` saves

1. Pensions → `pension_assets`; answers → `profiles` (via `saveProfileData`, shared with Profile).
2. `start_level` (the level never goes down later), `last_seen_level` (so the starting level doesn't replay as a level-up), `welcome_bonus_xp = 260`.
3. Round-up rule, salary share, bank choice, terms accepted.
4. If the bank was connected: the last 3 months of payments + this month so far.
5. This month's counter (`rebuildJar`), then redirect to `/app`.
