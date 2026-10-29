---
title: "Try it in 5 minutes"
description: "A guided tour of the live app with sample inputs."
---

# Try it in 5 minutes

Open **[hackathon-nexxt.vercel.app](https://hackathon-nexxt.vercel.app)**, ideally on a phone or at phone width.

## What you need

| Thing | Value |
|---|---|
| Demo PDFs | in the repo, [`data/demo/`](https://github.com/rarescazan30/hackathon-nexxt/tree/main/data/demo) |
| Three questions | birth year `1992`, net salary `6500`, years worked `12` |
| Open Banking (demo) | bank **Demo Bank**, card last 4 `4821`, any 4-digit code |
| Stripe test card | `4242 4242 4242 4242`, expiry `12/34`, CVC `123` |

## The tour

1. **Landing → Sign up.** Any name and email, a password of 8+ characters.
2. **Your pension documents.** Upload `pillar2-statement-demo.pdf`. The provider, balance and date are filled in; check them, then **Continue**. Have a Pillar III too? Upload `pillar3-statement-demo.pdf` as a second card.
3. **Three questions.** `1992` · `6500` · `12`.
4. **The reveal.** Your island, expected income at 65, how much of today's life it covers, and the days of freedom counting up. You also get a **welcome bonus of 260 XP**.
5. **Piggy bank.** Choose the round-up (5 RON) and salary share (3%), then **Connect your bank** → *Open Banking (demo)*. Tick the terms → **Start saving**.
6. **Month tab.** Card payments from the last 3 months, each with its round-up, and what round-ups would have saved before you joined.
7. **Profile → Card and bank → Add a card.** Use the Stripe test card above.
8. **Month → Simulate end of month → Yes, add it.** The card is charged in Stripe test mode, and **the island levels up** (the welcome bonus makes sure the first month is enough).
9. **Home.** Drag the island to spin it, then **Share my island** for a public link with a preview image.

:::tip Level-up guaranteed
New accounts start at **260 / 300 XP**. With the sample values, any accepted month of **66 RON or more** triggers the level-up pop-up; the month's suggestion (~195 RON) is already enough.
:::

## Things to try on purpose

| Try | What happens |
|---|---|
| Net salary `1` | A friendly error; the button stays off (see [profile limits](../reference/money-rules.md#profile-limits)) |
| `25` years worked at 34 | "At your age, years worked can be from 0 to 18" |
| **Yes, add it** without a saved card | A pop-up asks you to add a card in Profile |
| Upload `bank-statement-demo.pdf` in **Profile → Update details or add a PDF** | "Found 13 transactions… 3 you already had": duplicates from Open Banking are skipped |
| Card `4000 0000 0000 0341` | Saves, but the monthly charge is declined, with a clear message |
| Card `4000 0027 6000 3184` | Asks for 3-D Secure; click *Complete* |
| Log in with the admin account | An **Admin** button leads to the company dashboard |
