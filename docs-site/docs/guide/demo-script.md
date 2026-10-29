---
title: "Demo script"
description: "The 3-minute live demo, step by step, with what to say."
---

# Demo script

A 3-minute live demo. Each block: **what is on screen**, then **what to say**.

## Before going on stage

- [ ] Production build running (Vercel, or `npm run build && npm start`).
- [ ] Stripe test keys set; Stripe Dashboard (test mode) open in a tab → **Payments**.
- [ ] Demo PDFs ready on the laptop (`data/demo/`).
- [ ] A fresh email for sign-up.
- [ ] Optional: `npm run seed:demo-users` so the admin dashboard has numbers.

## 0:00 – 0:25 · Problem and idea

*Landing page; the island changes from tent to villa.*

> "We built LifeGrowth for Romanians aged 30 to 40. Retirement is an abstract PDF and a number decades away, so nobody acts on it. LifeGrowth turns your real pension data into a 3D island that shows how you'd live in retirement, and every card payment's round-up helps upgrade it."

## 0:25 – 1:20 · From a PDF to your future

*Sign up → upload `pillar2-statement-demo.pdf` → three questions → the reveal.*

> "AI is used only to *read* the statement; the user checks the numbers. Three questions, and here is their retirement: income at 65, how much of today's life it covers, and the days of freedom their savings already buy. All of this is deterministic, tested code, in exact integers. And it's honest: prices in Romania rose 66% in ten years, so we only count growth above inflation."

*Piggy bank → Connect your bank → Open Banking (demo).*

> "They connect their bank through Open Banking. It's read-only: it sees card payments to compute round-ups; it can't move money."

## 1:20 – 2:10 · The monthly loop

*Month tab: three months of payments and the "would have saved" box. Profile → add the test card. Month → Simulate end of month → Yes, add it.*

> "The bank sends the last three months of payments, each rounded up, and the app shows what they would have saved if they'd started earlier. At the end of the month the app suggests an amount for Pillar III. One tap: the payment goes through Stripe (here it is in our Stripe dashboard), and the island levels up. Saving gets an instant, visual reward."

## 2:10 – 2:35 · Why it's different

*Home, spin the island; Profile → Card and bank.*

> "Built for Romania: state pension rules from Law 360/2023, INS inflation and life expectancy, ASF fund returns; every assumption has a source in the code. And two jobs are kept apart: Open Banking only reads, Stripe only charges, and only after the user says yes."

## 2:35 – 3:00 · Business model, limits, next steps

> "Each month's amount stays one month with a partner bank before going to Pillar III; that month's interest keeps the app free, and it's written on every offer. To be transparent: the bank connection is a demo with fictional data, Stripe runs in test mode, and without AI, uploads use clearly labelled sample values or manual entry. Next: a licensed PSD2 provider, a partner bank, and a Pillar III administrator. Thank you!"

## Backup moves

| If… | Do this |
|---|---|
| A PDF isn't read | The manual card opens by itself: type the numbers |
| The bank connection fails | Profile → Update details or add a PDF → `bank-statement-demo.pdf` |
| Stripe fails | "Not this month", then show the Stripe dashboard or the admin panel |
