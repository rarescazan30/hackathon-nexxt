# Plan v2.1 — quality of life (team feedback, 28 Oct 2026)

What this covers: every item from the team feedback list, grouped into phases.
Each item says **what changes**, **where**, and **how it works**.
All decisions are settled (see "Decisions" at the bottom).

**Status (28 Oct 2026, 20:34): all phases built and checked in a production build.** Still open: 0.1 (turn off Confirm email) and 0.2 (a valid Gemini key: the current one is rejected with 401).

Related docs:
- [PDF_READER.md](PDF_READER.md): how the statement reader works
- [BANK_IMPLEMENTATION.md](BANK_IMPLEMENTATION.md): how card round-ups really work, and the demo mock
- [FLOAT_LEGAL.md](FLOAT_LEGAL.md): whether holding the money for a month is realistic
- [TIPS.md](TIPS.md): more data we could read from PDFs

Rules that still apply:
- keep the current theme: purple palette, rounded cards, max width 430px in the app;
- all app text in English;
- fictional data only;
- money in integer bani.

---

## Phase 0 — live demo without a demo account

The jury sees the real flow: register → upload a PDF → reveal → app.

| # | What | Who |
|---|------|-----|
| 0.1 | Turn off **Confirm email** in Supabase (Authentication → Sign In / Providers → Email), or sign-up fails. | Rareș (dashboard) |
| 0.2 | Put a **Gemini key** in `.env.local` (`GEMINI_API_KEY=...`). Without it the PDF reader returns sample values. | Rareș |
| 0.3 | Add a **Pillar III** demo PDF (`data/demo/pillar3-statement-demo.pdf`), fictional, same style as the Pillar II one. | us |
| 0.4 | **Remove "Log in as Andrei" completely:** `components/auth/demo-button.tsx`, the `signInAsDemo` action, its uses on `/` and `/login`. The `DEMO_USER_*` env vars are no longer read by the app. The seed keeps Andrei for tests; you can still log in as him with the normal form. | us |

---

## Phase 1 — quick UI fixes (small, independent)

### 1.1 Buttons pulse on hover
- Add one class to `app/globals.css`, `.pulse-hover`:
  - on `:hover`, a soft scale (1 → 1.03 → 1) and a slightly stronger shadow;
  - 600 ms, looping while the cursor stays.
- Phones have no hover, so the same class gives a short press effect on `:active`.
- Turned off under `prefers-reduced-motion`.
- Added to the shared button classes:
  - `PRIMARY_BUTTON` and `SECONDARY_BUTTON`;
  - landing `PRIMARY` and `SECONDARY`;
  - the offer buttons;
  - `Choice`.

### 1.2 Logo placeholder
- `Logo` in `components/app/shell.tsx` renders `public/logo.svg` (a simple placeholder we ship).
- The real logo later = replace that one file.

### 1.3 Remove the email from the Profile header
- In `profile-screen.tsx`, the `Header` subtitle becomes "Your profile".

### 1.4 Landing page: short, clean first screen
Visible on load:
- **Nav, top right, stacked:** a **Sign up** button (primary pill, → `/register`), with **Log in** under it (text link, → `/login`). These are the only auth buttons on the page.
- Headline: "Want to find out how you'll live in retirement?"
- One short line: *"Upload your pension statement, answer 3 questions, and see your retirement in a minute. Then grow it with your card's round-ups."*
- The island.
- Under the island, a **Find out more** button.

**Find out more** expands (smooth expand + scroll) to show:
- the 3 remaining cards: *Round up as you spend*, *~48%* and *400 €*;
- the big card *Your money, your pension, our model in plain sight*.

Removed:
- the cards *One tap a month*, *Watch your retirement grow* and *65 is the standard age…*;
- the hero buttons;
- the bottom section with *Get started* and *I already have an account*;
- the demo button.

Implementation: `app/page.tsx` stays a server component. The expandable part is a small client component, `components/landing/find-out-more.tsx`, with one `useState(open)`.

