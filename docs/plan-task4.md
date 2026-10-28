# Task 4 plan: auth, data, onboarding, statements, landing

Owner: Rareș. Status: **superseded by `docs/plan.md`** (steps 1–3 were built; the rest is replaced).

## Goal

A judge can open the site, read the landing page, tap **"Intră ca Andrei (demo)"** and
see the app filled with real rows from Supabase. A new user can register, go through
onboarding (upload statements + a short AI-assisted interview) and land in the same app
with their own data.

## Where we are today

- Supabase: both migrations applied (`init`, `align_with_rules_and_ui`). Tables are empty.
- `.env` has the 3 Supabase variables. No app code talks to Supabase yet.
- The app is one client page (`app/page.tsx`). All data comes from `data/mock/ui.ts`
  and the store in `components/app/home-screen.tsx` (saved in `localStorage`).
- `lib/rules/` (Ana) has all the money math. Razvan's screens still use their own math.

## Order

| # | Step | Branch | Size | Touches teammates' files? |
|---|------|--------|------|---------------------------|
| 0 | Housekeeping | `feat/db-rules-align` | S | no |
| 1 | Supabase clients + route protection | `feat/auth-supabase` | S | no |
| 2 | Seed data + jar builder | `feat/db-seed` | M | no |
| 3 | Login, register, demo button, app moves to `/app` | `feat/auth-pages` | M | `app/page.tsx` (moved) |
| 4 | Screens read from the DB | `feat/app-data` | M | `home-screen.tsx` (small, with Razvan) |
| 5 | Onboarding (statements + AI interview + settings) | `feat/onboarding` | L | no |
| 6 | Landing page | `feat/landing` | M | `app/page.tsx` (replaced) |
| 7 | Hand-off docs | `docs/task4-handoff` | S | `AGENTS.md` (log only) |

Why this order: by the end of step 4 we have a working demo end to end. The risky part
(PDF + AI) comes after that, so if time runs out, the demo still works. The landing page
is independent and can be handed to a teammate at any point.

---

## Step 0: Housekeeping

- Open the PR for `feat/db-rules-align` and merge it.
- Discard the stray `package-lock.json` change (`git restore package-lock.json`).
- Rename `.env` → `.env.local` (matches the docs).
- Restore the missing variables in `.env.example`, plus the new ones:
  `AI_PROVIDER`, `GOOGLE_GENERATIVE_AI_API_KEY`, `GROQ_API_KEY`, `STRIPE_SECRET_KEY`,
  `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `CRON_SECRET`,
  `DEMO_USER_EMAIL`, `DEMO_USER_PASSWORD`.
- Ask the team: delete the 16 duplicate `* 2.*` files.

**Done when:** main has both migrations, `git status` is clean.

## Step 1: Supabase clients + route protection

New files only:

```
lib/supabase/server.ts   createClient() for server components and actions (cookies)
lib/supabase/client.ts   createClient() for the browser (publishable key)
lib/supabase/admin.ts    admin client with SUPABASE_SECRET_KEY; server-only, never imported by UI
proxy.ts                 refreshes the session; protects /app and /onboarding
```

Proxy rules:

- `/app`, `/onboarding`: not logged in → `/login`.
- `/login`, `/register`: already logged in → `/app`.
- `/app`: logged in but `onboarding_completed = false` → `/onboarding`.
  (The profile check is done in the `/app` page, not in the proxy, so the proxy stays fast.)

Next 16 notes: `proxy.ts` replaces `middleware.ts`. With `cacheComponents: true`, anything
that reads cookies must render inside `<Suspense>`, or the build fails. Read
`node_modules/next/dist/docs` before writing these.

**Done when:** opening `/app` while logged out redirects to `/login`.

## Step 2: Seed data + jar builder

The jar builder is the missing server step: transactions → round-ups → monthly jar.
It uses Ana's functions, so the numbers in the DB match the tests.

```
lib/server/jar.ts      rebuildJar(userId, month): reads card payments + profile rule,
                       calls calculatePsd2RoundUp / jarTotal, upserts roundups + monthly_jars
