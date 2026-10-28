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

## Current direction (All-in-One Smart Saving & Investing)

A mobile-first fintech ecosystem designed to democratize access to investments and financial consulting for people in Romania without large monthly budgets.

**The Problem:**
Targeting primarily 18-40 year-olds, the app addresses the lack of financial education, Romanian legislative instability, and the high costs/friction of traditional investing (which normally requires manual saving, paying human advisors, and handling broker commissions).

**The Solution (3 Pillars):**

1. **Automated Saving (Round-up):** Every card payment is automatically rounded up, and the difference is moved to a savings account. This generates an investment budget inconspicuously, removing the pressure of cutting a fixed sum from the main monthly budget.

2. **Personalized AI Advisor:** At the end of the month (once salaries and round-ups accumulate), an AI Agent interacts with the user to suggest personalized investment schemes based on risk and profitability:
* *Low Risk:* Government bonds (Titluri de stat), FX.
* *Medium Risk:* Mutual funds, ETFs.
* *High Risk:* Stocks on the Bucharest Stock Exchange (BVB).

3. **Visual Tool & Pension Projection:** A visual dashboard works in tandem with the AI. It shows real-time portfolio progress and a detailed projection of how much their pension has improved. It offers flexibility: the user can manually delete (remove) transactions from the graph if they didn't complete the investment promised to the AI, ensuring a 100% realistic portfolio representation.

**Competitive Advantage:**
Unlike traditional banks that only offer basic round-up, this app handles the entire funnel: collecting funds, free AI consulting, executing investments, and advanced graphical tracking, completely removing expensive intermediaries.

## Stack

| Layer | Choice |
| --- | --- |
| App | Next.js (App Router) + TypeScript, frontend and backend in one project |
| UI | Tailwind CSS + shadcn/ui, mobile-first, RO/EN |
| AI | Vercel AI SDK, Gemini (free tier) with Groq as fallback, behind `lib/ai/` |
| Database + RAG | Supabase (Postgres + pgvector) |
| Payments | Stripe **test mode only** (saved card + automatic monthly charge) |
| Bank data | Mock NextGenPSD2 JSON in `data/mock/` |
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
app/             UI routes (pages, layouts)        → app/AGENTS.md
app/api/         backend route handlers            → app/api/AGENTS.md
components/app/  the prototype screens (one file per tab) + shell
components/ui/   shadcn/ui primitives (add with `npx shadcn add <name>`)
                                                  → components/AGENTS.md
lib/contracts.ts shared Zod schemas + types (the contract)
lib/rules/       deterministic money math          → lib/rules/AGENTS.md
lib/ai/          agent, tools, prompts, provider   → lib/ai/AGENTS.md
lib/rag/         ingestion, retrieval, evals       → lib/rag/AGENTS.md
data/            mock data, personas, RAG corpus   → data/AGENTS.md
                 (data/mock/ui.ts feeds the prototype screens)
docs/            idea, architecture, decisions, judging prep

```

## Current state of the code

The frontend starts from a **v0 prototype**: a single-page, mobile-first app with four
tabs (Acasă, Agent, Progres, Profil), all driven by mock data in `data/mock/ui.ts`.
Nothing is connected yet: no API routes, no AI, no database. See `app/AGENTS.md` for
the known cleanups the prototype needs.

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

## Disjoint Tasks Roadmap

To allow multiple agents and developers to work in parallel without merge conflicts, work is partitioned into 4 disjoint tasks:

1. **Task 1: Core Financial Math Engine (`lib/rules/`)**
   - Pure TypeScript calculations in integer bani (pure functions, no UI, no LLM, zero floats).
   - Implement: `roundUp(amount, rule)`, `jarTotal(roundups, cap)`, `allocate(amount, riskLevel)` (split across Pillar 3 / ETF BET / Government bonds), compound projection bands (pessimistic / base / optimistic), and `daysOfFreedom()`.
   - Unit tests against personas in `data/personas/`.
   - **Files touched:** `lib/rules/*`.

2. **Task 2: AI Assistant & Tool Calling (`lib/ai/` + `app/api/chat/`)**
   - Vercel AI SDK integration with provider fallback (`gemini` → `groq` → `mock`).
   - Implement tools (`calculate_projection`, `explain_number`, `search_knowledge`) calling `lib/rules/`.
   - Wire `components/app/agent-screen.tsx` to `/api/chat` for streaming responses and tool result cards.
   - **Files touched:** `lib/ai/*`, `app/api/chat/route.ts`, `components/app/agent-screen.tsx`.

3. **Task 3: Dynamic Projections & Visualizations (`components/app/progress-screen.tsx` & `home-screen.tsx`)**
   - Replace static hard-coded SVG curve with dynamic interactive charts responding to state.
   - Connect monthly contribution slider (`+0` to `+500 lei/lună`) to recompute projected days of freedom live on screen.
   - Clean up inline hex values into CSS tokens in `globals.css` and verify RO-RO locale formatting.
   - **Files touched:** `components/app/progress-screen.tsx`, `components/app/home-screen.tsx`, `app/globals.css`.

4. **Task 4: Onboarding & Risk Suitability Wizard (`app/onboarding/` or modal)**
   - ~60-second onboarding flow: 3 MiFID II suitability questions → risk level (Scăzut / Mediu / Ridicat), round-up multiplier selection, and simulated card linking.
   - Store settings to initialize user profile state before landing on the dashboard.
   - **Files touched:** `components/app/onboarding-wizard.tsx` (or `app/onboarding/*`), `app/api/onboarding/*`.

## Agent Activity Log

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