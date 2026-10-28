# app/: UI routes

Owner: **Frontend Lead**. Read the root `AGENTS.md` first.

## Purpose

Pages and layouts of the mobile-first app. Backend code lives in `app/api/` (separate owner).

## Rules

- Mobile-first: design at ~390 px width first, then scale up. It should look like a
  screen inside a banking app.
- The home screen shows **days of freedom** and **the jar**, not spending categories.
  We are not a budgeting app.
- No jargon in the UI: "zile de libertate", not "randament" or "portofoliu".
- Every number on screen can be tapped to show where it comes from (source + assumption).
- Data comes from `app/api/*` routes and is typed with schemas from `lib/contracts.ts`.
  Never invent your own data shapes; while the backend isn't ready, import mock data
  from `data/mock/` that matches the contract.
- Reusable pieces go in `components/`; pages stay thin.
- Text in Romanian by default; keep strings easy to translate to English.

## Planned screens (draft)

1. Onboarding: goal, horizon, 3 suitability questions → risk level, rounding rule, link card
2. Home: days of freedom (range), jar this month, next automatic collection
3. Timeline: monthly collections and where the money went
4. "What if…?" chat with result cards
5. Sources & assumptions
