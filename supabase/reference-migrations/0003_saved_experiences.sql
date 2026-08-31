-- 0003 — Saved / wishlist
--
-- V1 is a single flat list per user, matching the existing `post_likes` shape
-- (composite PK, trigger-maintained counter). Named collections ("Goa trip",
-- "Someday") are a V2 extension: add a `collections` table and a nullable
-- `collection_id` here. Designed so that change is additive.

begin;

create table if not exists saved_experiences (
  user_id       uuid not null references profiles(id) on delete cascade,
  experience_id uuid not null references experiences(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (user_id, experience_id)
);

-- Ordering a user's own wishlist newest-first is the only read pattern in V1.
create index if not exists saved_user_time_idx
  on saved_experiences(user_id, created_at desc);

-- Counting saves per experience (for the search ranking signal).
create index if not exists saved_experience_idx
  on saved_experiences(experience_id);

alter table experiences add column if not exists save_count integer not null default 0;

create or replace function fn_update_experience_save_count()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  e_id uuid := coalesce(new.experience_id, old.experience_id);
begin
  update experiences
  set save_count = (select count(*) from saved_experiences where experience_id = e_id)
  where id = e_id;
  return null;
end;
$$;

create trigger trg_update_experience_save_count
  after insert or delete on saved_experiences
  for each row execute function fn_update_experience_save_count();

-- ── RLS ─────────────────────────────────────────────────────────────────────
-- A wishlist is private. Unlike likes, nobody else can read yours — seeing who
-- saved what is a social feature we have not designed and should not leak by default.

alter table saved_experiences enable row level security;

create policy "saved_select_own" on saved_experiences
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "saved_insert_own" on saved_experiences
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "saved_delete_own" on saved_experiences
  for delete to authenticated using ((select auth.uid()) = user_id);

commit;
