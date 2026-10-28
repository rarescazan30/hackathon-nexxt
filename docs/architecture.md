# Architecture

One Next.js app deployed on Vercel. Frontend and backend live in the same project;
parallel work is possible because each area has its own folder and everyone codes
against the shared schemas in `lib/contracts.ts`.

```
 Bank (mock PSD2) ─┐
 Statement upload ─┼─▶ app/api/* ──▶ lib/rules  (round-ups, projections, days of freedom)
 Stripe webhook ───┤        │    ──▶ lib/ai     (agent + tools, extraction, explanations)
 Vercel Cron ──────┘        │    ──▶ lib/rag    (search official sources, with citations)
                            ▼
                        Supabase (Postgres + pgvector)
                            ▼
                     app/ + components/ (mobile-first UI)
```

## Monthly pipeline

1. **Cron** (1st of the month) or the "Simulate end of month" button calls the same route.
2. For each user: sum the jar → Stripe charge on the saved card (off-session,
   idempotency key per user per month).
3. **Stripe webhook** confirms → split by risk level → save simulated orders
   (units bought at a historical unit price from a static file).
4. Recompute portfolio value and days of freedom.

Failure cases to handle: authentication required (EU strong customer authentication),
insufficient funds, expired card → the jar carries over to next month and the user is
notified.

## AI

- The agent (Vercel AI SDK) uses tools: `calculate_projection`, `search_knowledge`,
  `get_transactions`, `analyze_document`.
- Tools return numbers; the model explains them. The model never computes money.
- Provider chosen by `AI_PROVIDER` (`gemini` | `groq` | `mock`). Cache demo answers.

## Data model (draft)

`users`, `risk_profiles`, `transactions`, `roundups`, `jar_collections`
(monthly Stripe charges), `orders` (simulated investments), `products`
(name, type, risk, historical prices), `explanations` (cached AI text + sources),
`chunks` (RAG, with embedding).

## Data sources (static snapshots, no live APIs)

INS / Eurostat (inflation), BNR, ASF (Pillar II/III statistics), BVB (BET / BET-TR
history), official pension law and Pillar III documentation.
