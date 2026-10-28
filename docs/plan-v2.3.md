# Plan v2.3 — third feedback round (28 Oct 2026)

Builds on [plan-v2.2.md](plan-v2.2.md). Same rules: current theme, English app text, fictional data, integer bani.
**Status (29 Oct 2026): built.** Answers: Q1 low-poly piggy image, Q2 "LifeGrowth", Q3 yes, Q4 Stripe pop-up unchanged (only "Save with Link" removed), Q5 open month only, Q6 yes, Q7 "Open Banking (demo)", Q8 all fixed.
Extra (asked later): connecting Open Banking imports the last 3 months of payments; the Month tab shows them with a "would have saved" box. Demo walkthrough: [DEMO_SCRIPT.md](DEMO_SCRIPT.md).

---

## 1. Brand and layout

### 1.1 Rename "zile." → "Life Growth" **[Q2]**
Everywhere the user sees the name:
- logo text, page titles (`zile. — Home` → `Life Growth — Home`);
- landing, terms, onboarding checkbox, offer card;
- share card + preview image, AI message prompt, admin page, demo bank screens.

The code, repo, database and docs keep their names (no risk, no migration).
"Days of freedom" stays as the concept.

### 1.2 Piggy bank picture top left **[Q1]**
- Today: a small lucide icon in a purple square.
- Proposal: a proper piggy bank illustration (our own SVG, low-poly style like the island) as `public/logo.svg`, shown next to "Life Growth". One file to swap later.

### 1.3 Bigger island, shorter Home card
- The island fills more of its box: camera zoomed in (`CAMERA_FIT` 8.6 → ~7), checked while it spins so nothing gets cut.
- The Home island card gets less tall: the canvas goes from square to 4:3, with less padding above the level pill and below the share button.
- Landing and the shared-island pop-up get the bigger island too (same component).

---

## 2. Bugs

### 2.1 "Read the terms" doesn't work **[Q8]**
- On the landing page the link works, but it breaks over two lines ("Read the" / "terms"), so it's a tiny target and clicks land next to it.
- Fix: a proper button **Read the terms** on its own line (landing, offer card).
- In onboarding the link sits inside the checkbox label: tapping it also ticks the box. Fix: move it out of the label.

### 2.2 "Sign up" logs me straight in **[Q3]**
- Cause: you were already logged in. `proxy.ts` sends logged-in users from `/register` to `/app`.
- Fix (proposal):
  - Landing page: when logged in, the two buttons become **Open the app** and **Log out**.
  - `/register` when logged in: "You're logged in as Rares. **Log out and create a new account**" instead of a silent redirect.

### 2.3 PDF read by AI failed → ask to type it in
- Today: a red error, and the user has to find "Add a pension by hand".
- Fix: on failure, a manual card opens right away (with the pillar guessed from the file name if possible), focused, with the message *"We couldn't read it automatically. Please type the numbers from your statement."*
- Reminder: the Gemini key in `.env.local` is still rejected (401), so every upload fails today. **A new key is needed** for section 4.

---

## 3. Card and bank: clear and consistent

### 3.1 Stripe card pop-up **[Q4]**
- Remove Stripe's **"Save with Link"** button inside the card number (`disableLink: true` on the card field).
- Text colour: the pop-up follows the app theme: in dark mode a dark sheet with **white** text in Card number, Expiry and CVC (Stripe fields get their colour from code); in light mode as now.

### 3.2 The bank module looks like the Stripe one, and the difference is obvious **[Q7]**
- Same sheet design for both (same header style, colours, spacing).
- Rename "Banca Demo" to a clearer name (proposals in Q7).
- Profile → *Card and bank* gets a 2-line explainer at the top:
  1. **Payment card (Stripe):** pays your monthly amount, only when you say yes.
  2. **Bank connection (<name>):** reads your card payments to calculate round-ups. Can't move money.
- The same two lines appear in onboarding step 4.

---

## 4. PDF reader with two jobs **[Q5, Q6]**

One upload box, the AI detects what the document is:

| Document | What happens |
|---|---|
| **Pension statement** (Pillar II / III) | As today: provider, balance, date → the user checks → saved in "Your pensions". |
| **Bank statement** | The AI lists the transactions (date, merchant, amount). Card payments are added to the payment history (the round-ups list), **skipping ones we already have**. Result: *"Found 34 card payments, 21 new → +38.40 RON in round-ups"*. |

### How "already have" is decided
- Same day + same amount + similar merchant name (normalised, e.g. "LIDL 0123 BUC" = "Lidl").
- Each imported row gets an id from those three values, so uploading the same statement twice adds nothing.

### Which months count
- Round-ups are recalculated only for the **open month** (past months are already answered). Older transactions are saved as history but don't change past offers. **[Q5]**

### Where the upload lives **[Q6]**
- Profile: "Update your details" becomes **"Add or update from a PDF"** with two short options under one box: *"Pension statement → updates your pensions"* and *"Bank statement → adds your latest payments (if your bank isn't connected)"*.
- Onboarding step 1 stays pension-only; step 4 (round-ups) gets "No bank connection? Upload a bank statement instead".

### Technical
- New `lib/ai/extract-document.ts`: one Gemini call returns either `{ type: "pension", ... }` or `{ type: "bank", transactions: [...] }`, validated with Zod (max 300 rows, amounts → bani, dates `YYYY-MM-DD`).
- Saved in `transactions` with `external_id = pdf-<hash>`; then `rebuildJar` for the open month.
- New fictional demo PDF: `data/demo/bank-statement-demo.pdf` (Banca Demo, a month of card payments).
- Mock mode (no AI key): returns labelled sample data, as today.
- Privacy: real bank statements hold IBANs and names → demo uses fictional PDFs only; in production we'd strip personal data before sending to the AI.

---

## Order

| Step | Size | Depends on |
|---|---|---|
| 1 Brand + layout | S–M | Q1, Q2 |
| 2 Bugs | S | Q3, Q8 |
| 3 Card / bank clarity | S | Q4, Q7 |
| 4 PDF reader, two jobs | M–L | Q5, Q6 + a working Gemini key |

---

## Open questions

- **Q1** Piggy bank "picture": should I draw a low-poly piggy bank SVG, or do you have an image you want to use?
- **Q2** Exact spelling: "Life Growth" (two words), "LifeGrowth", or "Life Growth." with a dot like before?
- **Q3** OK with: landing shows "Open the app / Log out" when you're logged in, and `/register` offers "Log out and create a new account"?
- **Q4** Stripe pop-up: follow the theme (dark in dark mode with white text), or always dark?
- **Q5** Bank statement transactions: round-ups only for the open month, older ones kept as history only. OK?
- **Q6** Upload places: Profile (both kinds) + onboarding step 4 (bank statement as an alternative to connecting the bank). OK?
- **Q7** Name for the demo bank connection: "Open Banking (demo)", "BankSync (demo)", or "Transaction Link (demo)"? Or your own.
- **Q8** Which "Read the terms" didn't work for you: on the landing page, in onboarding, or on the month-end offer? (I'll fix all three anyway.)