scripts/seed.ts        run with `npm run seed`; safe to run again (it resets Andrei)
```

What `npm run seed` writes:

- `products`: `pillar3`, `etfBet`, `govBonds` (same names and descriptions as Ana's
  `PRODUCT_CATALOG`).
- `product_prices`: 6 months of monthly prices per product (static snapshot, source noted).
- Demo user Andrei, created via the admin API with `DEMO_USER_EMAIL` / `DEMO_USER_PASSWORD`.
  - Profile from `data/personas/andrei.json`: born 2000, salary 4.500 lei, 3 years worked,
    risk `medium`, round-up 5 lei ×1, 3% of salary, cap 300 lei, `onboarding_completed = true`.
  - `pension_assets`: Pillar II 8.200 lei (`source = 'manual'`).
  - `transactions`: 6 months of realistic Romanian payments (fixed list, not random).
  - Then `rebuildJar` for each month → `roundups`, `monthly_jars`.
  - Past months: jar `collected`, an accepted `agent_proposals` row, and `orders` split
    with `allocate()`.
  - Current month: jar `open`.

**Done when:** `npm run seed` twice in a row gives the same rows, and Andrei's numbers match
`data/personas/andrei.json`.

## Step 3: Login, register, demo button, `/app`

Routes and files:

```
app/login/page.tsx            email + password, "Intră ca Andrei (demo)", link to register
app/register/page.tsx         name, email, password → /onboarding
app/auth/actions.ts           server actions: signIn, signUp, signInAsDemo, signOut
app/app/page.tsx              the current app page, moved here (route /app)
components/app/app-shell.tsx  the client part of today's app/page.tsx (tabs + bottom nav)
components/auth/auth-card.tsx shared layout for both forms
```

- Email confirmation is OFF in Supabase, so register logs you in right away.
- The demo button calls `signInAsDemo()` on the server. The demo password lives only in
  `.env.local`; it never reaches the browser.
- `full_name` is sent at sign-up as user metadata, so the trigger fills `profiles.full_name`.
- Errors are shown in Romanian under the form ("Email sau parolă greșită").
- Logout: a "Ieși din cont" row at the bottom of the Profil screen. **This is Razvan's
  file.** Either he adds the row, or we wait and put it in step 4's PR with him.

**Moving the app is the one step that conflicts with others.** Before it:
tell the team in chat, merge it fast (small PR, nothing else in it), and everyone pulls.

**Done when:** register → onboarding, login → `/app`, demo button → `/app` as Andrei,
logout → `/login`.

## Step 4: Screens read from the DB

The screens keep their look and their store. We only change **where the store's starting
values come from**: the DB instead of `data/mock/ui.ts`.

```
lib/data/app-data.ts                loads profile, assets, jars, roundups, orders for the
                                    logged-in user (RLS does the filtering)
lib/data/to-app-state.ts            maps DB rows → the store's shape (bani, months, labels)
components/app/app-data-bridge.tsx  puts the loaded values into the store once, on mount
app/app/actions.ts                  saveSettings(): writes round-up, multiplier, salary %,
                                    risk back to profiles
