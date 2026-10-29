---
title: "Request lifecycle"
description: "What happens when a page loads and when a button is pressed."
---

# Request lifecycle

## Loading a page

```mermaid
sequenceDiagram
  participant B as Browser
  participant P as proxy.ts
  participant S as /app page (server)
  participant DB as Supabase
  B->>P: GET /app
  P->>DB: getClaims() (verify the session JWT)
  alt not logged in
    P-->>B: redirect /login
  else logged in
    P->>S: continue (refreshed cookies attached)
    S->>DB: profile, pensions, months, payments (RLS: own rows only)
    S->>S: lifestyleNumbers() → days, level, income
    S-->>B: HTML stream, then the client screens hydrate
  end
```

1. **`proxy.ts`** (Next 16's replacement for middleware) runs before every page. It refreshes the Supabase session cookie and guards routes:
   - `/app`, `/onboarding`, `/admin` → logged-out users go to `/login`;
   - `/login` → logged-in users go to `/app`.
2. **The page** renders a static shell and streams the user's data inside `<Suspense>`. Loaders call `await connection()`, so per-user data is never prerendered (`cacheComponents` is on).
3. **`getAppData()`** (`lib/data/app-data.ts`) reads everything the three tabs need in one go and returns an `AppData` object. Screens never fetch on their own.
4. **`/app`** redirects to `/onboarding` until onboarding is finished.

## Pressing a button (a Server Action)

```mermaid
sequenceDiagram
  participant B as Browser
  participant A as Server Action
  participant R as lib/rules + lib/server
  participant DB as Supabase
  B->>A: answerMonthlyOffer({ jarId, accept })
  A->>DB: getUser() (who is calling?)
  A->>A: Zod-validate the input
  A->>R: answerOffer → collectJar → rebuildJar(next month)
  R->>DB: writes (admin client, user id from the session)
  A->>A: refresh()
  A-->>B: the page re-renders with fresh data
```

Every action follows the same shape:

```ts
export async function updateSettings(input: SettingsInput) {
  const userId = await requireUserId()        // from the session, never from the browser
  const settings = SettingsInput.parse(input)  // Zod
  // ... write ...
  refresh()                                    // re-render with fresh data
}
```

## Two Supabase clients

| Client | File | Used for |
|---|---|---|
| **User client** | `lib/supabase/server.ts` | Reads and simple writes; row-level security limits it to the user's own rows. |
| **Admin client** | `lib/supabase/admin.ts` | Server-only writes users may not make themselves (statuses of monthly jars, round-ups, upload results). Always scoped by the session's user id. |

## Webhooks

Stripe calls `POST /api/stripe/webhook` after a payment. The route verifies the signature, stores the event id in `stripe_events` (duplicates are ignored) and updates the month's `payment_status`. See [Stripe payments](../features/stripe-payments.md).
