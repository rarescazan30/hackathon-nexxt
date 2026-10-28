# Plan v2: "How will you live in retirement?"

Status: **agreed direction, open details in section 12.** Replaces `docs/plan-task4.md`.
**Built:** all phases A1–D2 on branch `new_app`. Demo: `npm run seed`, then "Log in as Andrei (demo)".
Owner of the plan: Rareș. Every section says what is reused from the current code.

---

## 1. The product in one paragraph

**Hook:** *"Want to find out how you'll live in retirement? Our app shows you."*
For people aged 30–40. In one minute (a scanned pension statement plus 3 questions) the
app shows a small low-poly 3D scene of **how you'd live in retirement today**: home,
transport, food, extras. Every card payment is rounded up. At month end the app suggests
*"Add 169 RON to your Pillar III pension"*. One tap, and the money goes to a Pillar III fund.
Each contribution adds **days of freedom** (the honest number, top of the screen) and
**XP** (the game). XP raises your level, and the scene upgrades one object at a time.

**One problem:** people in their 30s can't picture their retirement, so they don't save
for it. We make it visible and make saving automatic.

**Not:** a budgeting app, an investment app, a chat assistant.

## 2. Decisions

| Topic | Decision |
|---|---|
| Language | **All app text in English**: UI, errors, AI messages, landing, T&C. Money as `169 RON`, numbers in `en` format (`1,293.50 RON`). Brand stays `zile.` |
| Starting point | From the **real projected pension**, so nobody starts in a tent by default |
| Onboarding | As short as possible; PDF scan of pension statements, typing as a fallback |
| Days | Shown at the top as the hook; they grow into months, then years |
| XP | Drives levels and milestones; early levels close together |
| Round-ups during the month | Our app account is a **counter**; no money moves until month end |
| Business model | **The mentor's model:** we hold the confirmed money for one month, keep the interest, then send the money to Pillar III. Stated in the T&C and on the confirm screen (section 4) |
| Destination | **Pillar III only** (Pillar II takes no extra money); tax-deductible up to 400 €/year |
| One-month delay | Disclosed in one line on the confirm screen |
| Persona | Andrei is **34**, net salary 6,500 RON, 12 years worked, Pillar II 42,000 RON |
| AI | **No chat tab.** The AI writes the monthly message and reads the PDF statements |
| Partner offers at milestones | Pitch only, not in the demo |
| Visuals | Indie low-poly 3D, built in code (no model files) |

## 3. Things to keep in mind

1. **Who legally holds the money for the month.**
   - In the pitch, say it happens "through our licensed banking partner".
   - Holding customer money directly needs a BNR license; with a partner bank, the model
     is the same and nobody can poke a hole in it.
   - The mentor's model doesn't change, only who holds the account.
2. **3D on cheap phones.** WebGL can be slow or missing, so:
   - very low poly;
   - low pixel ratio;
   - pause when off-screen;
   - a 2D fallback card if WebGL fails.

---

## 4. Money flow and business model

```
during the month      each card payment → round-up added to the counter (no money moves)
end of month (day 1)  app: "Add 169 RON to your Pillar III?"  → user taps Yes (or changes the amount)
day 1                 one debit from the user's bank → our partner account (Stripe test mode in the demo)
days 1–30             the money sits in the partner account; the interest is ours
next month (day 1)    the money goes to the user's Pillar III fund → units bought
```

### How much we make (interest on one month)

Formula: **amount × yearly rate ÷ 12**. The rate is an assumption: what a bank account or
overnight deposit pays. For reference, the BNR deposit facility rate was around 5% in 2025.

| Users | Each adds per month | Money held | At 4% / year | At 5% / year | At 6% / year |
|---|---|---|---|---|---|
| 1 | 500 RON | 500 RON | 1.67 RON | **2.08 RON** | 2.50 RON |
| 1,000 | 500 RON | 500,000 RON | 1,667 RON | **2,083 RON** | 2,500 RON |
| 100,000 | 500 RON | 50,000,000 RON | 166,667 RON | **208,333 RON** | 250,000 RON |

- That's **per month**. At 5%, 1,000 users ≈ **25,000 RON/year**, and 100,000 users ≈
  **2.5 million RON/year**.
- If a partner bank keeps a share of the interest, our part is smaller. The split is
  negotiated, and the pitch should name an assumption (e.g. 50/50).
- **This is the base revenue.** The second source (pitch only) is partner offers at milestones.

### What the user sees

- **Confirm screen, one line:** *"Your money stays with our banking partner for one month,
  then goes to your Pillar III. The interest from that month keeps the app free."*
  It links to `/terms`.