```

Small change in `home-screen.tsx`, agreed with Razvan first (≈20 lines):

- Export `hydrateAppState(partial)`, so DB values win over old `localStorage` values.
- The fields read from `user` and `initialHistory` (`roundUps`, `days`, `pillarTwo`,
  monthly history) move into the store, so they can come from the DB.
- `localStorage` keeps only UI choices (dark mode, open sections).

Saving settings: the Profil screen keeps calling `updateAppState`. The bridge watches the
store and calls `saveSettings()` when a DB field changes (debounced, ~500 ms). So the
**Profil screen itself doesn't change**.

What stays mock for now:

- `excludedMonths`: no DB field yet. We'll decide if it's needed.
- Razvan's math (`RISK_CONFIG`, `useDerivedFinancials`): moving it to `lib/rules` is a
  separate Task 3 change, not part of this plan.

**Done when:** change a value in Supabase → reload `/app` → the screen shows the new value.
Change round-up in Profil → the row in Supabase changes.

## Step 5: Onboarding

One flow at `/onboarding`, mobile, one question per screen, progress bar on top.
Statements and the AI interview are merged: **first we read what we can from documents,
then the AI asks only what's still missing.**

| Screen | What happens | Saves to |
|---|---|---|
| 1. Bun venit | "3 minute și știi câte zile de libertate ai." | — |
| 2. Documentele tale (optional) | Drop PDFs: Pillar II statement, Pillar III statement. "Sari peste" is always visible. | `statement_uploads`, then `pension_assets` |
| 3. Verifică | Shows what was read ("NN Pilonul II · 8.200 lei · 31.08.2026"). The user edits or confirms each card. | `pension_assets` (`source = 'statement_upload'`) |
| 4. Interviul | Chat-style. Asks only what's missing: birth year, salary, years worked, then 5 risk questions. Each has tap-able answers, plus free text. | `profiles`, `risk_answers` |
| 5. Profilul tău | "Profil echilibrat", with 2 lines explaining why. The user can pick another level. | `profiles.risk_level` |
| 6. Pușculița | Round-up 0/1/5/10 lei, ×1/×2/×3, % of salary, monthly cap. Live example: "Cafea 12,30 → +2,70 lei". | `profiles` |
| 7. Card | "Conectează cardul" (simulated; Stripe test mode belongs to the backend task). | `card_linked` |
| 8. Gata | Shows the first days-of-freedom number, then "Intră în aplicație". | `onboarding_completed = true` |

### Where the AI helps, and where it doesn't

- **The AI does:** read the statements; understand free-text answers ("câștig cam 5 mii
  net" → salary); write the friendly 2-line explanation on screen 5.
- **The AI does not:** pick the risk level or calculate anything. The risk level comes
  from a fixed function, `riskFromAnswers(answers)`, which is easy to explain and defend
  (suitability).
- Free text is turned into the same answer options the buttons give (Zod schema with
  `generateObject`). If the AI fails or `AI_PROVIDER=mock`, the buttons still work.

### Statements: how PDF data gets into the DB

```
browser ──PDF──▶ server action uploadStatement()
                   1. save file to Storage bucket "statements" (private, path userId/…)
                   2. insert statement_uploads row, status "uploaded"
                   3. extract text (unpdf)
                   4. AI → JSON checked by Zod (StatementExtract)
                   5. save JSON in statement_uploads.extracted, status "extracted"