### 1.5 Month name on the month-end offer
- `OfferCard` in `month-screen.tsx` gets a label above the message: **"October 2026 · end of month"** (`monthName(jar.month)`).
- `monthlyOfferMessage` gets the month name as a fact, so the text can say "you saved 65 RON in October". The fallback message uses it too.

### 1.6 Clear wording for adding two pensions
- The "I'll type it in" button reads:
  - **Add a pension by hand** when no pension has been added;
  - **Add another pension** once at least one exists.
- A new card picks the pillar that is still missing: if a Pillar II exists, the new card starts as Pillar III.
- A hint goes under the upload box: *"Have both Pillar II and Pillar III? Add them one after the other."*

### 1.7 No zoom on phones
- **Auto-zoom when tapping an input (iPhone):**
  - iOS zooms on inputs with text under 16px, and ours use `text-sm` (14px).
  - Fix: inputs use `text-base` (16px). `INPUT_CLASS` and the offer amount input both change.
- **Pinch zoom:** the `viewport` in `app/layout.tsx` gets `maximumScale: 1, userScalable: false`.

### 1.8 Slightly larger text
- In `globals.css` `@theme`:
  - `--text-xs` goes from 12px to 13px;
  - `--text-sm` goes from 14px to 15px.
- Replace `text-[10px]` and `text-[11px]` with `text-xs`.
- Headings and spacing stay the same, so the layout doesn't look zoomed in.

---

## Phase 2 — numbers and money flow you can trust

### 2.1 Fix the illogical reveal numbers (412 RON/mo, 41161%)
**Cause:** a net salary of ~1 RON was accepted, because the only check was salary > 0.
- *Compared to your life today* = income ÷ salary = 412 ÷ 1 ≈ 41,161%.
- Days of freedom divide savings by a daily gap that is almost 0, so they explode.

**Formulas (for the pitch):**
- *Expected income at 65* adds three parts:
  - the state pension (48% of net salary × contribution years ÷ 35);
  - Pillar II: today's balance plus future contributions of 4.75% of gross, grown at 1.5% a year (real), divided over 180 months;
  - Pillar III, grown and divided the same way.
- *Compared to your life today* = that income ÷ today's net salary.
- *Days of freedom* = private savings ÷ the daily gap between the state pension and a comfortable retirement (65% of salary).

**Fixes:**
- Validation, in both the client (`questionsAreValid`) and the server (`OnboardingInput`, and later `updateProfileData`):
  - net salary from **2,000** to 100,000 RON a month;
  - age from 18 to 64 (birth year from `year − 64` to `year − 18`);
  - years worked ≤ age − 16.
- An error message under the field, e.g. *"Enter your monthly net salary (at least 2,000 RON)."*
- Display caps:
  - a ratio above 150% shows **"more than 150%"**;
  - days above the 15-year horizon show **"15+ years"**.
- **One state-pension model:** days of freedom use the same state-pension estimate as expected income (scaled by contribution years), not a flat 48%.
  - This changes Andrei's days slightly (approved).
  - Update the seed comments, the persona `days` in `data/personas/andrei.json`, and the tests.
- Unit tests for the edge cases: salary at the floor, age 64, 0 years worked, a huge balance.

### 2.2 Settings always work, also after a simulated month
**Cause:**
- After "Yes" or "Not this month", no new month opens until the next *Simulate*, so a settings change recalculates nothing.
- Users who registered themselves get card payments only for their first month.

**Fixes:**
- After an offer is answered (`answerMonthlyOffer`), open the next month right away with `rebuildJar(nextMonth)`.
- In `simulateMonthEnd`, for card-linked users, first import that month's full card payments with `transactionsForMonth` (same data as the seed), then rebuild.
- On the Month tab, add a **Change** link next to *Round-ups* and *Share of your salary* that opens the Profile tab.
- Destination: **Pillar III only**, no pillar choice. Pillar II is filled by the employer through payroll.
  - Make this explicit in the UI: the Profile settings card says *"Goes to your Pillar III"*.

