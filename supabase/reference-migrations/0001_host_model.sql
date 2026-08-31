-- 0001 — Host model
--
-- WHY: the original schema had `profiles.role` as a single value ('traveller' | 'host'),
-- set once at signup and never changeable. In a marketplace the same person is both:
-- a traveller who later lists their own experience. Under the old model they would need
-- a second account. Fix this now, while the tables are empty.
--
-- Host-specific fields also multiply once bookings arrive (payout details, verification,
-- cancellation policy), so they get their own table instead of nullable columns on every
-- traveller row.

begin;

-- ── profiles ────────────────────────────────────────────────────────────────

alter table profiles add column if not exists is_host boolean not null default false;

-- Backfill from the old column, then retire it.
update profiles set is_host = true where role = 'host';

alter table profiles drop constraint if exists profiles_role_check;
alter table profiles drop column if exists role;

-- ── host_profiles ───────────────────────────────────────────────────────────
-- One row per user who has opted into hosting. Created when they publish their
-- first listing, or when they explicitly become a host.

create table if not exists host_profiles (
  id                   uuid primary key references profiles(id) on delete cascade,
  headline             text,
  phone_e164           text,          -- E.164 only, e.g. +919876543210. Never displayed raw.
  phone_country        text,          -- ISO 3166-1 alpha-2, for display formatting
  phone_verified       boolean not null default false,   -- V2: real verification
  verification_status  text not null default 'unverified'
                         check (verification_status in ('unverified','pending','verified','rejected')),
  languages            text[] not null default '{}',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists host_profiles_verification_idx
  on host_profiles(verification_status);

create trigger trg_host_profiles_updated_at
  before update on host_profiles
  for each row execute function fn_update_updated_at();

-- Keep profiles.is_host in sync with the existence of a host_profiles row.
create or replace function fn_sync_is_host()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update profiles set is_host = true where id = new.id;
  elsif tg_op = 'DELETE' then
    update profiles set is_host = false where id = old.id;
  end if;
  return null;
end;
$$;

create trigger trg_sync_is_host
  after insert or delete on host_profiles
  for each row execute function fn_sync_is_host();

-- ── signup trigger: no more role ────────────────────────────────────────────

create or replace function fn_create_profile_on_signup()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

-- ── RLS ─────────────────────────────────────────────────────────────────────
-- Phone numbers are the sensitive part. A plain `select * from host_profiles`
-- by any signed-up user would hand an attacker every host's phone number in one
-- request. So the table itself is not directly readable for contact fields.

alter table host_profiles enable row level security;

-- Public-safe columns only, via a view. Note: phone is absent by construction.
create or replace view host_profiles_public as
  select id, headline, phone_verified, verification_status, languages, created_at
  from host_profiles;

grant select on host_profiles_public to authenticated;

-- Owners can read and write their own full row (including their own phone).
create policy "host_profiles_select_own" on host_profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy "host_profiles_insert_own" on host_profiles
  for insert to authenticated
  with check ((select auth.uid()) = id);

create policy "host_profiles_update_own" on host_profiles
  for update to authenticated
  using ((select auth.uid()) = id);

-- ── Contact reveal ──────────────────────────────────────────────────────────
-- Travellers get a host's phone through this function, not through a select.
-- Every reveal is logged, which gives us rate limiting and abuse detection later
-- without another migration.

create table if not exists contact_reveals (
  id          uuid primary key default gen_random_uuid(),
  viewer_id   uuid not null references profiles(id) on delete cascade,
  host_id     uuid not null references profiles(id) on delete cascade,
  revealed_at timestamptz not null default now()
);

create index if not exists contact_reveals_viewer_time_idx
  on contact_reveals(viewer_id, revealed_at desc);

alter table contact_reveals enable row level security;

create policy "contact_reveals_select_own" on contact_reveals
  for select to authenticated using ((select auth.uid()) = viewer_id);

create or replace function get_host_contact(target_host_id uuid)
returns table (phone_e164 text, phone_country text, phone_verified boolean)
language plpgsql security definer set search_path = public as $$
declare
  viewer uuid := auth.uid();
  recent_count int;
begin
  if viewer is null then
    raise exception 'authentication required';
  end if;

  -- Crude but effective rate limit: 30 reveals per hour per viewer.
  select count(*) into recent_count
  from contact_reveals
  where viewer_id = viewer and revealed_at > now() - interval '1 hour';

  if recent_count >= 30 then
    raise exception 'rate limit exceeded';
  end if;

  -- Only hosts with at least one published experience expose contact details.
  if not exists (
    select 1 from experiences e
    where e.host_id = target_host_id and e.is_published = true
  ) then
    raise exception 'host not available';
  end if;

  insert into contact_reveals (viewer_id, host_id) values (viewer, target_host_id);

  return query
    select hp.phone_e164, hp.phone_country, hp.phone_verified
    from host_profiles hp
    where hp.id = target_host_id;
end;
$$;

revoke all on function get_host_contact(uuid) from public, anon;
grant execute on function get_host_contact(uuid) to authenticated;

commit;