- **`/terms`:** a short T&C page in plain English. It covers:
  - the one-month hold and that we keep the interest;
  - that the money reaches Pillar III on the 1st of the next month;
  - that this is education, not investment advice;
  - that a licensed partner holds the money and the pension fund executes the purchase.
- `profiles.terms_accepted_at` records the user's acceptance. It is set in onboarding.
- **Demo:** a "Simulate end of month" button runs the whole flow in seconds.

---

## 5. The numbers: days, XP, levels

All of this goes in **`lib/rules/lifestyle.ts`** (Ana). It's pure functions with named
constants and sources, and it's tested like the rest of `lib/rules`.

### Days of freedom (top of the screen)

- **What it is:** days of retirement your private savings cover. Private savings means
  Pillar II, Pillar III, and the contributions made through the app.
- **How it's calculated:** reuse `daysOfFreedom` / `calculateRetirementGap` from `freedom.ts`.
- **Display:** `formatFreedom(days)` → "12 days", "4 months 3 days", "2 years 5 months".
- **Below it:** "+38 days with zile.", so the user sees their own effect.

### Starting level (from the real projected pension)

1. Compute the projected monthly income at retirement, in today's money:
   - state pension: `STATE_PENSION_REPLACEMENT_RATE` × salary, scaled by contribution years
     (years worked + years left until 65) out of 35;
   - Pillar II: today's balance + future mandatory contributions, projected to 65, then
     spread over `RETIREMENT_HORIZON_YEARS`;
   - Pillar III: the same, without future contributions.
2. **Replacement ratio** = that income ÷ today's net salary. This is the honest
   "lifestyle" measure: how your retirement life compares to your life today.
3. Ratio → starting tier:

| Ratio | Tier | Scene | Starting level |
|---|---|---|---|
| < 60% | 1 | Tent, canned food, the bus | 1 |
| 60–72% | 2 | Small rented flat, simple cooking, bike | 5 |
| 72–85% | 3 | Family house, old car, good groceries | 9 |
| 85–100% | 4 | Modern house, newer car, eating out | 13 |
| ≥ 100% | 5 | Villa, luxury car, private chef, pool | 17 |

The projection uses the **pessimistic** real return (1.5%), so the reveal never flatters.
Andrei (34) gets 75% → tier 3. A full state pension alone is 48%, so tier 1 means
almost no private pension.

The bands are a first guess; Ana tunes them against the personas. A typical 30–40 year
old should land in tier 2–3.

### XP and levels

- **XP:** 20 XP per day of freedom added through the app, plus 20 XP for each month in a
  row with a contribution (the streak). Andrei's ~225 RON/month adds 6 days → 140 XP.
- XP only counts what the user did through the app. The starting level already covers the
  past.
- **20 levels = 5 tiers × 4 slots.** Each level upgrades **one slot**, in order: home →
  transport → food → extras → next tier.
- **XP needed for the n-th level-up since onboarding:** `round50(300 × 1.25^(n−1))`, i.e.
  300, 400, 450, 600, 750… Counted from the starting level, so everyone's first upgrade
  comes after about 2 months, whatever tier they start in.
- `level(startLevel, xp)` → `{ level, tier, slots: {home, transport, food, extras}, xpIntoLevel, xpForNext }`.
- **Milestones:** every new tier (levels 5, 9, 13, 17) gets a bigger animation and a
  milestone card. In the pitch, a "Partner" offer appears here.

---

## 6. Screens

**Theme stays exactly as it is:**
- background `#f7f6f9` / `#18151f`, cards `rounded-[24px]`;
- deep purple `#33256c`, lavender `#8c7ad9`, mint for growth;
- the uppercase eyebrow + tight title, the `max-w-[430px]` column.

Use the same hex classes as Razvan's screens (he moved from tokens to hex on purpose).
**All copy in English.**

### Onboarding `/onboarding` (4 screens)

| # | Screen | Content | Saves |
|---|---|---|---|
| 1 | Your documents | "Upload your Pillar II statement (and Pillar III, if you have one)". Drop or pick a PDF; "I'll type it in" is always visible. After reading: a card "NN Pillar II · 42,000 RON · 30 Sep 2026" with Correct / Edit. | `statement_uploads`, `pension_assets` |
| 2 | 3 questions | Year of birth, net monthly salary, years worked. Filled in from the PDF when it can be. | `profiles` |
| 3 | **Reveal** | The 3D scene at the starting tier. "If you retired today, this is how you'd live." Days of freedom and the replacement ratio in words ("about 55% of your life today"). | — |
| 4 | Your piggy bank | Round-up to 1 / 5 / 10 RON, a live example ("Coffee 12.30 → +2.70 RON"), "Connect your card" (simulated), terms checkbox. | `profiles`, `terms_accepted_at`, `card_linked` |

