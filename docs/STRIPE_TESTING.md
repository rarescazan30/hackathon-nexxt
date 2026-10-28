# Stripe testing — how to try card payments

Card payments use **Stripe in test mode**: fake cards, no real money, no company activation needed.
Everything below works on a laptop with `npm run dev` (or the ngrok URL).

## What is built

| Piece | Where |
|---|---|
| "Add a card" form (number, MM/YY, CVC from Stripe + name on card) | Profile → *Card and bank* (`components/stripe/card-form.tsx`) |
| Save / remove the card (we store only Stripe ids + brand + last 4) | `app/app/card-actions.ts` → `startCardSetup`, `saveCard`, `removeCard` |
| Month end "Yes, add it" charges the saved card | `payMonthWithCard`, `completeCardPayment` (3-D Secure) |
| Webhook: payment succeeded / failed | `app/api/stripe/webhook/route.ts` → `monthly_jars.payment_status` |
| No saved card? | "Yes, add it" falls back to the Banca Demo confirmation (no Stripe) |

Card numbers never reach our server or our database: the fields are Stripe iframes, and the code refuses live keys (`sk_live_…`).

---

## 1. One-time setup (10 minutes)

### 1.1 Stripe account and test keys
1. Create an account at dashboard.stripe.com (any email; no need to activate payments).
2. Make sure the **Test mode** switch is on (top right).
3. Developers → **API keys**: copy
   - **Publishable key** `pk_test_…`
   - **Secret key** `sk_test_…` (click *Reveal*)

### 1.2 Put them in `.env.local` (never in git, never in chat)
```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...   # from step 1.3
```
Share them with teammates privately. **Restart** the server after changing `.env.local`
(the publishable key is baked into the page when the app starts or builds).

### 1.3 Webhooks on your laptop (Stripe CLI)
Install and log in:
```bash
brew install stripe/stripe-cli/stripe
```
```bash
stripe login
```
Forward Stripe events to the app (leave this terminal open while testing):
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
It prints `Ready! Your webhook signing secret is whsec_…` → put that in `STRIPE_WEBHOOK_SECRET`, restart the app.

**With ngrok instead:** Dashboard → Developers → Webhooks → *Add endpoint* →
`https://<your-ngrok-url>/api/stripe/webhook`, events `payment_intent.succeeded` and
`payment_intent.payment_failed` → copy its signing secret into `STRIPE_WEBHOOK_SECRET`.

### 1.4 Check it's on
Profile → *Card and bank* → the card row says **"Pays the monthly amount when you say yes"** and **Add a card** is clickable.
If it says *"Card payments are off"*, a key is missing or the server wasn't restarted.

---

## 2. Test cards

Any **future** expiry date (e.g. 12/34), any **CVC** (e.g. 123), any name.

| Card number | What happens | Use it to test |
|---|---|---|
| `4242 4242 4242 4242` | Saves, every payment succeeds | the happy path |
| `4000 0025 0000 3155` | Asks for 3-D Secure when saving; later payments go through | the bank confirmation pop-up when adding a card |
| `4000 0027 6000 3184` | Asks for 3-D Secure every time, also at month end | the "requires action" path on "Yes, add it" |
| `4000 0000 0000 0341` | Saves fine, but every charge is **declined** | the error message at month end |
| `4000 0000 0000 0002` | Declined already when saving | the error in the card form |

On a 3-D Secure test screen, click **Complete** to approve or **Fail** to reject.

Stripe has a minimum charge per payment (around 2 RON); our monthly amounts are far above it.

---

## 3. Test scenarios (do them in order)

Use a fresh account (register, or a teammate's test user), with the bank connected so months have round-ups.

| # | Do this | Expect in the app | Expect in Stripe / Supabase |
|---|---|---|---|
| 1 | Profile → Add a card → `4242…` → Save | Row shows **Visa •• 4242** | Stripe → Customers: a customer with that card. `profiles.card_last4 = 4242` |
| 2 | Month → Simulate end of month → **Yes, add it** | "Paying…", then the next month opens; past month says *With our partner until …* | Stripe → Payments: a **succeeded** payment in RON with description `zile. 2026-10 → Pillar III`. `monthly_jars.payment_status = succeeded`, `stripe_payment_intent_id = pi_…` |
| 3 | Look at the `stripe listen` terminal | — | `payment_intent.succeeded` → `[200]`. A row in `stripe_events` |
| 4 | Press **Yes** twice quickly (or refresh and retry) | Only one month accepted | Only **one** payment in Stripe (idempotency key) |
| 5 | Remove card → add `4000 0000 0000 0341` → simulate → Yes | Red message *"Your card was declined…"*, offer stays | Stripe: a **failed** payment. `payment_status = failed` |
| 6 | Remove card → add `4000 0027 6000 3184` (complete 3DS) → simulate → Yes | Stripe's 3-D Secure pop-up → **Complete** → month accepted | Stripe: succeeded payment after authentication |
| 7 | Same as 6 but click **Fail** | Message *"The bank did not confirm the payment."*, offer stays | Stripe: payment *requires payment method* / failed |
| 8 | Remove card → simulate → Yes | Banca Demo confirmation (no Stripe) | No new Stripe payment; `payment_status` empty |
| 9 | "Another amount" → 150 → Yes (with `4242`) | Accepted 150 RON | Stripe payment of **150.00 RON** |
| 10 | Remove the Stripe keys, restart | Card row: *"Card payments are off"*; app still works with Banca Demo | — |

**Webhook checks without the app:**
```bash
stripe trigger payment_intent.succeeded
```
→ `[200]` in `stripe listen` (an event without our `jar_id` is just recorded, nothing changes).
A request without a valid signature must get **400** (e.g. `curl -X POST localhost:3000/api/stripe/webhook`).

---

## 4. Where to look

- **Stripe Dashboard (test mode):** Payments, Customers, Developers → Events / Webhooks (each delivery and its response code).
- **Supabase:** `profiles` (`stripe_customer_id`, `card_brand`, `card_last4`), `monthly_jars` (`payment_status`, `stripe_payment_intent_id`), `stripe_events`.
- **Server log:** errors from Stripe calls.

## 5. Troubleshooting

| Symptom | Fix |
|---|---|
| "Card payments are off" | Both keys set? Server restarted? |
| `Only Stripe test keys (sk_test_…) are allowed` | You pasted a live key: use the test one |
| Webhook `[400]` in `stripe listen` | `STRIPE_WEBHOOK_SECRET` doesn't match the one `stripe listen` printed (it changes per login) |
| Card form fields don't show | Ad blockers can block `js.stripe.com`; try a private window |
| Payment fails with a currency error | Your Stripe account can't charge RON: tell the team (we'd switch the test charge to EUR) |

## 6. Rules
- Test keys only. The code refuses live keys.
- Never paste keys in chat, issues or commits. `.env.local` only.
- Never type a real card. Only the test numbers above.
