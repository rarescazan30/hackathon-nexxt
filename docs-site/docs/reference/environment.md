---
title: "Environment variables"
description: "Every variable, whether it's needed and where it comes from."
---

# Environment variables

Locally in `.env.local` (never committed; `.env.example` lists them). On Vercel in **Settings → Environment Variables**, followed by a redeploy.

| Variable | Needed? | What it is |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **yes** | Supabase project URL (public by design) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | **yes** | Supabase publishable key, `sb_publishable_…` (public by design) |
| `SUPABASE_SECRET_KEY` | **yes** | Supabase secret key, `sb_secret_…`, server only |
| `AI_PROVIDER` | optional | `gemini`, `groq` or `mock` |
| `GOOGLE_GENERATIVE_AI_API_KEY` / `GEMINI_API_KEY` | optional | Gemini API key |
| `GROQ_API_KEY` | optional | Groq key (text only) |
| `STRIPE_SECRET_KEY` | optional | Stripe **test** secret key, `sk_test_…` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | optional | Stripe **test** publishable key, `pk_test_…` |
| `STRIPE_WEBHOOK_SECRET` | optional | `whsec_…` from `stripe listen` or the dashboard |
| `ADMIN_EMAIL` | for `/admin` | the admin account's email |
| `ADMIN_PASSWORD` | local only | used by `npm run seed` |
| `DEMO_USER_EMAIL`, `DEMO_USER_PASSWORD` | local only | the test user `npm run seed` creates |

## What happens without the optional ones

| Missing | The app… |
|---|---|
| AI key (or `AI_PROVIDER=mock`) | reads demo PDFs with labelled sample values; the monthly message uses a fixed sentence |
| Stripe keys | shows "Card payments are off"; **Yes, add it** asks for a card |
| Webhook secret | still charges cards; `payment_status` isn't updated by Stripe events |
| `ADMIN_EMAIL` | has no admin |

:::warning
Only the three `NEXT_PUBLIC_…` values reach the browser. Never give a secret key that prefix.
:::