Then `onboarding_completed = true` → `/app`.

### App `/app` (3 tabs, replacing today's 4)

**Home**
- Top: **days of freedom** (big), "+38 days with zile." below.
- The **3D scene** (about 55% of the screen height).
- Level bar: "Level 6 · 220 / 375 XP · Next: a car".
- A small card for this month: "This month: 112 RON saved".

**Month**
- This month's counter and its round-ups list (from `roundups` + `transactions`).
- At month end: the **offer card** (AI message + amount + Yes / Another amount / Not this month).
- History of past months: amount, days added, status (collected → with partner → invested).
- Demo-only button: "Simulate end of month".

**Profile**
- Round-up setting, documents (upload another statement), salary, terms link, "Log out".

**Level-up moment:** when `level > profiles.last_seen_level` on load: full-screen overlay
with the slot that changed popping in, "Level 7: you got a car!", then
`last_seen_level` is updated.

### Landing `/`

1. Hero: the hook + a live 3D scene that cycles through the tiers + "Find out in 1 minute" /
   "See the demo".
2. How it works in 3 steps: round-ups → one tap at month end → your scene grows.
3. Why it matters in Romania: 2–3 sourced numbers (replacement rate, Pillar III adoption).
4. Trust: a licensed partner holds the money, Pillar III regulated by ASF, the business model
   stated openly.
5. Final CTA. `/login` and `/register` stay (now in English).

---

## 7. The 3D scene

- **Stack:** `three` + `@react-three/fiber` (new dependencies). No model files: every
  object is a few boxes, cones and cylinders with `flatShading`, coloured from the app palette.
- **Files:**

```
components/scene/lifestyle-scene.tsx   <Canvas>, isometric orthographic camera, lights, slow idle turn
components/scene/ground.tsx            low-poly island / plot of land
components/scene/slots/home.tsx        tier 1–5: tent → flat block → house → new house → villa
components/scene/slots/transport.tsx   on foot (sign) → bike → old Dacia → newer car → luxury car
components/scene/slots/food.tsx        canned food → pot → table with groceries → restaurant table → chef + dining
components/scene/slots/extras.tsx      nothing → TV → garden → swing + trees → pool + palm
components/scene/scene-fallback.tsx    2D card with icons when WebGL is missing
```

- **Props:** `<LifestyleScene slots={{ home: 3, transport: 2, food: 3, extras: 2 }} highlight="transport" />`.
  `highlight` makes the changed slot pop and sparkle for the level-up moment.
- **Performance:**
  - loaded client-only with `next/dynamic`;
  - pixel ratio capped at 1.5;
  - rendering stops when off-screen or the tab is hidden;
  - `prefers-reduced-motion` turns off the idle turn.
- **Dev preview:** `/dev/scene`, with sliders for each slot, so the models can be built
  without the rest of the app. Hidden in production.

---

## 8. Database changes (migration 3)

```sql
-- profiles: net salary (what people know), no risk profile, level-up + terms tracking
rename gross_salary_bani → net_salary_bani
drop risk_level, risk_answers
add last_seen_level int not null default 0
add terms_accepted_at timestamptz

-- monthly jar = the offer (agent_proposals is folded into it)
jar_status: rename 'proposed' → 'offered', 'confirmed' → 'accepted'; add 'declined', 'invested'
monthly_jars add: offer_message text, accepted_amount_bani bigint,
                  invest_on date, invested_at timestamptz, float_interest_bani bigint
drop table agent_proposals

-- statements
create table statement_uploads (id, user_id, file_path, kind pillar2|pillar3,
  status uploaded|extracted|confirmed|failed, extracted jsonb, error text, created_at)  + RLS own rows
storage bucket 'statements' (private; a user only reaches userId/…)
```

- The user answers the offer through a server action, so no new RLS policy is needed on
  `monthly_jars`.
- `float_interest_bani` records what we earned on each jar. It's useful for the pitch
  ("this is what Andrei's money made us") and for being transparent.
- `products`: keep the table; seed only `pillar3`.
- XP, level, days: **not stored**, computed on read (same convention as before).
  The only exception is `last_seen_level`, which is UI memory, not a number about money.

---

## 9. What we keep, change, delete

