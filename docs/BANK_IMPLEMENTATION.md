# Bank implementation — how round-ups really work

Three parts: what we have **today**, how it would work **for real**, and the **demo mock** the mentors asked for.

---

## 1. Today (honest status)

- **No real bank is connected.** "Connect your card" is a switch.
- When it's on, `lib/server/mock-bank.ts` creates **fictional** transactions: rent, electricity, salary, and 12 card payments (Lidl, Bolt, Glovo…). Same month → same data.
- `lib/server/jar.ts` (`rebuildJar`) takes the card payments of a month, applies the round-up rule from `lib/rules`, writes one `roundups` row per payment, and sums everything into `monthly_jars`.
- The Month tab lists those round-ups ("Lidl · 143.20 RON → +1.80 RON").
- **Known gap:** for users who registered themselves, only the first month gets transactions. Later simulated months have 0 round-ups. Fix is in plan-qol.md 2.2.

So the **math is real**, the **data is fake**.

---

## 2. For real: two separate jobs

A round-up app needs two different permissions from the bank. Both exist in the EU thanks to **PSD2** (in Romania: **Legea 209/2019**, supervised by **BNR**).

### Job A — *see* the transactions (to compute round-ups)
- Service: **AIS** (Account Information Service).
- The user opens their bank's page, logs in, and approves "zile. can read my transactions". This is the **consent**.
- We then read the transactions through the bank's API, a few times a day.
- Consent lasts **180 days**, then the user confirms again in the bank app.
- Every new card payment → we compute the round-up → it shows in the app. **No money moves.**

### Job B — *move* the money (once a month, when the user taps Yes)
- Service: **PIS** (Payment Initiation Service).
- When the user taps **Yes, add it**, we create a payment of e.g. 65 RON from their account to the destination account. The bank asks the user to confirm in the bank app (fingerprint / code = **SCA**, strong customer authentication).
- This fits our product well: **one tap a month = one bank confirmation a month.**

### We don't need our own license at the start
Getting an AISP/PISP license from BNR yourself takes months and capital. Instead, startups use an **aggregator** that already has the license and connects to many banks with one API:

| Option | Notes (to verify before choosing) |
|---|---|
| **Salt Edge** | EU-licensed, covers Romanian banks, AIS + PIS. |
| **Tink** (Visa) | Large EU coverage, AIS + PIS. |
| **Enable Banking** | AIS + PIS, developer-friendly. |
| **Smart Fintech** / **Finqware** | Romanian players, focused on Romanian banks. |

All of them work the same way for us: redirect the user to the bank → get a consent id → call `GET /transactions` → (for payments) `POST /payments`.

### The real flow, end to end
```
User taps "Connect your card"
  → aggregator page → user picks bank (BT, BCR, ING…) → logs in, approves
  → we store the consent id (never the bank password)
Every few hours
  → we fetch new transactions → keep card payments only → round-up each one
  → the Month tab shows them, the counter grows
End of month
  → offer "Add 65 RON to your Pillar III?" → user taps Yes
  → payment initiation → user confirms in the bank app
  → money goes to the partner bank account (held 1 month) → then to the Pillar III fund
```

### What changes in our code
- `transactions` table already has `external_id` (bank id) and `is_card_payment` → **no schema change** for reading.
- Replace `mock-bank.ts` with `lib/server/bank-client.ts` that calls the aggregator.
- New table `bank_connections` (user id, provider, consent id, expires at).
- A scheduled job (Supabase cron / Vercel cron) that syncs transactions.
- `rebuildJar` stays exactly the same. That's the point: the round-up logic doesn't care where the data comes from.

### Where the money goes (destination)
See [FLOAT_LEGAL.md](FLOAT_LEGAL.md). Short version: to a **partner bank** account (not ours), then to the **Pillar III fund's** collection account with the user's CNP as reference, which is how Pillar III payments work today.

---

## 3. The demo mock (what the mentors asked for)

Goal: in 2 minutes the jury believes a card is connected and sees round-ups appear live.

### 3.1 Fake bank consent
- "Connect your card" opens a modal that looks like a bank page: **Banca Demo**, the user picks an account (`RO49 DEMO 0000 1234 5678`, "Card Visa •• 4821"), then types any 4-digit code to "confirm".
- Clearly marked **Demo bank**, so nobody thinks it's a real bank.
- After confirming, we import this month's payments so far (as today).

### 3.2 "Pay with card" button (the live moment)
- On the Month tab: **Pay with card (demo)** → pick a shop (Starbucks, Lidl, Bolt…) and an amount, or tap a ready example ("Coffee 12.30 RON").
- Server action creates a transaction (`external_id` = `demo-<uuid>`), runs `rebuildJar`, and the new round-up slides in at the top: *Starbucks 12.30 RON → +2.70 RON*.
- The counter on Home goes up.

### 3.3 Month end with a bank confirmation
- **Yes, add it** shows a short fake bank screen: *"Banca Demo: confirm payment of 65 RON to zile. partner"* → confirm → done.
- Then the money is "held", and on the next simulated month it's "invested" (as today).

### 3.4 Every simulated month has payments
- *Simulate end of month* first imports the whole month's payments for card-linked users (fixes the gap in section 1).

---

## Pitch line
> "Today the round-ups use a demo bank. In production we connect through a licensed PSD2 aggregator: we only *read* transactions to compute round-ups, and once a month the user confirms one payment in their own bank app. The round-up engine you just saw doesn't change."

---

⚠️ Not legal advice. Provider details must be checked with each provider before choosing.
