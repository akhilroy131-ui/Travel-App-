-- Move extension-owned objects out of the exposed public schema and address
-- database-advisor findings from the initial empty-database verification.

begin;

-- PostGIS is not relocatable after installation. The project has no data yet, so
-- remove the small set of application dependencies, reinstall it correctly, and
-- recreate those dependencies with schema-qualified extension calls.
drop function if exists public.search_experiences(
  text, text, double precision, double precision, double precision,
  numeric, numeric, numeric, date, date, text, integer, integer
);
drop function if exists public.get_nearby_experiences(
  double precision, double precision, double precision
);
drop index if exists public.experiences_location_geo_idx;
drop index if exists public.experiences_title_trgm_idx;
alter table public.experiences drop column location_geo;

drop extension postgis;
drop extension pg_trgm;
create schema if not exists extensions;
create extension postgis with schema extensions;
create extension pg_trgm with schema extensions;

alter table public.experiences
  add column location_geo extensions.geography(Point, 4326)
  generated always as (
    extensions.st_setsrid(
      extensions.st_makepoint(location_lng, location_lat), 4326
    )::extensions.geography
  ) stored;

create index experiences_location_geo_idx
  on public.experiences using gist(location_geo);
create index experiences_title_trgm_idx
  on public.experiences using gin(title extensions.gin_trgm_ops);

create or replace function public.get_nearby_experiences(
  ref_lat double precision,
  ref_lng double precision,
  radius_km double precision default 25
)
returns table (
  id uuid, title text, category text, location_lat double precision,
  location_lng double precision, price numeric, currency text, avg_rating numeric
)
language sql stable security invoker set search_path = '' as $$
  select e.id, e.title, e.category, e.location_lat, e.location_lng,
         e.price, e.currency, e.avg_rating
  from public.experiences e
  where e.is_published = true
    and extensions.st_dwithin(
      e.location_geo,
      extensions.st_setsrid(
        extensions.st_makepoint(ref_lng, ref_lat), 4326
      )::extensions.geography,
      greatest(radius_km, 0) * 1000
    )
  order by e.location_geo operator(extensions.<->) extensions.st_setsrid(
    extensions.st_makepoint(ref_lng, ref_lat), 4326
  )::extensions.geography
  limit 200;
$$;

create or replace function public.search_experiences(
  p_query text default null,
  p_category text default null,
  p_lat double precision default null,
  p_lng double precision default null,
  p_radius_km double precision default null,
  p_price_min numeric default null,
  p_price_max numeric default null,
  p_min_rating numeric default null,
  p_date_from date default null,
  p_date_to date default null,
  p_sort text default 'relevance',
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid, title text, category text, price numeric, currency text,
  location_name text, location_lat double precision, location_lng double precision,
  cover_image_url text, avg_rating numeric, review_count integer, save_count integer,
  host_id uuid, distance_km double precision, next_available date, total_count bigint
)
language sql stable security invoker set search_path = '' as $$
  with ref as (
    select case when p_lat is not null and p_lng is not null
      then extensions.st_setsrid(
        extensions.st_makepoint(p_lng, p_lat), 4326
      )::extensions.geography end as pt
  ), filtered as (
    select e.*,
      case when (select pt from ref) is not null
        then extensions.st_distance(e.location_geo, (select pt from ref)) / 1000.0
      end as distance_km,
      (select min(a.slot_date) from public.experience_availability a
       where a.experience_id = e.id and not a.is_blocked and a.seats_taken < a.capacity
         and a.slot_date >= coalesce(p_date_from, current_date)
         and (p_date_to is null or a.slot_date <= p_date_to)) as next_available,
      case when p_query is null or p_query = '' then 0
        else ts_rank(e.search_vector, websearch_to_tsquery('simple', p_query)) end as rank
    from public.experiences e
    where e.is_published = true
      and (p_query is null or p_query = ''
        or e.search_vector @@ websearch_to_tsquery('simple', p_query)
        or extensions.similarity(e.title, p_query) > 0.3)
      and (p_category is null or e.category = p_category)
      and (p_price_min is null or e.price >= p_price_min)
      and (p_price_max is null or e.price <= p_price_max)
      and (p_min_rating is null or e.avg_rating >= p_min_rating)
      and ((select pt from ref) is null or p_radius_km is null
        or extensions.st_dwithin(
          e.location_geo, (select pt from ref), greatest(p_radius_km, 0) * 1000
        ))
  ), windowed as (
    select f.*, count(*) over () as total_count from filtered f
    where (p_date_from is null and p_date_to is null) or f.next_available is not null
  )
  select w.id, w.title, w.category, w.price, w.currency, w.location_name,
         w.location_lat, w.location_lng, w.cover_image_url, w.avg_rating,
         w.review_count, w.save_count, w.host_id, w.distance_km,
         w.next_available, w.total_count
  from windowed w
  order by
    case when p_sort = 'distance' then w.distance_km end asc nulls last,
    case when p_sort = 'price_asc' then w.price end asc,
    case when p_sort = 'price_desc' then w.price end desc,
    case when p_sort = 'rating' then w.avg_rating end desc,
    case when p_sort = 'newest' then w.created_at end desc,
    case when p_sort = 'relevance' then w.rank end desc,
    w.created_at desc
  limit greatest(1, least(p_limit, 50)) offset greatest(0, p_offset);
$$;

revoke all on function public.get_nearby_experiences(
  double precision, double precision, double precision
) from public, anon;
revoke all on function public.search_experiences(
  text, text, double precision, double precision, double precision,
  numeric, numeric, numeric, date, date, text, integer, integer
) from public, anon;
grant usage on schema extensions to authenticated;
grant execute on function public.get_nearby_experiences(
  double precision, double precision, double precision
) to authenticated;
grant execute on function public.search_experiences(
  text, text, double precision, double precision, double precision,
  numeric, numeric, numeric, date, date, text, integer, integer
) to authenticated;

-- Cover every foreign key used for joins or cascade checks.
create index contact_reveals_host_idx on public.contact_reveals(host_id);
create index exp_avail_source_rule_idx on public.experience_availability(source_rule_id);
create index experience_photos_uploaded_by_idx on public.experience_photos(uploaded_by);
create index post_likes_user_idx on public.post_likes(user_id);
create index posts_experience_idx on public.posts(experience_id);
create index reviews_author_idx on public.reviews(author_id);
create index reviews_booking_idx on public.reviews(booking_id);

-- Avoid overlapping SELECT policies while retaining host write access.
drop policy experience_availability_write_own on public.experience_availability;
create policy experience_availability_insert_own on public.experience_availability
  for insert to authenticated with check (exists (
    select 1 from public.experiences e
    where e.id = experience_id and e.host_id = (select auth.uid())
  ));
create policy experience_availability_update_own on public.experience_availability
  for update to authenticated using (exists (
    select 1 from public.experiences e
    where e.id = experience_id and e.host_id = (select auth.uid())
  )) with check (exists (
    select 1 from public.experiences e
    where e.id = experience_id and e.host_id = (select auth.uid())
  ));
create policy experience_availability_delete_own on public.experience_availability
  for delete to authenticated using (exists (
    select 1 from public.experiences e
    where e.id = experience_id and e.host_id = (select auth.uid())
  ));

commit;
