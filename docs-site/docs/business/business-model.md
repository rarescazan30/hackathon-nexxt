---
title: "Business model"
description: "How LifeGrowth makes money, in plain numbers."
---

# Business model

> Each month's amount stays **one month** with a partner bank before it goes to the user's Pillar III. **That month's interest** is LifeGrowth's revenue. The user never pays a fee.

It's written in the [terms](https://hackathon-nexxt.vercel.app/terms), in the onboarding checkbox and on every month-end offer.

## The numbers

Interest on one month: `amount × 5% × 30 ÷ 365` (`floatInterestBani()`).

| Savers | Average month | Revenue / month | Revenue / year |
|---|---|---|---|
| 1 | 500 RON | ≈ 2 RON | ≈ 25 RON |
| 1,000 | 500 RON | ≈ 2,050 RON | ≈ 25,000 RON |
| 10,000 | 600 RON | ≈ 24,700 RON | ≈ 296,000 RON |
| 100,000 | 600 RON | ≈ 247,000 RON | ≈ 2.96 M RON |

The admin dashboard computes the same thing from real data ([Admin dashboard](../features/admin.md)).

## Why it works for the user

- **Free**: no subscription, no fee.
- **The full amount** they confirm reaches Pillar III.
- **The cost**: their money reaches the fund one month later, which costs very little growth on a monthly contribution, and we say so.
- **Pillar III is tax-deductible** up to 400 €/year, which a December hold can shift into the next year; we tell the user.

## Why it can grow

- A **habit loop** (round-ups → one tap a month → visible reward) instead of a one-off decision.
- **Shareable** progress ("Share my island") as organic acquisition.
- **Partnership value**: money brought to Pillar III matters to pension administrators and banks, beyond the interest.

## Honest caveats

- One month of interest per contribution is small; the model needs scale.
- Interest rates change; 5% is an assumption.
- A partner may keep part of the interest.
