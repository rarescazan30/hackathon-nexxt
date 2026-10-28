# Architecture

One Next.js app (App Router, TypeScript) with Supabase (Postgres, Auth, Storage).
Frontend and backend live in the same project.

```
 browser ── proxy.ts (session refresh, route guard)
    │
    ├─ /onboarding ── app/onboarding/actions.ts ──▶ lib/ai/extract-statement (PDF → numbers)
    │                                            ──▶ Supabase (profile, pensions, statements bucket)
    ├─ /app ───────── lib/data/app-data.ts  ──▶ lib/data/lifestyle-state ──▶ lib/rules
    │                 app/app/actions.ts    ──▶ lib/server/money-flow ──▶ lib/rules/float
    │                                        ──▶ lib/ai/monthly-message
    └─ components/scene (three.js, client only)
```

## Rules of the road

- **lib/rules** does all money math (integer bani, tested). The AI never calculates.
- **lib/data/lifestyle-state.ts** turns DB rows into days, tier, XP and level. The loader,
  the server actions and the seed all use it, so they always agree.
- Screens receive one `AppData` object as props; they don't fetch.
- Users can read their own rows (RLS). Jar status changes and orders are written by the
  server with the secret key, through `lib/server/money-flow.ts`.

## Monthly money flow

```
open (round-ups counted) → offered (AI message) → accepted | declined
  → collected (money held by the partner, invest_on = +1 month)
  → invested (Pillar III units bought, float_interest_bani recorded)
```

In the demo, "Simulate end of month" invests what is held and turns the newest month
into an offer.

## Data model

`profiles`, `pension_assets`, `statement_uploads` (+ private `statements` bucket),
`transactions`, `roundups`, `monthly_jars`, `orders`, `products` (Pillar III only),
`product_prices`. Days, XP and levels are never stored; `last_seen_level` only remembers
which level-up animation was already shown.