| Area | Keep | Change | Delete (in the cleanup PR) |
|---|---|---|---|
| Auth (`app/login`, `app/register`, `app/auth`, `proxy.ts`, `lib/supabase`) | all | **English copy (done)**; after sign-up go to `/onboarding` | — |
| DB | transactions, roundups, monthly_jars, orders, pension_assets, products | migration 3 above | agent_proposals |
| `lib/server/jar.ts` | rebuildJar | money flow in `lib/server/money-flow.ts` (done): `offerJar`, `answerOffer`, `collectJar`, `investJar`, interest via `lib/rules/float.ts` | — |
| `scripts/seed.ts` | structure | Andrei 34; jars through the new statuses; a few past contributions so he's level 6–7 | proposals part |
| `lib/rules` (Ana) | roundUp, jarTotal, freedom, projection | + `lifestyle.ts`; + `formatRon()` in English format | allocation.ts stays untouched but unused |
| `lib/ai` (Sebi) | `model.ts` provider switch, mock mode | + `monthly-message.ts`, `extract-statement.ts`; prompts answer in English | chat agent, allocation/risk tools, `app/api/chat` |
| Screens (Razvan) | `shell.tsx` (Logo, Card, Header, BottomNav with 3 items), formatting helpers | new `home-screen.tsx`, `month-screen.tsx`, `profile-screen.tsx` with **props from the server**, English copy, no localStorage store | agent-screen, progress-screen, `useAppState` store, RISK_CONFIG, `data/mock/ui.ts` |
| `app/layout.tsx` | — | `lang="en"`, English description (done) | — |
| Docs | AGENTS.md rules | idea.md, architecture.md, pitch notes for v2; "English UI" rule (done) | plan-task4.md |

**Big simplification vs the old plan:** the new screens get their data as props from a
server loader (`lib/data/app-data.ts`). The localStorage store and the "hydrate the store
from the DB" trick are no longer needed.

---

## 10. Who does what, in what order

Phase A runs in parallel because nobody touches the same files.

| Phase | Work | Owner | Files |
|---|---|---|---|
| **A1** | Migration 3, money-flow functions, new seed | Rareș (+Claude) | `supabase/`, `lib/server/`, `scripts/` |
| **A2** | `lifestyle.ts` + Andrei at 34 + tests + `formatRon` | Ana | `lib/rules/`, `data/personas/` |
| **A3** | 3D scene + `/dev/scene` | Rareș (+Claude) | `components/scene/`, `app/dev/` |
| **A4** | Monthly message + PDF extraction (mock first, then Gemini), in English | Sebi | `lib/ai/` |
| **B1** | Data loader + server actions for the app | Rareș | `lib/data/`, `app/app/actions.ts` |
| **B2** | New Home / Month / Profile screens, from props | Razvan | `components/app/` |
| **C** | Onboarding (4 screens) using A4's extraction | Rareș | `app/onboarding/`, `components/onboarding/` |
| **D1** | Landing + `/terms` | Rareș or PM | `app/page.tsx`, `app/terms/`, `components/landing/` |
| **D2** | Cleanup PR (delete list above) + docs + pitch numbers | Rareș + PM | many, last |

**How we avoid conflicts:**
- Interfaces first. Before A starts, we agree on 3 types in `lib/contracts.ts`:
  - `AppData` (what the loader returns to the screens);
  - `LevelState` (Ana's output);
  - `StatementExtract` (Sebi's output).

  Then everyone builds against them, even before the real data exists.
- Razvan's B2 waits for `AppData`, not for B1 to be finished: he can use a mock `AppData`.
- The old screens are deleted only in D2, so nothing breaks while the new ones are built.
- Small PRs, `npm run lint && npm run build && npm test` before each.
- Every agent writes to the AGENTS.md Activity Log (the rule stays).

---

## 11. Demo script (2 minutes)

1. Landing: the hook and the rotating scene. Tap "See the demo".
2. We could also show a fresh onboarding with a fictional PDF: scan → 3 answers →
   **reveal** ("If you retired today, this is how you'd live": tier 2, flat + bike).
3. Andrei's app: "3 years 2 months" at the top, level 10 (380/400 XP), family house + old car.
4. Month tab → "Simulate end of month" → offer "Add 229 RON to your Pillar III" → Yes.
5. **Level-up to 11:** the food slot pops into "Good groceries", "+6 days", XP bar fills.
6. Close on the business model slide: the interest table from section 4 + partner offers
   at milestones.

---

## 12. Open questions

1. Can the user change the amount on the offer ("Another amount")? Recommendation: yes,
   0 to 2× the suggestion.
2. Is the top number total days, or only days added by the app? Recommendation: total,
   with "+X days with zile." below.
3. Which bank do we name as the partner in the pitch, and what interest split do we assume?
4. Does the old 26-year-old Andrei stay as a second persona, or go?
5. The brand `zile.` is a Romanian word. Do we keep it for an English app?
