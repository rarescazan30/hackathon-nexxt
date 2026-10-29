---
title: "Admin dashboard"
description: "The company view: revenue, money held, savers and growth."
---

# Admin dashboard

`/admin`, visible only to the account whose email is `ADMIN_EMAIL` (an **Admin** button appears on Home and Profile; anyone else gets a 404). Totals only, never names. Data: `lib/data/admin-stats.ts`.

## What it shows

| Number | How it's computed |
|---|---|
| **Revenue this month** | interest earned on money that went on to Pillar III this month |
| **Annual run-rate** | this month × 12 |
| **Money held now** | accepted and collected months not yet in Pillar III |
| **Savers** | people who added money at least once, with new members this month and growth vs last month |
| **Brought to Pillar III** | everything added through LifeGrowth |
| **Average month** | average accepted amount, and the share of offers accepted |
| **Revenue per saver** | annual run-rate ÷ savers |
| Charts | members, money added and revenue per month (up to the current month) |
| **Projection** | "if we had N users": N × average month × acceptance × 5% ÷ 12 |

## Demo data

`npm run seed:demo-users` adds **338 fictional savers** (January–October 2026, growing every month): net salaries 5,500–14,000 RON, 4–6% of salary plus round-ups saved, ~93% of offers accepted, some adding more than suggested. `npm run seed:demo-users -- --remove` deletes them. Their emails are `saver-NNN@lifegrowth.test`; nobody can log in as them.

:::note Honest numbers
One month of interest on a monthly contribution is small (5% a year for ~30 days). The dashboard doesn't inflate the rate; what stands out is the money brought to Pillar III, the growth and the projection.
:::
