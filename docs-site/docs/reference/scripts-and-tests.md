---
title: "Scripts and tests"
description: "npm scripts, seed data and the test suite."
---

# Scripts and tests

## npm scripts (repository root)

| Command | Does |
|---|---|
| `npm run dev` | development server, http://localhost:3000 |
| `npm run build` · `npm start` | production build · serve it |
| `npm run lint` | ESLint |
| `npm test` | the unit tests below |
| `npm run seed` | Pillar III product, test user Andrei, admin account |
| `npm run seed:demo-users` | 338 fictional savers for `/admin` (`-- --remove` deletes them) |

## Seed data

**Andrei** (`scripts/seed.ts`, persona `data/personas/andrei.json`): 34, 6,500 RON net, 12 years worked, 42,000 RON in Pillar II, Demo Bank card •• 4821. Six months of history: May–August invested, September held by the partner, October open. Level 10 at 380/400 XP, so accepting October levels him up.

**Admin**: a finished minimal profile so it can open `/app` and see the Admin button.

**Demo savers** (`scripts/seed-demo-users.ts`): see [Admin dashboard](../features/admin.md#demo-data).

## Tests

Node's built-in test runner, run with `jiti`:

| File | Covers |
|---|---|
| `lib/rules/__tests__/rules.test.ts` | round-ups, jar totals, projections, days of freedom |
| `lib/rules/__tests__/personas.test.ts` | the test personas end to end |
| `lib/rules/__tests__/lifestyle.test.ts` | income at 65, tiers, XP, levels, inflation, profile limits, the welcome-bonus level-up |
| `lib/ai/__tests__/ai.test.ts` | AI fallbacks: monthly message, sample pension and bank statements |

Before pushing:

```bash
npm run lint && npm test && npm run build
```

## Demo files

| File | For |
|---|---|
| `data/demo/pillar2-statement-demo.pdf` | Pillar II statement (NN Pensii) |
| `data/demo/pillar3-statement-demo.pdf` | Pillar III statement (BT Pensii) |
| `data/demo/bank-statement-demo.pdf` | bank statement, 13 lines (3 overlap with Open Banking) |

All fictional.
