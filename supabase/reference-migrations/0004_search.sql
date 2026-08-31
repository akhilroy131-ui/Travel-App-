-- 0004 — Search and filters
--
-- THE KEY POINT: once search combines text + geo radius + availability window +
-- category + price + rating, it can no longer be expressed as a chained PostgREST
-- query from the client. `useExperiences` currently builds `.eq().gte().order()`
-- chains; that approach cannot express "open on a date" (needs a join to
-- experience_availability) or relevance ranking. So search becomes ONE RPC.
--
-- This is also better for the Supabase free tier: one round trip instead of
-- several, and the filtering happens where the data is.

begin;

-- ── Full-text ───────────────────────────────────────────────────────────────
-- Weighted so a title match beats a description match.

alter table experiences
  add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(location_name, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'C')
  ) stored;

create index if not exists experiences_search_idx
  on experiences using gin(search_vector);

-- 'simple' rather than 'english': the app is global, and stemming with the wrong
-- language is worse than not stemming. Revisit per-locale configs if search quality
-- becomes a real complaint.

-- Trigram index for fuzzy/typo-tolerant title matching as a fallback.
create extension if not exists pg_trgm;
create index if not exists experiences_title_trgm_idx
  on experiences using gin(title gin_trgm_ops);

-- Composite index covering the common filter combination.
create index if not exists experiences_filter_idx
  on experiences(category, price, avg_rating)
  where is_published = true;

-- ── The search RPC ──────────────────────────────────────────────────────────
-- SECURITY INVOKER on purpose: this runs as the caller, so RLS on `experiences`
-- still applies. (The original get_nearby_experiences used SECURITY DEFINER and
-- granted it to anon, which quietly bypassed RLS. Fixed in 0005.)

create or replace function search_experiences(
  p_query        text            default null,
  p_category     text            default null,
  p_lat          double precision default null,
  p_lng          double precision default null,
  p_radius_km    double precision default null,
  p_price_min    numeric         default null,
  p_price_max    numeric         default null,
  p_min_rating   numeric         default null,
  p_date_from    date            default null,
  p_date_to      date            default null,
  p_sort         text            default 'relevance',
  p_limit        integer         default 20,
  p_offset       integer         default 0
)
returns table (
  id              uuid,
  title           text,
  category        text,
  price           numeric,
  currency        text,
  location_name   text,
  location_lat    double precision,
  location_lng    double precision,
  cover_image_url text,
  avg_rating      numeric,
  review_count    integer,
  save_count      integer,
  host_id         uuid,
  distance_km     double precision,
  next_available  date,
  total_count     bigint
)
language sql stable security invoker set search_path = public as $$
  with ref as (
    select case
      when p_lat is not null and p_lng is not null
      then st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography
    end as pt
  ),
  filtered as (
    select
      e.*,
      case when (select pt from ref) is not null
        then st_distance(e.location_geo, (select pt from ref)) / 1000.0
      end as distance_km,
      (
        select min(a.slot_date)
        from experience_availability a
        where a.experience_id = e.id
          and a.is_blocked = false
          and a.seats_taken < a.capacity
          and a.slot_date >= coalesce(p_date_from, current_date)
          and (p_date_to is null or a.slot_date <= p_date_to)
      ) as next_available,
      case
        when p_query is null or p_query = '' then 0
        else ts_rank(e.search_vector, websearch_to_tsquery('simple', p_query))
      end as rank
    from experiences e
    where e.is_published = true
      and (p_query is null or p_query = ''
           or e.search_vector @@ websearch_to_tsquery('simple', p_query)
           or e.title % p_query)
      and (p_category   is null or e.category = p_category)
      and (p_price_min  is null or e.price >= p_price_min)
      and (p_price_max  is null or e.price <= p_price_max)
      and (p_min_rating is null or e.avg_rating >= p_min_rating)
      and (
        (select pt from ref) is null
        or p_radius_km is null
        or st_dwithin(e.location_geo, (select pt from ref), p_radius_km * 1000)
      )
  ),
  windowed as (
    select f.*, count(*) over () as total_count
    from filtered f
    -- A date filter means "must actually be open then", so drop rows with no slot.
    where (p_date_from is null and p_date_to is null) or f.next_available is not null
  )
  select
    w.id, w.title, w.category, w.price, w.currency,
    w.location_name, w.location_lat, w.location_lng,
    w.cover_image_url, w.avg_rating, w.review_count, w.save_count,
    w.host_id, w.distance_km, w.next_available, w.total_count
  from windowed w
  order by
    case when p_sort = 'distance'  then w.distance_km end asc nulls last,
    case when p_sort = 'price_asc' then w.price end asc,
    case when p_sort = 'price_desc' then w.price end desc,
    case when p_sort = 'rating'    then w.avg_rating end desc,
    case when p_sort = 'newest'    then w.created_at end desc,
    case when p_sort = 'relevance' then w.rank end desc,
    w.created_at desc
  limit greatest(1, least(p_limit, 50))
  offset greatest(0, p_offset);
$$;

grant execute on function search_experiences to authenticated;

-- `total_count` rides along on every row so the client gets pagination metadata
-- without a second count query. Read it from row 0.

commit;