user confirms on screen 3 ──▶ insert pension_assets rows, status "confirmed"
```

- `StatementExtract` (in `lib/contracts.ts`): `kind` (pillar2 | pillar3), `provider`,
  `balanceBani`, `units`, `asOf`. All money is turned into bani by code, not by the AI.
- Nothing reaches `pension_assets` without the user confirming it.
- **Demo only with fictional PDFs** (we make 2: Pillar II and Pillar III for Andrei).
  Free Gemini may use prompts for training.
- If text extraction gives nothing (a scanned PDF): show "Nu am putut citi documentul,
  completează manual" with the form already open.
- Bank statements (→ `transactions`) are a stretch goal. The demo uses seeded transactions.

### New DB pieces (migration 3)

- Table `statement_uploads`: `id`, `user_id`, `file_path`, `kind`, `status`
  (uploaded / extracted / confirmed / failed), `extracted jsonb`, `error`, `created_at`.
  RLS: the user reads and inserts their own rows.
- Storage bucket `statements`, private. Policy: a user only reaches files under their own
  `userId/` folder.

New files:

```
app/onboarding/page.tsx, app/onboarding/actions.ts
components/onboarding/*        one file per screen + progress bar
lib/rules/risk.ts              riskFromAnswers(), tell Ana (new file, no conflict)
lib/ai/extract-statement.ts    AI part of the extraction (coordinate with the AI owner)
lib/ai/parse-answer.ts         free text → answer option
```

**Done when:** a new account goes through all 8 screens with the mock AI, the rows are in
Supabase, and `/app` shows that user's numbers. Same again with Gemini and the demo PDFs.

## Step 6: Landing page

`app/page.tsx` becomes the landing page. Sections:

1. **Hero**: "Pași mici azi. Mai multă libertate mâine." + a phone mock of the home screen
   + "Începe gratuit" and "Vezi demo" (→ demo login).
2. **Cum funcționează**: 3 steps: rotunjiri + % din salariu → agentul propune → tu confirmi.
3. **De ce în România**: 3 numbers with their sources (pension replacement rate, savings
   rate, investing participation). Each number has a small source link. No number
   without a source.
4. **Siguranță**: money goes from your bank straight to ASF-authorized partners; we never
   hold it. Education, not investment advice.
5. **Toate pensiile într-un loc**: state estimate + Pillar II + Pillar III.
6. **Final CTA** + footer.

Responsive: one column on phones; on desktop, hero text left and phone mock right.
`components/landing/*`, one file per section.

## Design rules (all new screens)

Goal: the new pages look like they were always part of the app.

- **Reuse what exists:** `Logo`, `Card`, `Header` from `components/app/shell.tsx`;
  `Button` from `components/ui`. New shadcn pieces (input, label, progress) via
  `npx shadcn add`; check that this doesn't rewrite `globals.css`.
- **Colors: use the tokens from `globals.css`, not raw hex**, in new code:
  `bg-brand-deep` (main buttons, logo), `text-brand-lavender` (small uppercase labels),
  `bg-brand-soft` / `bg-brand-tint` (chips, selected options), `mint-*` (growth, success),
  `text-ink-muted` (secondary text), `border-line-dashed`.
- **Same shapes:** cards `rounded-[24px]`, soft purple shadow, chips `rounded-full`.
  The page background is the same as the app (`#f7f6f9`, dark `#18151f`).
- **Same type:** small uppercase label with wide tracking above a semibold title with
  tight tracking (like `Header`).
- **Same layout:** app pages (login, register, onboarding) in the `max-w-[430px]` column,
  `px-5`. Only the landing page goes wider.
- **Dark mode works everywhere.** Pages outside the app follow the system setting.
- **Romanian copy, short.** Money formatted with the existing `formatBaniAsLei`.
- Icons from `lucide-react` only. Real `<button>` and `<label>`, visible focus.

## How we avoid conflicts

- **New files over edits.** Every step except 3, 4 and 6 only adds files.
- **Three edits touch shared files.** Each is announced in the team chat and goes in a
  small PR of its own:
  - Step 3 moves `app/page.tsx`.
  - Step 4 changes `home-screen.tsx`, with Razvan.
  - Step 6 replaces `app/page.tsx`.
- **Don't reformat existing files.** `shell.tsx` and the other screens use one-line
  components; editors that auto-format would rewrite the whole file. Turn format-on-save
  off for those files.
- **`globals.css`:** no edits unless a token is missing; then add it at the end of
  both the light and dark blocks, in its own commit.
- Before each PR: `git pull origin main`, `npm run lint`, `npm run build`, `npm test`.
- Each PR description says which shared files it touches.

## Step 7: Hand-off

- `docs/setup.md`: env vars, `npx supabase link`, `npm run seed`, demo login.
- Update `app/AGENTS.md` and `app/api/AGENTS.md` with the real routes.
- Add an `Agent Activity Log` entry in `AGENTS.md` for every step (date, what, files).
- Add a decision to `docs/decisions.md`: "Supabase for auth + data; the risk level comes
  from rules, not the AI."

## Open questions

1. Is the route `/app` OK, or do we prefer `/acasa`?
2. Do we keep "exclude a month" (`excludedMonths`)? It needs a DB field if we keep it.
3. Who makes the landing page: me, or a teammate in parallel?
4. Are the 5 risk questions written by us, or do we take them from a standard
   suitability questionnaire (more credible with judges)?
5. Bank statements (→ transactions): in scope or stretch?
