-- Aligns the schema with lib/rules (Ana) and the Profil screen (Razvan).

-- Round-up: allow "Oprit" (0 = off) next to 1 / 5 / 10 lei.
alter table public.profiles
    drop constraint profiles_roundup_rule_bani_check;
alter table public.profiles
    add constraint profiles_roundup_rule_bani_check
    check (roundup_rule_bani in (0, 100, 500, 1000));

-- Round-up multiplier from the Profil screen (×1 / ×2 / ×3), passed to roundUp().
alter table public.profiles
    add column roundup_multiplier smallint not null default 1
    check (roundup_multiplier in (1, 2, 3));

-- Government bonds (Fidelis / Tezaur) are not a fund.
alter type public.product_type rename value 'bonds_fund' to 'gov_bonds';

comment on column public.products.id is
    'Same ids as lib/rules PRODUCT_CATALOG: pillar3, etfBet, govBonds';

-- Same shape as allocate().breakdown, trimmed:
-- [{ "productId": "etfBet", "amountBani": 6900, "percentage": 30 }, ...]
alter table public.agent_proposals
    add constraint agent_proposals_allocation_is_array
    check (jsonb_typeof(allocation) = 'array');
comment on column public.agent_proposals.allocation is
    '[{ productId, amountBani, percentage }] from lib/rules allocate().breakdown';
