-- Plan v2 (docs/plan.md): retirement lifestyle app.
-- One product (Pillar III), no risk profile, the monthly jar is the offer,
-- money is held one month before it is invested, PDF statements are stored.

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

-- People know their net salary, not their gross one.
alter table public.profiles rename column gross_salary_bani to net_salary_bani;

-- No risk profile any more: the only product is Pillar III.
alter table public.profiles drop column risk_level;
alter table public.profiles drop column risk_answers;

-- Highest level the user has already seen, so the app knows when to play the level-up.
alter table public.profiles
    add column last_seen_level int not null default 0 check (last_seen_level between 0 and 20);

-- When the user accepted the terms (one-month hold, interest kept by us).
alter table public.profiles add column terms_accepted_at timestamptz;

-- ---------------------------------------------------------------------------
-- Monthly jar = the monthly offer
-- open → offered → accepted | declined → collected → invested (or failed)
-- ---------------------------------------------------------------------------

alter type public.jar_status rename value 'proposed' to 'offered';
alter type public.jar_status rename value 'confirmed' to 'accepted';
alter type public.jar_status add value 'declined';
alter type public.jar_status add value 'invested';

alter table public.monthly_jars
    add column offer_message text,                               -- written by the AI
    add column accepted_amount_bani bigint check (accepted_amount_bani >= 0),
    add column invest_on date,                                   -- collected + one month
    add column invested_at timestamptz,
    add column float_interest_bani bigint not null default 0 check (float_interest_bani >= 0);

-- The proposal lives on the jar now.
drop table public.agent_proposals;

-- ---------------------------------------------------------------------------
-- Uploaded pension statements (PDF) and what the AI read from them
-- ---------------------------------------------------------------------------

create table public.statement_uploads (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    file_path text not null,                -- in the "statements" bucket: <userId>/<file>
    kind text check (kind in ('pillar2', 'pillar3')),
    status text not null default 'uploaded'
        check (status in ('uploaded', 'extracted', 'confirmed', 'failed')),
    extracted jsonb,                        -- StatementExtract from lib/ai
    error text,
    created_at timestamptz not null default now()
);

create index on public.statement_uploads (user_id);

alter table public.statement_uploads enable row level security;

create policy "own statements: read" on public.statement_uploads
    for select to authenticated using (user_id = (select auth.uid()));
create policy "own statements: add" on public.statement_uploads
    for insert to authenticated with check (user_id = (select auth.uid()));

-- Private bucket; each user only reaches files under their own <userId>/ folder.
insert into storage.buckets (id, name, public)
values ('statements', 'statements', false)
on conflict (id) do nothing;

create policy "own statement files: read" on storage.objects
    for select to authenticated
    using (bucket_id = 'statements' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "own statement files: upload" on storage.objects
    for insert to authenticated
    with check (bucket_id = 'statements' and (storage.foldername(name))[1] = (select auth.uid())::text);
