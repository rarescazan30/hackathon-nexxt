# zile. — How will you live in retirement?

nexxt hackathon, "Rethinking Financial Futures": make the financial future more accessible
and relevant for people in Romania.

**zile.** shows people in their 30s how they would live in retirement, as a small low-poly
3D world, from their real pension numbers. Card payments are rounded up, and once a month
the user adds that money to their Pillar III pension with one tap. Every contribution adds
**days of freedom** and XP; levels upgrade the world from a tent to a villa.
Full plan: [docs/plan.md](docs/plan.md).

## Start here

1. Read [AGENTS.md](AGENTS.md) (team rules and stack), then the `AGENTS.md` in your folder.
2. `cp .env.example .env.local` and fill in the Supabase keys and the demo account
   (ask the team; never commit them).
3. Install, seed the demo user, run, then open http://localhost:3000 (best at phone width):

```bash
npm install
npm run seed
npm run dev
```

Before a PR: `npm run lint`, `npm test` and `npm run build` must pass.

## Pages

| URL | What |
|---|---|
| `/` | landing page (hook, how it works, sources, business model) |
| `/login`, `/register` | auth; "Log in as Andrei (demo)" skips sign-up |
| `/onboarding` | statement upload → 3 questions → retirement reveal → round-up settings |
| `/app` | Home (days + 3D scene + level), Month (offer), Profile |
| `/terms` | plain-English terms, including the one-month hold and interest |
| `/dev/scene` | 3D scene playground (dev only) |

## Where things are

| Path | What |
|---|---|
| `lib/rules/` | all money math: round-ups, projections, days of freedom, levels, interest |
| `lib/server/` | jar builder, money flow (offer → collect → invest), mock bank |
| `lib/data/` | loads and computes what the screens show |
| `lib/ai/` | monthly message + PDF statement reader (Gemini / Groq / mock) |
| `lib/supabase/` | Supabase clients and generated DB types |
| `components/app/` | the 3 app screens, shell and level-up overlay |
| `components/scene/` | the low-poly three.js retirement scene |
| `components/onboarding/`, `components/landing/`, `components/auth/` | the other pages |
| `supabase/migrations/` | database schema; `scripts/seed.ts` the demo data |

## Docs

- [docs/plan.md](docs/plan.md): the product, numbers, money flow, screens
- [docs/architecture.md](docs/architecture.md): how the pieces fit
- [docs/decisions.md](docs/decisions.md): decisions log
- [docs/judging.md](docs/judging.md): judging criteria and pitch prep
