# Hackathon nexxt: Zile de Libertate (working title)

Raiffeisen Bank challenge, "Rethinking Financial Futures": make navigating the
financial future more accessible, relevant and empowering for people in Romania.

Current direction: round-ups from everyday card spending plus a share of each salary,
collected automatically and invested by risk level after an AI agent explains the
monthly proposal. Progress is shown as **days of freedom** in retirement.
Details and open questions: [docs/idea.md](docs/idea.md).

## Status

A clickable **frontend prototype** (made with v0): mobile-first, four tabs
(Acasă, Agent, Progres, Profil), all on mock data. No backend, AI or database yet.

## Start here

1. Read [AGENTS.md](AGENTS.md) (team rules and stack), then the `AGENTS.md` in your folder.
2. `cp .env.example .env.local` (nothing is required yet to run the prototype).
3. Install and run, then open http://localhost:3000 (best viewed at phone width):

```bash
npm install
npm run dev
```

Before a PR: `npm run lint` and `npm run build` must pass.

## Where things are

| Path | What |
|---|---|
| `app/page.tsx` | the prototype page: tab state + bottom nav |
| `components/app/` | one file per screen (`home-screen.tsx`, `agent-screen.tsx`, `progress-screen.tsx`, `profile-screen.tsx`) and `shell.tsx` (Card, Header, BottomNav) |
| `components/ui/` | shadcn/ui primitives (`npx shadcn add <name>`) |
| `data/mock/ui.ts` | mock data behind the screens |
| `lib/contracts.ts` | shared Zod schemas (the team contract) |
| `lib/rules/`, `lib/ai/`, `lib/rag/`, `app/api/` | backend areas, planned (see each `AGENTS.md`) |

## Docs

- [docs/idea.md](docs/idea.md): product, flow, open questions
- [docs/architecture.md](docs/architecture.md): system, monthly pipeline, data model
- [docs/decisions.md](docs/decisions.md): decisions log
- [docs/judging.md](docs/judging.md): judging criteria, statistics to source, regulation, Q&A
