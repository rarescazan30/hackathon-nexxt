-- Plan v2.1 (docs/plan-qol.md), phases 3 and 4.

-- Phase 3: the level never goes down. The starting level is remembered here and only
-- ever raised (new statement, higher salary). Null = not stored yet: computed on the fly.
alter table public.profiles
    add column start_level int check (start_level between 1 and 20);

-- Phase 4: "Share my island". One public card per user: first name, level and the scene.
-- Written and read only by the server (admin client) after checking the session;
-- the owner can read their own row.
create table public.share_links (
    code text primary key,               -- short random id used in /i/<code>
    user_id uuid not null unique references public.profiles (id) on delete cascade,
    first_name text not null,
    level int not null check (level between 1 and 20),
    slots jsonb not null,                -- { home, transport, food, extras } tiers
    image_path text,                     -- island snapshot in the share-images bucket
    updated_at timestamptz not null default now()
);

alter table public.share_links enable row level security;

create policy "own share link: read" on public.share_links
    for select to authenticated using (user_id = (select auth.uid()));

create trigger share_links_set_updated_at
    before update on public.share_links
    for each row execute function public.set_updated_at();

-- Public bucket, so WhatsApp / LinkedIn can fetch the preview image. It only ever holds
-- island pictures (PNG, max 1 MB), uploaded by the server.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('share-images', 'share-images', true, 1048576, array['image/png'])
on conflict (id) do nothing;
