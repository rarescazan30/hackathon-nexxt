---
title: "Data model"
description: "The Supabase tables, how they relate, and the storage buckets."
---

# Data model

All tables live in Supabase Postgres and are created by the migrations in `supabase/migrations/` (applied in order with `npx supabase db push`). Money columns end in `_bani` and hold integers.

```mermaid
erDiagram
  profiles ||--o{ pension_assets : has
  profiles ||--o{ transactions : has
  profiles ||--o{ monthly_jars : has
  profiles ||--o{ statement_uploads : uploads
  profiles ||--o| share_links : shares
  transactions ||--o{ roundups : gives
  monthly_jars ||--o{ orders : "invested as"
  products ||--o{ product_prices : priced
  products ||--o{ orders : bought

  profiles {
    uuid id PK
    text full_name
    int birth_year
    bigint net_salary_bani
    int years_worked
    int roundup_rule_bani
    int salary_percent_bp
    bool card_linked
    text bank_name
    text bank_card_last4
    int start_level
    int last_seen_level
    int welcome_bonus_xp
    text stripe_customer_id
    text card_brand
    text card_last4
  }
  monthly_jars {
    uuid id PK
    text month
    jar_status status
    bigint roundups_bani
    bigint salary_bani
    bigint total_bani
    bigint accepted_amount_bani
    bigint float_interest_bani
    text payment_status
  }
  transactions {
    uuid id PK
    text external_id
    date booked_at
    bigint amount_bani
    text counterparty
    bool is_card_payment
  }
```

## Tables

| Table | One row is… | Written by |
|---|---|---|
| `profiles` | a user: answers, settings, levels, bank and card info | onboarding, Profile, actions |
| `pension_assets` | a Pillar II / III balance on a date | onboarding, Profile |
| `transactions` | a bank transaction (mock bank or a bank-statement PDF) | server |
| `roundups` | the round-up of one card payment in one month | server (`rebuildJar`) |
| `monthly_jars` | one month's counter and what happened to it | server (money flow) |
| `orders` | Pillar III fund units bought for a month | server (`investJar`) |
| `products`, `product_prices` | the Pillar III product and its unit prices | seed |
| `statement_uploads` | an uploaded PDF and what the AI read | server |
| `share_links` | a public "shared island" card | server |
| `stripe_events` | a Stripe webhook already handled | webhook |

## A month's life: `monthly_jars.status`

```mermaid
stateDiagram-v2
  [*] --> open: month starts
  open --> offered: month end (offer + message)
  offered --> accepted: Yes (amount chosen)
  offered --> declined: Not this month
  accepted --> collected: money taken (Stripe), held by partner
  collected --> invested: one month later → Pillar III units, interest recorded
  declined --> [*]
  invested --> [*]
```

`open` and `offered` months are recalculated whenever payments or settings change; answered months never change.

## Storage buckets

| Bucket | Public? | Holds |
|---|---|---|
| `statements` | private | uploaded PDFs, in a folder per user (`<userId>/…`) |
| `share-images` | public | the PNG preview of a shared island (needed by WhatsApp / LinkedIn) |

## Migrations, in order

| File | Adds |
|---|---|
| `…160000_init.sql` | core tables, enums, row-level security |
| `…190000_align_with_rules_and_ui.sql` | round-up options, allocation fixes |
| `…210000_lifestyle_app.sql` | the lifestyle app: jar statuses, offers, uploads, `statements` bucket |
| `…230000_qol_start_level_and_sharing.sql` | `start_level`, `share_links`, `share-images` bucket |
| `…240000_stripe_card.sql` | card columns, `payment_status`, `stripe_events` |
| `…000000_open_banking.sql` | bank name + card last 4 |
| `…001000_bank_statements.sql` | uploads of kind `bank` |
| `…100000_welcome_bonus_xp.sql` | `welcome_bonus_xp` |

After a schema change, regenerate the types: `npx supabase gen types typescript --linked > lib/supabase/database.types.ts`.
