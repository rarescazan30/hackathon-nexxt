# app/: UI routes

Owner: **Frontend Lead**. Read the root `AGENTS.md` first.

## Purpose

Pages and layouts of the mobile-first app. Backend code lives in `app/api/` (separate owner).

## Rules

- Mobile-first: design at ~390 px width first, then scale up. It should look like a
  screen inside a banking app.
- The home screen shows **days of freedom** and **the jar**, not spending categories.
  We are not a budgeting app.
- No jargon in the UI: "days of freedom", not "returns" or "portfolio".
- Every number on screen can be tapped to show where it comes from (source + assumption).
- Data comes from `lib/data/app-data.ts` (`AppData`) and server actions. Screens never
  fetch on their own and never hard-code data.
- Reusable pieces go in `components/`; pages stay thin.
- **All app text in English** (UI, errors, AI messages). Money as `169 RON`, `en` number format.

## Pages (plan v2, `docs/plan.md`)

| Route | File | What it shows |
|---|---|---|
| `/` | `page.tsx` | landing: hook, rotating 3D scene, how it works, sourced facts, business model |
| `/login`, `/register` | `login/`, `register/` | auth + "Log in as Andrei (demo)" |
| `/onboarding` | `onboarding/` | statement upload → 3 questions → reveal → piggy bank |
| `/app` | `app/page.tsx` | loads `AppData` inside Suspense, renders `components/app/app-shell.tsx` |
| `/terms` | `terms/page.tsx` | plain-English terms, the one-month hold and interest |
| `/dev/scene` | `dev/scene/` | scene playground; hidden in production unless `ENABLE_DEV_PAGES=1` |

Pages that read the session render inside `<Suspense>` (`cacheComponents` is on).
Mutations are server actions next to the page (`app/app/actions.ts`, `app/onboarding/actions.ts`)
and call `refresh()` from `next/cache` when the screen must update.
