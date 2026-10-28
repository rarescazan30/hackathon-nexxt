-- Plan v2.2 (docs/plan-v2.2.md), step 3: pay the monthly amount with a card (Stripe, test mode).
-- We never store card numbers or CVCs: Stripe keeps the card, we keep its id + brand + last 4.

alter table public.profiles
    add column stripe_customer_id text,
    add column stripe_payment_method_id text,
    add column card_brand text,                                   -- 'visa', 'mastercard', ...
    add column card_last4 text check (card_last4 ~ '^[0-9]{4}$');

-- How the month's amount was paid. stripe_payment_intent_id already exists on monthly_jars.
alter table public.monthly_jars
    add column payment_status text check (payment_status in ('pending', 'succeeded', 'failed'));

create index on public.monthly_jars (stripe_payment_intent_id);

-- Stripe sends the same webhook more than once: we remember each event id and skip repeats.
-- Server only (RLS on, no policies).
create table public.stripe_events (
    id text primary key,                 -- evt_...
    type text not null,
    received_at timestamptz not null default now()
);

alter table public.stripe_events enable row level security;