### 2.3 Front-end ↔ back-end audit (result)

| Control | Saved in DB? | Notes |
|---|---|---|
| Onboarding (4 steps) | ✅ at the last step | A refresh mid-way loses the answers (acceptable). |
| PDF upload | ✅ storage + `statement_uploads` | |
| Profile round-up / salary share | ✅ `profiles` + open month | Fixed by 2.2 when no month is open. |
| Simulate end of month | ✅ | New users get no payments after month 1; fixed by 2.2. |
| Yes / Another amount / Not this month | ✅ `monthly_jars` | |
| Level-up "seen" | ✅ `profiles.last_seen_level` | |
| Connect your card | ⚠️ mock | See BANK_IMPLEMENTATION.md. |
| Money to Pillar III | ⚠️ records only | No real money moves. |

After phases 1–3, run one end-to-end check with a fresh account: register → 3 simulated months → change settings → check every row in Supabase.

---

## Phase 3 — update your data from Profile

**When does a user update?**
- Once a year, when the fund sends the yearly statement. We show a reminder 12 months after the last upload.
- When their salary changes.
- When they open a new Pillar III.

**What we add:**
- A new Profile card, **Your details**: net salary, birth year, years worked, and the pensions list, each with **Edit**.
- An **Upload a new statement** button that reuses `uploadStatement` and the check-before-save card. The pension card component moves to `components/pensions/` so onboarding and Profile share it.
- A server action, `updateProfileData` in `app/app/actions.ts`:
  1. validate with the same Zod rules as onboarding;
  2. replace `pension_assets`;
  3. update `profiles`;
  4. rebuild the open month (the salary share depends on the salary);
  5. call `refresh()`.

**Rules:**
- **The level never goes down.**
  - Store the start level in a new column, `profiles.start_level` (migration). Onboarding sets it.
  - On update: `start_level = max(old, new)`.
  - `lifestyleNumbers` reads `start_level` instead of recomputing it.
  - If the level goes up, the level-up overlay plays.
- **Days of freedom always update honestly**, up or down.
- **No double counting.** Money we already sent to Pillar III shows up in the user's next Pillar III statement.
  - zile. contributions count only if they were invested **after** the newest Pillar III statement date.
  - This uses `pension_assets.as_of` and `monthly_jars.invested_at`.

---

## Phase 4 — delight

### 4.1 Days counter flips up to your number
- A client component, `CountUpFreedom`, used on Home and on the reveal step.
- It animates from 0 to `totalDays` in about 1.2 s with ease-out (`requestAnimationFrame`). Each frame shows `formatFreedom(current)`, so days → months → years roll like calendar pages.
- It plays once per visit, not on every tab switch, and is off under `prefers-reduced-motion`.

### 4.2 Spin the island with the mouse or a finger
- In `components/scene/lifestyle-scene.tsx`, a pointer drag left or right adds to the group's `rotation.y`. Horizontal only: no tilt, no zoom.
- While dragging, the idle auto-turn pauses; it resumes 2 s after release, with a little inertia.
- The canvas gets `touch-action: pan-y`, so vertical page scroll still works on phones.
- No extra library.

### 4.3 Share "My retirement island" (public link with preview)

**What the receiver sees:**
- The link opens `/i/<code>`, a page that shows a **pop-up card**:
  - the sender's **island** (live 3D, built from their slots);
  - their **first name** and **level**, e.g. "Andrei · Level 11";
  - **"Start saving for your pension"**, a button to `/register`.
- Nothing else: no days, no money, no surname.
- The page works without logging in.

**Link preview (WhatsApp, LinkedIn):**
- The page has Open Graph tags (`og:title` "Andrei's retirement island · Level 11", plus `og:image`).
- `og:image` is a PNG snapshot of the sender's island, taken in the browser when they press Share.

