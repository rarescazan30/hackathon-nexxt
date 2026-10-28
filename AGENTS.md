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
components/      reusable UI components            → components/AGENTS.md
lib/contracts.ts shared Zod schemas + types (the contract)
lib/rules/       deterministic money math          → lib/rules/AGENTS.md
lib/ai/          agent, tools, prompts, provider   → lib/ai/AGENTS.md
lib/rag/         ingestion, retrieval, evals       → lib/rag/AGENTS.md
data/            mock data, personas, RAG corpus   → data/AGENTS.md
docs/            idea, architecture, decisions, judging prep

```

## How we work

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