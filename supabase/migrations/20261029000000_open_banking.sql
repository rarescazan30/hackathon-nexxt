-- Plan v2.3 (docs/plan-v2.3.md): the "Open Banking (demo)" connection remembers which
-- bank and which card the user picked (last 4 digits only), like a real PSD2 consent.
alter table public.profiles
    add column bank_name text,
    add column bank_card_last4 text check (bank_card_last4 ~ '^[0-9]{4}$');
