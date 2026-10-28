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

## Current state: the v0 prototype

`app/page.tsx` is a client component holding the active tab in state; the bottom nav
switches between four screens in `components/app/`:

| Tab | File | What it shows |
|---|---|---|
| Acasă | `home-screen.tsx` | days of freedom hero (+ "De unde vine cifra asta?" sheet), monthly jar, recent activity, agent suggestion |
| Agent | `agent-screen.tsx` | agent message, monthly proposal card (Pilonul 3 / ETF BET), question chips, input |
| Progres | `progress-screen.tsx` | projection chart (static SVG), contribution slider, all pensions in one place, monthly history |
| Profil | `profile-screen.tsx` | risk profile, rules, connected bank, dark-mode toggle |

Shared pieces (`Card`, `Header`, `BottomNav`, `Logo`) live in `components/app/shell.tsx`;
`Tab` and the `money()` formatter in `components/app/types.ts`.

## Known cleanups (pick these up as you touch each screen)

- Code is v0-dense (one component per line). Reformat a screen before editing it.
- Colors are inline hex values (`#33256c`, `#8c7ad9`…). Move them to theme tokens in
  `app/globals.css` so the palette lives in one place.
- The dark-mode toggle in Profil only flips its own switch; it doesn't change the theme yet.
- Some mock labels in `data/mock/ui.ts` are in English; the UI should be Romanian.
- The projection chart is a hard-coded SVG; replace it with real data from `lib/rules/`.
- Chat, buttons and the slider are visual only. No API calls yet.
- No onboarding flow yet (planned: bank connect, Pillar 2 upload, risk questions, rules).

## Still to build (draft)

1. Onboarding: bank connect, about you, Pillar 2 statement upload, risk questions, rules
2. Real chat against `/api/chat`, with tool-result cards
3. Explanations behind every number (sources & assumptions)
