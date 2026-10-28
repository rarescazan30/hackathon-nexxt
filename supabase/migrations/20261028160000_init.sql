-- Initial schema for Zile de Libertate.
-- Conventions: money in bani (bigint, 450000 = 4.500 lei), percentages in basis
-- points (300 = 3%), months as 'YYYY-MM'. Days of freedom and projections are NOT
-- stored: lib/rules computes them from these tables.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.risk_level as enum ('low', 'medium', 'high');
create type public.product_type as enum ('pillar3', 'etf', 'bonds_fund', 'deposit');
create type public.asset_type as enum ('pillar2', 'pillar3', 'deposit', 'bonds', 'etf');
create type public.jar_status as enum ('open', 'proposed', 'confirmed', 'collected', 'failed');
create type public.proposal_status as enum ('pending', 'accepted', 'changed', 'declined');

-- ---------------------------------------------------------------------------
-- Reference data: investment products and their historical unit prices
-- ---------------------------------------------------------------------------

create table public.products (
    id text primary key,                 -- e.g. 'pillar3_nn', 'etf_bet', 'bonds_fund'
    name text not null,
    type public.product_type not null,
    risk_level public.risk_level not null,
    provider text,
    description text,
    source_url text
);

create table public.product_prices (
    product_id text not null references public.products (id) on delete cascade,
    date date not null,
    unit_price_bani bigint not null check (unit_price_bani > 0),
    primary key (product_id, date)
);

-- ---------------------------------------------------------------------------
-- User data
-- ---------------------------------------------------------------------------

-- One row per user, created automatically on sign-up, filled in by onboarding.
create table public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    full_name text,
    birth_year int check (birth_year between 1940 and 2010),
    gross_salary_bani bigint check (gross_salary_bani >= 0),
    years_worked int check (years_worked between 0 and 60),
    retirement_age int not null default 65 check (retirement_age between 50 and 75),
    risk_level public.risk_level,        -- null until onboarding is done
    risk_answers jsonb,                  -- raw answers to the suitability questions
    roundup_rule_bani int not null default 100 check (roundup_rule_bani in (100, 500, 1000)),
    salary_percent_bp int not null default 0 check (salary_percent_bp between 0 and 2000),
    monthly_cap_bani bigint check (monthly_cap_bani > 0),
    card_linked boolean not null default false,
    onboarding_completed boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- What the user already has: "all your pension in one place".
create table public.pension_assets (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    type public.asset_type not null,
    provider text,
    balance_bani bigint not null check (balance_bani >= 0),
    units numeric(18, 6),                -- fund units owned; not money
    source text not null check (source in ('statement_upload', 'manual')),
    as_of date not null,
    created_at timestamptz not null default now()
);

-- Bank transactions (mock, NextGenPSD2 shape). Negative = money out.
create table public.transactions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    external_id text not null,           -- transactionId from the bank
    booked_at date not null,
    amount_bani bigint not null,
    currency text not null default 'RON',
    counterparty text,
    description text,
    is_card_payment boolean not null default false,
    created_at timestamptz not null default now(),
    unique (user_id, external_id)
);

-- One round-up per card payment (computed by lib/rules roundUp()).
create table public.roundups (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    transaction_id uuid not null unique references public.transactions (id) on delete cascade,
    month text not null check (month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
    amount_bani bigint not null check (amount_bani >= 0),
    created_at timestamptz not null default now()
);

-- One jar per user per month: round-ups + salary share, collected at month end.
create table public.monthly_jars (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    month text not null check (month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
    roundups_bani bigint not null default 0 check (roundups_bani >= 0),
    salary_bani bigint not null default 0 check (salary_bani >= 0),
    total_bani bigint not null default 0 check (total_bani >= 0),  -- after the monthly cap
    status public.jar_status not null default 'open',
    stripe_payment_intent_id text,
    collected_at timestamptz,
    created_at timestamptz not null default now(),
    unique (user_id, month)
);

-- The AI agent's monthly proposal. Amounts come from lib/rules allocate(),
-- only the explanation text comes from the model.
create table public.agent_proposals (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    jar_id uuid not null references public.monthly_jars (id) on delete cascade,
    allocation jsonb not null,           -- [{ "product_id": "etf_bet", "amount_bani": 6900 }, ...]
    explanation text,
    status public.proposal_status not null default 'pending',
    user_message text,                   -- what the user asked to change, if anything
    created_at timestamptz not null default now()
);

-- Simulated investments, created after a jar is collected.
create table public.orders (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    jar_id uuid references public.monthly_jars (id) on delete set null,
    product_id text not null references public.products (id),
    amount_bani bigint not null check (amount_bani > 0),
    unit_price_bani bigint not null check (unit_price_bani > 0),
    units numeric(18, 6) not null,
    executed_at timestamptz not null default now()
);

create index on public.pension_assets (user_id);
create index on public.transactions (user_id, booked_at);
create index on public.roundups (user_id, month);
create index on public.agent_proposals (user_id, created_at);
create index on public.orders (user_id, executed_at);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- Create an empty profile whenever someone signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.profiles (id, full_name)
    values (new.id, new.raw_user_meta_data ->> 'full_name');
    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger profiles_set_updated_at
    before update on public.profiles
    for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security: a user only ever sees their own rows.
-- Writes the user does themselves (onboarding, manual assets, answering a
-- proposal) are allowed here; everything else (round-ups, jars, orders) is
-- written by the server with the secret key, which bypasses RLS.
-- ---------------------------------------------------------------------------

alter table public.products enable row level security;
alter table public.product_prices enable row level security;
alter table public.profiles enable row level security;
alter table public.pension_assets enable row level security;
alter table public.transactions enable row level security;
alter table public.roundups enable row level security;
alter table public.monthly_jars enable row level security;
alter table public.agent_proposals enable row level security;
alter table public.orders enable row level security;

create policy "products are readable" on public.products
    for select to authenticated using (true);
create policy "prices are readable" on public.product_prices
    for select to authenticated using (true);

create policy "own profile: read" on public.profiles
    for select to authenticated using (id = (select auth.uid()));
create policy "own profile: update" on public.profiles
    for update to authenticated
    using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "own assets: all" on public.pension_assets
    for all to authenticated
    using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "own transactions: read" on public.transactions
    for select to authenticated using (user_id = (select auth.uid()));
create policy "own roundups: read" on public.roundups
    for select to authenticated using (user_id = (select auth.uid()));
create policy "own jars: read" on public.monthly_jars
    for select to authenticated using (user_id = (select auth.uid()));

create policy "own proposals: read" on public.agent_proposals
    for select to authenticated using (user_id = (select auth.uid()));
create policy "own proposals: answer" on public.agent_proposals
    for update to authenticated
    using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "own orders: read" on public.orders
    for select to authenticated using (user_id = (select auth.uid()));