**How sharing works for the sender:**
- Home gets a **Share my island** button. It:
  1. snapshots the 3D canvas to PNG (the canvas needs `preserveDrawingBuffer: true`);
  2. calls a server action `createShareLink(png)` that uploads the image and stores the snapshot (first name, level, slots);
  3. returns the link.
- On a phone, the system share sheet opens (`navigator.share({ url })`), with WhatsApp and LinkedIn in it.
- On desktop, three buttons: **WhatsApp** (`https://wa.me/?text=<link>`), **LinkedIn** (`https://www.linkedin.com/sharing/share-offsite/?url=<link>`) and **Copy link**.
- Sharing again updates the same link with the current level.

**Data (one migration):**
- A table, `share_links`:
  - `code` (short random id, primary key), `user_id`, `first_name`, `level`, `slots` (jsonb), `image_path`, `updated_at`;
  - one row per user;
  - RLS: the owner can insert or update their row; nobody else reads it directly.
- The public page reads the row with the admin client, server-side, and only those columns.
- Storage: a **public** bucket, `share-images`, so link previews can fetch the image. It holds only the island picture.

---

## Phase 5 — a real-looking bank mock for the demo

Details in [BANK_IMPLEMENTATION.md](BANK_IMPLEMENTATION.md). In short:
- **Connect your card** opens a fake bank consent screen, *Banca Demo*: pick an account, confirm with a 4-digit code.
- The Month tab gets **Pay with card (demo)**: pick a shop and an amount, and the round-up appears at the top immediately.
- **Yes, add it** shows a fake bank confirmation step, like a real payment with SCA.

---

## Phase 6 — admin panel

**Admin account:**
- `.env.local` gets `ADMIN_EMAIL` and `ADMIN_PASSWORD`; `.env.example` gets the same names without values.
- `npm run seed` creates or updates that user in Supabase Auth, with a finished, minimal profile so it can open `/app`.

**Access:**
- One helper, `isAdmin(user)` in `lib/server/admin.ts`: the session email equals `ADMIN_EMAIL`.
- When the admin is logged in, an **Admin** button appears in the app (Profile tab and the Home header). It leads to `/admin`.
- `/admin` checks `isAdmin` on the server. Anyone else gets a 404.
- `proxy.ts` protects `/admin` like `/app`: logged-out users go to `/login`.

**What `/admin` shows**, read-only, totals only, no names:
- users: registered, finished onboarding, card linked;
- money held right now (accepted or collected jars not yet invested);
- interest earned: this month, in total, and per month (sum of `monthly_jars.float_interest_bani`);
- the average monthly contribution and the offer acceptance rate;
- a **projection slider**, "if we had N users": N × average contribution × 5% ÷ 12, shown per month and per year.

---

## Order and size

| Phase | Size | Notes |
|---|---|---|
| 0 Blockers | S | Rareș: Supabase setting + Gemini key |
| 1 Quick UI | M | |
| 2 Numbers + flow | M | |
| 3 Profile update | M | after 2 (shares validation) |
| 4 Delight | M–L | 4.3 needs a migration and a public bucket |
| 5 Bank mock | M | after 2.2 |
| 6 Admin | S–M | |

Each phase ends with lint, tests, build and a click-through in the browser.

---

## Decisions (28 Oct 2026)

| # | Question | Decision |
|---|---|---|
| Q1 | Demo button | Remove it completely. |
| Q2 | Sign-up on the landing page | **Sign up** button above **Log in**, top right. |
| Q3 | Salary floor | 2,000 RON net a month. |
| Q4 | Pillar choice | No choice: money goes to Pillar III. |
| Q5 | Level after a new statement | Never goes down. |
| Q6 | Share | Public link with a preview image; a pop-up with the island, first name, level and a "Start saving for your pension" button. |
| Q7 | Admin access | Admin account from `.env.local`; when logged in, an **Admin** button leads to `/admin`. |
| Q8 | Andrei's days change slightly | OK. |
