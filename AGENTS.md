# AGENTS.md: Hackathon nexxt (Stripe challenge)

Read this first. It is the shared context for every AI coding agent (Claude Code, Cursor, Codex…) and every human on the team.

WHILE YOU UPDATE THIS PROJECT, UPDATE THIS FILE AS WELL.

## The challenge

**"Rethinking Financial Futures"** (Stripe, nexxt hackathon):
*How can we make navigating the financial future a more accessible, relevant and empowering experience for people in Romania?*

The judges want us to demonstrate:

1. Who the product serves and which problem it solves

2. How the core experience works from end to end

3. Why the solution is relevant **in Romania**

4. Which assumptions, data sources, regulatory considerations and limitations apply



Every feature must serve at least one of these four points. If it doesn't, don't build it.

## Current direction: zile. (plan v2)

**"Want to find out how you'll live in retirement? Our app shows you."** For people in
Romania aged 30–40. Onboarding reads a pension statement and 3 answers, then shows a
low-poly 3D scene of how they'd live if they retired today. Card payments are rounded up;
once a month the user adds that money to their **Pillar III** pension with one tap.
Contributions add **days of freedom** (top of the screen) and **XP**, which levels up the
scene. Business model: interest on the confirmed money held for one month by a licensed
banking partner. **All app text is in English.** Full plan: `docs/plan.md`.

## Stack

| Layer | Choice |
| --- | --- |
| App | Next.js 16 (App Router) + TypeScript, frontend and backend in one project |
| UI | Tailwind CSS + shadcn/ui, mobile-first, **English** |
| 3D | three.js + @react-three/fiber, low-poly models built from primitives in code |
| AI | Gemini (free tier) with Groq as fallback and a mock mode, plain fetch in `lib/ai/model.ts` |
| Database + auth + files | Supabase (Postgres, Auth, Storage) |
| Payments | Stripe **test mode only** (planned for the monthly collection) |
| Bank data | Mock bank sync in `lib/server/mock-bank.ts` |
| Validation | Zod, with shared schemas in `lib/contracts.ts` |
| Deploy | Vercel |

Pin library versions. Next.js, the AI SDK and Zod have all changed APIs between major versions: check the installed version and its docs before writing code.

## Golden rules

1. **Every number comes from deterministic code, never from the LLM.** The AI explains, categorizes and extracts. Money math lives in `lib/rules/` and is tested.
2. **Every factual claim shown to the user has a source** (ANAF, ASF, BNR, INS, BVB…).
3. **Education, not investment advice.** The user chooses; we show scenarios. No "buy product X" recommendations.
4. **Money is stored as integers in bani** (5000 = 50.00 lei). Never floats.
5. **Mock data only.** No real personal or bank data, ever, especially not in prompts sent to free AI tiers.
6. **Secrets never go in git.** Use `.env.local`; keep `.env.example` up to date.
7. **Stay in your folder.** Each folder has an owner and its own `AGENTS.md`. Don't edit another area without asking its owner.
8. **`lib/contracts.ts` is the team contract.** Changing it needs a heads-up to everyone and approval from two people.

## Repo map

```
app/                 pages: / (landing), /login, /register, /onboarding, /app, /terms, /dev/scene
app/app/actions.ts   /app buttons: simulate month end, answer offer, settings, level seen
components/app/      Home / Month / Profile screens, shell, level-up overlay
components/scene/    low-poly three.js retirement scene (+ 2D fallback)
components/onboarding/, components/landing/, components/auth/
lib/contracts.ts     shared Zod schemas (the team contract)
lib/rules/           deterministic money math (incl. lifestyle levels, interest)
lib/data/            AppData loader + lifestyle numbers from DB rows
lib/server/          jar builder, money flow, mock bank
lib/ai/              monthly message + statement reader (gemini | groq | mock)
lib/supabase/        Supabase clients + generated types
supabase/migrations/ schema; scripts/seed.ts demo data (npm run seed)
docs/                plan (v2), architecture, decisions, judging
```

## Current state of the code

Plan v2 is implemented end to end on branch `new_app`: auth + demo login, onboarding with
PDF reading, the 3-tab app with the 3D scene and level-ups, the month-end offer and money
flow, landing page and terms. The demo user is created with `npm run seed`.

## How we work

- Branch from `main`: `feat/<area>-<short-name>` (e.g. `feat/rules-roundup`).
- Small PRs (under ~300 lines), one feature each. Someone else reviews and merges.
- Before opening a PR: `npm run lint` and `npm run build` pass.
- Big decisions go in `docs/decisions.md` (one short entry each).
- When an agent finishes a task, it says what it changed, what it didn't verify, and
  which files it touched.
