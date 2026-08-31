-- 0005 — Policy and correctness fixes from the V1 audit
--
-- Four issues, in descending order of how much they matter.

begin;

-- ── 1. Self-review. Ratings were trivially gameable. ────────────────────────
-- The old policy checked only `auth.uid() = author_id`, so a host could review
-- their own listing and the avg_rating trigger would dutifully apply it. On a
-- two-sided marketplace a fakeable rating destroys trust immediately.
-- The real fix is a booking gate; that arrives in V3. This is the interim.

drop policy if exists "reviews_insert" on reviews;

create policy "reviews_insert" on reviews
  for insert to authenticated
  with check (
    (select auth.uid()) = author_id
    and author_id <> (select e.host_id from experiences e where e.id = experience_id)
  );

-- ── 2. The anon RLS bypass. ─────────────────────────────────────────────────
-- get_nearby_experiences was SECURITY DEFINER and granted to anon, so an
-- anonymous caller could read experience rows through the RPC that RLS denied
-- them on the table. Unintentional, and the kind of gap that only shows up when
-- someone goes looking. Make it SECURITY INVOKER so RLS applies.

create or replace function get_nearby_experiences(
  ref_lat   double precision,
  ref_lng   double precision,
  radius_km double precision default 25
)
returns table (
  id           uuid,
  title        text,
  category     text,
  location_lat double precision,
  location_lng double precision,
  price        numeric,
  currency     text,
  avg_rating   numeric
)
language sql stable security invoker set search_path = public as $$
  select
    e.id, e.title, e.category, e.location_lat, e.location_lng,
    e.price, e.currency, e.avg_rating
  from experiences e
  where e.is_published = true
    and st_dwithin(
      e.location_geo,
      st_setsrid(st_makepoint(ref_lng, ref_lat), 4326)::geography,
      radius_km * 1000
    )
  order by e.location_geo <-> st_setsrid(st_makepoint(ref_lng, ref_lat), 4326)::geography
  limit 200;
$$;

revoke all on function get_nearby_experiences(double precision, double precision, double precision)
  from public, anon;
grant execute on function get_nearby_experiences(double precision, double precision, double precision)
  to authenticated;

-- ── 3. Host insert policy: role is gone, and wrap auth.uid(). ───────────────
-- The old policy required `role = 'host'`, a column that no longer exists.
-- The subselect on auth.uid() is a known Supabase RLS performance pattern: without
-- it, the function is re-evaluated per row.

drop policy if exists "experiences_insert" on experiences;

create policy "experiences_insert" on experiences
  for insert to authenticated
  with check (
    (select auth.uid()) = host_id
    and exists (select 1 from host_profiles hp where hp.id = (select auth.uid()))
  );

drop policy if exists "experiences_select" on experiences;
create policy "experiences_select" on experiences
  for select to authenticated
  using (is_published = true or host_id = (select auth.uid()));

drop policy if exists "experiences_update_own" on experiences;
create policy "experiences_update_own" on experiences
  for update to authenticated using ((select auth.uid()) = host_id);

drop policy if exists "experiences_delete_own" on experiences;
create policy "experiences_delete_own" on experiences
  for delete to authenticated using ((select auth.uid()) = host_id);

-- ── 4. Currency. ────────────────────────────────────────────────────────────
-- Defaulting to USD is wrong for a global app: a host in Hyderabad who forgets
-- the field silently lists in dollars. Make it explicit at creation.
-- No FX conversion in V1 — display each listing in its own currency with the code.

alter table experiences alter column currency drop default;
alter table experiences add constraint experiences_currency_iso
  check (currency ~ '^[A-Z]{3}$');

-- Optional, uncomment if you want browse-before-signup:
-- create policy "experiences_select_anon" on experiences
--   for select to anon using (is_published = true);
-- Decide deliberately. It raises conversion but exposes your full catalogue to
-- scrapers, and every competitor gets your supply list for free.

commit;
