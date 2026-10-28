# Demo script — LifeGrowth (about 4 minutes)

What the jury should remember: **"In one minute I saw how I'll live in retirement, and every coffee makes it better."**

## Before you go on stage (10 minutes earlier)

- [ ] `.env.local` has: Supabase keys, **a working Gemini key** (or `AI_PROVIDER=mock`, see below), Stripe test keys.
- [ ] Supabase → Authentication → Email → **Confirm email is off** (or sign-up stops).
- [ ] Production build running: `npm run build && npm start` (+ `ngrok http 3000` if showing on phones).
- [ ] Phone/laptop: open the landing page, **logged out**.
- [ ] Files ready on the laptop: `data/demo/pillar2-statement-demo.pdf`, `data/demo/pillar3-statement-demo.pdf`, `data/demo/bank-statement-demo.pdf`.
- [ ] Stripe Dashboard (test mode) open in a second tab → Payments. **Stripe keys are required:** "Yes, add it" needs a saved card.
- [ ] Admin numbers filled: `npm run seed:demo-users` (338 fictional savers; `-- --remove` deletes them).
- [ ] A fresh email ready for sign-up (e.g. `demo1@yourteam.ro`; each run needs a new one).

**No working Gemini key?** Start the app with `AI_PROVIDER=mock`: uploads then use sample values tagged *"Sample values (AI is off in this demo)"*, picked by file name (demo PDFs work). Say it honestly if asked.

---

## The flow

### 1. The hook (20 s) — landing page
- "Want to find out how you'll live in retirement?" + the island changing from tent to villa.
- Tap **Sign up**.

### 2. Sign up (15 s)
- Name, email, password → **Create account**.

### 3. Pension documents (40 s)
- **Upload a statement** → `pillar2-statement-demo.pdf` → card *"Read by AI, please check"* with NN Pensii and the balance.
- Upload `pillar3-statement-demo.pdf` → second card (Pillar III, BT Pensii).
- Say: "The AI reads the PDF, the user always checks. If it can't read it, a form opens to type it."
- **Continue**.

### 4. Three questions (15 s)
- 1992 · 6500 · 12 → **Show me my retirement**.

### 5. The reveal (30 s) — the wow moment
- The island, the level, *Expected income at 65*, *Compared to your life today*, and the days counting up.
- Say: "Prices rose 66% in 10 years, so we only count growth above inflation."
- **Let's make it better**.

### 6. Piggy bank + Open Banking (45 s) — the "real bank" moment
- Round-up 5 RON, salary share 3%.
- **Connect your bank** → *Open Banking (demo)*:
  1. choose **Demo Bank**;
  2. last 4 digits of your card: **4821**;
  3. "Allow LifeGrowth to read your payments" → any 4 digits → **Allow access**.
- Say: "This is the PSD2 consent. Read-only: it can't move money. In production it's a licensed provider connected to BT, BCR, ING."
- Tick the terms → **Start saving**.

### 7. Your payments appear (30 s)
- Home: days of freedom, level, the island (drag it to spin).
- **Month** tab → **Card payments**: this month's payments with their round-ups, and the last 3 months.
- Point at the yellow box: *"With LifeGrowth in the months before you joined, round-ups would have saved you 85 RON."*

### 8. Payment card with Stripe (30 s)
- **Profile → Card and bank**: "Two separate things: Stripe pays, Open Banking reads."
- **Add a card** → `4242 4242 4242 4242`, `12/34`, `123`, any name → **Save card** → *Visa •• 4242*.
- Say: "Card digits go straight to Stripe. We never see or store them."

### 9. Month end (30 s)
- **Month → Simulate end of month** → *"October 2026 · end of month: you saved 225 RON…"*
- **Yes, add it** → "Paying…" → the next month opens; October says *With our partner until…*
- Switch to the **Stripe Dashboard → Payments**: the 225 RON payment, *Succeeded*.
- Say: "The money stays one month with our banking partner; the interest is our business model. Then it goes to Pillar III."

### 10. Share (15 s, optional)
- Home → **Share my island** → show the link preview / the pop-up with first name and level.

---

## Backup moves

| If… | Do this |
|---|---|
| A PDF isn't read | The manual card opens by itself: type the numbers from the PDF |
| No bank connection wanted | Step 6: **Upload a bank statement** (`bank-statement-demo.pdf`) instead |
| Stripe fails | Say "Not this month" and show the Stripe Dashboard / admin panel instead. Without a saved card, "Yes" asks you to add one in Profile |
| Sign-up blocked | Log in with the team's test user (made with `npm run seed`) |
| Something breaks mid-demo | Admin view (`/admin`) shows the business numbers as a fallback story |

## Extra: bank statement instead of Open Banking
In **Profile → Update details or add a PDF**, upload `bank-statement-demo.pdf`:
*"Found 13 transactions (11 card payments): 10 new, 3 you already had."*
Payments already sent by Open Banking (Lidl, Bolt, Glovo) are recognised and skipped.
