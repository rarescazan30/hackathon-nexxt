-- Welcome bonus: new accounts start close to their first level-up, so the first month
-- they say yes to upgrades their island (docs/DEMO_SCRIPT.md). Set by onboarding;
-- existing users (and the seeded test user) keep 0.
alter table public.profiles
    add column welcome_bonus_xp int not null default 0 check (welcome_bonus_xp >= 0);
