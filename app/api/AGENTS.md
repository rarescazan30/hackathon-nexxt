# app/api/: backend route handlers

Owner: **Backend Lead**. Read the root `AGENTS.md` first.

## Purpose

HTTP endpoints for the UI, Stripe webhooks and the monthly cron job. Route handlers
stay thin: validate input, call `lib/*`, return the result.

## Rules

- Validate every request body and every external payload with Zod schemas from
  `lib/contracts.ts`.
- Money math never lives here: call `lib/rules/`.
- AI calls never live here: call `lib/ai/`.
- **Stripe webhook:** read the raw body (`req.text()`) and verify the signature with
  `STRIPE_WEBHOOK_SECRET` before trusting anything. Store `event.id` and ignore
  duplicates (Stripe retries).
- **Monthly collection:** one idempotency key per user per month, so a second run never
  charges twice. Handle "authentication required", insufficient funds and expired
  cards: the jar carries over and the user is notified.
- The cron route and the "Simulate end of month" demo button call the same logic.
- Stripe is **test mode only** (`sk_test_...`).
- Secrets only from `process.env`, server-side. Never expose them to the client.

## Planned routes (draft)

- `POST /api/onboarding`: save risk profile and settings
- `POST /api/stripe/setup`: start saving a card
- `POST /api/stripe/webhook`: Stripe events
- `POST /api/cron/monthly`: collect jars and create orders (also used by the demo button)
- `GET  /api/dashboard`: days of freedom, jar, timeline
- `POST /api/chat`: the "what if…?" agent (streams; logic in `lib/ai/`)
- `POST /api/statements`: upload a bank statement for extraction