- **AI Agent Logging Rule:** Every AI agent working on this repo MUST record under
  the `## Agent Activity Log` section in this file what was done, the exact date and
  time, and all files created or modified.

## Work areas (plan v2)

| Area | Folder | Notes |
|---|---|---|
| Money math | `lib/rules/` | pure, tested; owner Ana |
| AI | `lib/ai/` | message + statement reader; owner Sebi |
| Screens | `components/app/`, `components/scene/` | props from `AppData` only |
| Data, DB, auth, onboarding | `lib/data/`, `lib/server/`, `supabase/`, `app/onboarding/` | owner Rareș |

## Agent Activity Log

- **2026-10-28 18:23:** Plan v2 phases A4–D2 (`docs/plan.md`), branch `new_app`, after merging `origin/main`. **A4:** replaced the chat agent with `lib/ai/model.ts` (`callModel`, gemini/groq/mock), `monthly-message.ts` and `extract-statement.ts` (PDF → `StatementExtract`, added to `lib/contracts.ts`; labelled sample values on mock); tests in `lib/ai/__tests__/ai.test.ts`. **B1:** `lib/data/lifestyle-state.ts` (DB rows → days, tier, XP, level) and `lib/data/app-data.ts` (`AppData` loader); `app/app/actions.ts` (simulate month end, answer offer + collect, settings, level seen). **B2:** new Home / Month / Profile screens, 3-tab nav, level-up overlay, `ThemeSync` (dark mode follows the system). **C:** `/onboarding` (statement upload to the private bucket + AI reading, 3 questions, reveal, piggy bank + terms + simulated card that imports this month's mock transactions); register now goes to onboarding. **D1:** landing page with the rotating scene and sourced facts, `/terms`. **D2:** deleted the old screens, `data/mock/ui.ts`, the chat agent and `/api/chat`, `docs/plan-task4.md`; rewrote README, idea, architecture, folder AGENTS.md files; decisions logged; mock bank moved to `lib/server/mock-bank.ts`; fictional demo PDF in `data/demo/`. Verified in a production build: landing, demo login, Home with real data, Simulate end of month → offer → Yes → level-up to 11, Month history, Profile; onboarding with a PDF upload and without one (test account deleted afterwards); lint, 26 tests, build. Not verified: real Gemini calls (no AI key in `.env.local`), sign-up through `/register` (Supabase "Confirm email" is still on).
- **2026-10-28 14:27:** Completed Task 2: AI Assistant & Tool Calling (`lib/ai/`, `app/api/chat/`, `components/app/agent-screen.tsx`). Implemented deterministic-first AI agent calling `lib/rules/` tools (`update_roundup_rule`, `calculate_projection`, `change_risk_allocation`, `explain_number`, `search_knowledge`) with Google AI Studio Gemini / Groq / mock fallback, live round-up rule updates visible in UI, and unit tests in `lib/ai/__tests__/agent.test.ts`. Files created: `lib/ai/prompt.ts`, `lib/ai/tools.ts`, `lib/ai/model.ts`, `lib/ai/agent.ts`, `lib/ai/state-sync.ts`, `lib/ai/index.ts`, `lib/ai/__tests__/agent.test.ts`, `app/api/chat/route.ts`. Files modified: `components/app/agent-screen.tsx`, `package.json`, `AGENTS.md`.
- **2026-10-28 14:00:** Implemented total-sum-to-be-paid selection in `lib/rules/roundup.ts`: allows clients to choose between total payment amounts (original sum + 10%/20%/30% rounded to integer Lei) or specify `chosenTotalBani`, with helper `getPaymentRoundUpOptions` and `calculatePaymentTotal`. Added unit tests in `lib/rules/__tests__/rules.test.ts` and updated `task1.md`.
- **2026-10-28 13:46:** Added client-selectable percentage round-up (10%, 20%, 30%) rounded to integer lei/bani in `lib/rules/roundup.ts`. Added comprehensive test coverage in `lib/rules/__tests__/rules.test.ts` and updated `task1.md`.
- **2026-10-28 13:33:** Completed Task 1: Core Financial Math Engine (`lib/rules/`). Implemented deterministic money math in integer bani (zero floats) with Romanian pension/financial assumptions: `roundUp`, `calculatePsd2RoundUp`, `jarTotal`, `allocate` (exact integer conservation across Pillar 3 / ETF BET / Gov bonds), compound projection bands `project` / `projectRange` / `generateProjectionTimeline` (pessimistic / base / optimistic), and `daysOfFreedom` / `calculateRetirementGap` matching Andrei's 326 days [290, 370]. Added Romanian personas (`andrei`, `elena`, `radu`) and unit tests in `lib/rules/__tests__/`. Files created: `lib/rules/config.ts`, `lib/rules/roundup.ts`, `lib/rules/allocation.ts`, `lib/rules/projection.ts`, `lib/rules/freedom.ts`, `lib/rules/index.ts`, `lib/rules/__tests__/rules.test.ts`, `lib/rules/__tests__/personas.test.ts`, `data/personas/andrei.json`, `data/personas/elena.json`, `data/personas/radu.json`. Files modified: `package.json`, `AGENTS.md`.
- **2026-10-28 13:15:** Added 4 disjoint tasks roadmap and AI logging rule to AGENTS.md. Files modified: `AGENTS.md`.
- **2026-10-28 13:53:** Completed Task 3 (Dynamic Projections & Visualizations, CSS theme tokens, `ro-RO` formatting, `"Zile de libertate financiară dobândite"` & `"Money saved this month"` copy, transaction exclusion in monthly history, and shared reactive state across Home, Progress, and Profile settings including adjustable round-up steps/multipliers and salary percentage). Files modified: `app/globals.css`, `components/app/home-screen.tsx`, `components/app/progress-screen.tsx`, `components/app/profile-screen.tsx`, `AGENTS.md`.
- **2026-10-28 14:04:** Replaced warm beige/peach/copper palette with cohesive indigo-lavender (`#eeebfa` light / `#262038` dark), sky-cyan (`#38bdf8` / `#0ea5e9`), and mint-teal (`#bfe8d1`) tokens across light and dark themes. Files modified: `app/globals.css`, `components/app/home-screen.tsx`, `AGENTS.md`.
- **2026-10-28 14:12:** Updated `HomeAgentInvite` card and `PiggyBank` / `Wallet` badges with explicit violet-indigo light/dark surfaces (`#ede9fe`–`#ddd6fe` / `#2a2244`–`#1d1730`), and integrated realistic Romanian annual returns & interest rates (`ROMANIAN_INSTRUMENTS`: Fidelis/Tezaur 6,8%, Pilonul 3 7,9% ASF, Pilonul 2 8,1% ASF, ETF BET BVB 13,4%, Depozite RON 5,4% BNR, Inflație 4,0% BNR/INS) across `home-screen.tsx`, `progress-screen.tsx`, and `profile-screen.tsx`. Files modified: `components/app/home-screen.tsx`, `components/app/progress-screen.tsx`, `components/app/profile-screen.tsx`, `AGENTS.md`.
- **2026-10-28 15:02:** Replaced custom `@theme inline` utility classes (`!bg-brand-deep`, `bg-brand-soft`, etc.) with explicit Tailwind hex classes (`!bg-[#33256c]`, `bg-[#f1effa]`, etc.) across `home-screen.tsx`, `progress-screen.tsx`, and `profile-screen.tsx` so `DaysHero` and all cards render their dark/light purple backgrounds reliably even after git branch switches. Files modified: `components/app/home-screen.tsx`, `components/app/progress-screen.tsx`, `components/app/profile-screen.tsx`, `AGENTS.md`.
- **2026-10-28 17:57:** Plan v2 phases A1–A3 (`docs/plan.md`), branch `new_app`. **A2:** `lib/rules/lifestyle.ts` (projected retirement income → replacement ratio → starting tier, XP from contributions, 20 levels × 4 slots, `formatFreedom`, `formatRon`) and `lib/rules/float.ts` (interest on the one-month hold); Andrei persona is now 34 (6,500 RON net, 12 years worked, 42,000 RON Pillar II); 9 new tests. **A1:** migration `20261028210000_lifestyle_app.sql` applied to Supabase (net salary, no risk profile, `last_seen_level`, `terms_accepted_at`, jar statuses offered/accepted/declined/collected/invested, interest + invest date on jars, `agent_proposals` dropped, `statement_uploads` table + private `statements` bucket with per-user folders); regenerated DB types; `lib/server/money-flow.ts` (offer → answer → collect → invest); new seed (Andrei: 4 jars invested, 1 held, October open; level 10, 380/400 XP). **A3:** low-poly three.js scene in `components/scene/` (island + 4 slots × 5 tiers, pop + sparkles on level-up, 2D fallback, pauses off-screen, reduced motion) and `/dev/scene` playground (hidden in production unless `ENABLE_DEV_PAGES=1`). New deps: `three`, `@react-three/fiber`, `@types/three`. Verified: migration on a local Postgres copy (RLS + storage folders), seed twice, lint/test/build, scene at levels 1/8/14/20 in a production build. Files created: `lib/rules/{lifestyle,float}.ts`, `lib/rules/__tests__/lifestyle.test.ts`, `supabase/migrations/20261028210000_lifestyle_app.sql`, `lib/server/{money-flow,unwrap}.ts`, `components/scene/**`, `app/dev/scene/*`. Files modified: `lib/rules/index.ts`, `data/personas/andrei.json`, `lib/server/jar.ts`, `lib/supabase/database.types.ts`, `scripts/{seed,seed-data}.ts`, `package.json`, `package-lock.json`, `docs/plan.md`, `AGENTS.md`.
- **2026-10-28 16:33:** Task 4, steps 1–2 (`docs/plan-task4.md`). Supabase clients (server with cookies, browser, admin with secret key) and `proxy.ts` that refreshes the session and sends logged-out users from `/app` and `/onboarding` to `/login`. Generated DB types. Jar builder `rebuildJar()` (transactions → round-ups → monthly jar, math from `lib/rules`). `npm run seed`: products, prices, and demo user Andrei with 6 months of data; safe to rerun. Verified: seed twice gives the same rows, persona round-ups 270/360/0 bani, RLS hides data from logged-out users, lint/test/build pass. Files created: `lib/supabase/{server,client,admin,database.types}.ts`, `proxy.ts`, `lib/server/jar.ts`, `scripts/seed.ts`, `scripts/seed-data.ts`. Files modified: `package.json`, `.env.example`, `AGENTS.md`.
- **2026-10-28 17:41:** New direction written up in `docs/plan.md` (plan v2: retirement lifestyle scene, days + XP levels, Pillar III only, one-month float interest as business model, all app text in English); `docs/plan-task4.md` marked superseded. Switched the login, register, temporary home page, auth errors and root metadata to English (`lang="en"`). Updated the language rules in `app/AGENTS.md` and `lib/ai/AGENTS.md`. Files modified: `docs/plan.md` (new), `docs/plan-task4.md`, `app/page.tsx`, `app/layout.tsx`, `app/app/page.tsx`, `app/login/page.tsx`, `app/register/page.tsx`, `app/auth/actions.ts`, `app/auth/signout/route.ts`, `components/auth/*.tsx`, `app/AGENTS.md`, `lib/ai/AGENTS.md`, `AGENTS.md`.
- **2026-10-28 16:38:** Task 4, step 3 (`docs/plan-task4.md`). The app moved from `/` to `/app` (`app/page.tsx` renamed to `components/app/app-shell.tsx`, screens unchanged). Login and register pages styled like the app, server actions for sign-in, sign-up and the "Intră ca Andrei (demo)" button (demo password stays on the server), `/auth/signout`, temporary home page with the same buttons until the landing page. Verified in the browser: logged-out `/app` → `/login`, wrong password shows an error, demo button → `/app`, logged-in `/login` → `/app`, sign-out → `/login`. Not verified: register end to end, because "Confirm email" is still on in Supabase (rate limit). Files created: `app/app/page.tsx`, `app/login/page.tsx`, `app/register/page.tsx`, `app/auth/actions.ts`, `app/auth/signout/route.ts`, `components/auth/{auth-layout,form-parts,login-form,register-form,demo-button}.tsx`. Files modified: `app/page.tsx` (now the temporary home page), `components/app/app-shell.tsx` (moved from `app/page.tsx`), `AGENTS.md`.
- **2026-10-28 18:50:** Added pre-hydration script in `app/layout.tsx` and `suppressHydrationWarning` on `<html>` and `<body>` to strip Bitdefender browser extension attributes (`bis_skin_checked`, `bis_register`, `__processed_*`) before React hydration on branch `Razvan`. Files modified: `app/layout.tsx`, `AGENTS.md`.
* Branch from `main`: `feat/<area>-<short-name>` (e.g. `feat/rules-roundup`).
* Small PRs (under ~300 lines), one feature each. Someone else reviews and merges.
* Before opening a PR: `npm run lint` and `npm run build` pass.
* Big decisions go in `docs/decisions.md` (one short entry each).
* When an agent finishes a task, it says what it changed, what it didn't verify, and which files it touched.

## Commands

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint
npm run build

```

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
