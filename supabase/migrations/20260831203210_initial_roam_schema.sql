-- Roam fresh-project schema.
-- This migration is intentionally consolidated because the original 0001-0005
-- chain was written as a transition from a database that no longer exists.

begin;

create extension if not exists postgis;
create extension if not exists pg_trgm;

-- ── Core identities ────────────────────────────────────────────────────────

create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  is_host      boolean not null default false,
  display_name text not null check (char_length(display_name) between 1 and 100),
  avatar_url   text,
  bio          text check (bio is null or char_length(bio) <= 1000),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.host_profiles (
  id                  uuid primary key references public.profiles(id) on delete cascade,
  headline            text check (headline is null or char_length(headline) <= 200),
  phone_verified      boolean not null default false,
  verification_status text not null default 'unverified'
                        check (verification_status in ('unverified', 'pending', 'verified', 'rejected')),
  languages           text[] not null default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Phone data is physically separated so a broad host profile SELECT can never leak it.
create table public.host_contacts (
  host_id       uuid primary key references public.host_profiles(id) on delete cascade,
  phone_e164    text check (phone_e164 is null or phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  phone_country text check (phone_country is null or phone_country ~ '^[A-Z]{2}$'),
  updated_at    timestamptz not null default now()
);

-- ── Marketplace content ────────────────────────────────────────────────────

create table public.experiences (
  id               uuid primary key default gen_random_uuid(),
  host_id          uuid not null references public.profiles(id) on delete cascade,
  title            text not null check (char_length(title) between 1 and 160),
  description      text not null default '',
  category         text not null check (category in (
                       'food_drink',
                       'adventure_outdoors',
                       'culture_history',
                       'wellness_mindfulness'
                     )),
  price            numeric(10,2) not null check (price >= 0),
  currency         text not null check (currency ~ '^[A-Z]{3}$'),
  location_lat     double precision not null check (location_lat between -90 and 90),
  location_lng     double precision not null check (location_lng between -180 and 180),
  location_name    text not null,
  location_geo     geography(Point, 4326) generated always as (
                       st_setsrid(st_makepoint(location_lng, location_lat), 4326)::geography
                     ) stored,
  cover_image_url  text,
  is_published     boolean not null default false,
  avg_rating       numeric(3,2) not null default 0 check (avg_rating between 0 and 5),
  review_count     integer not null default 0 check (review_count >= 0),
  save_count       integer not null default 0 check (save_count >= 0),
  max_guests       integer check (max_guests is null or max_guests > 0),
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  search_vector    tsvector generated always as (
                       setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
                       setweight(to_tsvector('simple', coalesce(location_name, '')), 'B') ||
                       setweight(to_tsvector('simple', coalesce(description, '')), 'C')
                     ) stored,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.experience_photos (
  id            uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experiences(id) on delete cascade,
  url           text not null,
  display_order integer not null default 0 check (display_order >= 0),
  uploaded_by   uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);

-- V3-ready table; no booking/payment UI is exposed in V1.
create table public.bookings (
  id                uuid primary key default gen_random_uuid(),
  experience_id     uuid not null references public.experiences(id) on delete restrict,
  traveller_id      uuid not null references public.profiles(id) on delete restrict,
  status            text not null default 'pending'
                      check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  booked_date       date not null,
  guest_count       integer not null default 1 check (guest_count > 0),
  total_price       numeric(10,2) not null check (total_price >= 0),
  payment_intent_id text,
  payment_status    text not null default 'unpaid'
                      check (payment_status in ('unpaid', 'paid', 'refunded')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table public.reviews (
  id            uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experiences(id) on delete cascade,
  author_id     uuid not null references public.profiles(id) on delete cascade,
  rating        smallint not null check (rating between 1 and 5),
  body          text check (body is null or char_length(body) <= 5000),
  booking_id    uuid references public.bookings(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (experience_id, author_id)
);

create table public.posts (
  id             uuid primary key default gen_random_uuid(),
  author_id      uuid not null references public.profiles(id) on delete cascade,
  experience_id  uuid references public.experiences(id) on delete set null,
  tagged_host_id uuid references public.profiles(id) on delete set null,
  image_url      text not null,
  caption        text check (caption is null or char_length(caption) <= 2200),
  like_count     integer not null default 0 check (like_count >= 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.post_likes (
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- ── Availability and wishlist ──────────────────────────────────────────────

create table public.availability_rules (
  id            uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experiences(id) on delete cascade,
  weekdays      smallint[] not null,
  start_time    time,
  capacity      integer not null default 1 check (capacity > 0),
  valid_from    date not null,
  valid_to      date not null,
  created_at    timestamptz not null default now(),
  check (valid_to >= valid_from),
  check (array_length(weekdays, 1) between 1 and 7),
  check (weekdays <@ array[0,1,2,3,4,5,6]::smallint[])
);

create table public.experience_availability (
  id             uuid primary key default gen_random_uuid(),
  experience_id  uuid not null references public.experiences(id) on delete cascade,
  slot_date      date not null,
  start_time     time,
  capacity       integer not null default 1 check (capacity > 0),
  seats_taken    integer not null default 0 check (seats_taken >= 0),
  price_override numeric(10,2) check (price_override is null or price_override >= 0),
  is_blocked     boolean not null default false,
  source_rule_id uuid references public.availability_rules(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique nulls not distinct (experience_id, slot_date, start_time),
  check (seats_taken <= capacity)
);

create table public.saved_experiences (
  user_id       uuid not null references public.profiles(id) on delete cascade,
  experience_id uuid not null references public.experiences(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (user_id, experience_id)
);

create table public.contact_reveals (
  id          uuid primary key default gen_random_uuid(),
  viewer_id   uuid not null references public.profiles(id) on delete cascade,
  host_id     uuid not null references public.host_profiles(id) on delete cascade,
  revealed_at timestamptz not null default now()
);

-- ── Indexes ────────────────────────────────────────────────────────────────

create index experiences_host_id_idx on public.experiences(host_id);
create index experiences_category_idx on public.experiences(category);
create index experiences_published_idx on public.experiences(is_published);
create index experiences_location_geo_idx on public.experiences using gist(location_geo);
create index experiences_search_idx on public.experiences using gin(search_vector);
create index experiences_title_trgm_idx on public.experiences using gin(title gin_trgm_ops);
create index experiences_filter_idx on public.experiences(category, price, avg_rating)
  where is_published = true;
create index experience_photos_exp_idx on public.experience_photos(experience_id, display_order);
create index bookings_traveller_idx on public.bookings(traveller_id, created_at desc);
create index bookings_experience_idx on public.bookings(experience_id, booked_date);
create index reviews_experience_idx on public.reviews(experience_id, created_at desc);
create index posts_author_idx on public.posts(author_id, created_at desc);
create index posts_tagged_host_idx on public.posts(tagged_host_id, created_at desc);
create index availability_rules_exp_idx on public.availability_rules(experience_id);
create index exp_avail_lookup_idx on public.experience_availability(experience_id, slot_date);
create index exp_avail_open_idx on public.experience_availability(slot_date, experience_id)
  where is_blocked = false and seats_taken < capacity;
create index saved_user_time_idx on public.saved_experiences(user_id, created_at desc);
create index saved_experience_idx on public.saved_experiences(experience_id);
create index contact_reveals_viewer_time_idx on public.contact_reveals(viewer_id, revealed_at desc);

-- ── Trigger functions ──────────────────────────────────────────────────────

create or replace function public.fn_update_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.fn_create_profile_on_signup()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create or replace function public.fn_sync_is_host()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles set is_host = true where id = new.id;
  elsif tg_op = 'DELETE' then
    update public.profiles set is_host = false where id = old.id;
  end if;
  return null;
end;
$$;

create or replace function public.fn_update_experience_rating()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  exp_id uuid := coalesce(new.experience_id, old.experience_id);
begin
  update public.experiences
  set avg_rating = coalesce((select avg(rating::numeric) from public.reviews where experience_id = exp_id), 0),
      review_count = (select count(*) from public.reviews where experience_id = exp_id)
  where id = exp_id;
  return null;
end;
$$;

create or replace function public.fn_update_post_like_count()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  target_post_id uuid := coalesce(new.post_id, old.post_id);
begin
  update public.posts
  set like_count = (select count(*) from public.post_likes where post_id = target_post_id)
  where id = target_post_id;
  return null;
end;
$$;

create or replace function public.fn_update_experience_save_count()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  target_experience_id uuid := coalesce(new.experience_id, old.experience_id);
begin
  update public.experiences
  set save_count = (select count(*) from public.saved_experiences where experience_id = target_experience_id)
  where id = target_experience_id;
  return null;
end;
$$;

create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.fn_update_updated_at();
create trigger trg_host_profiles_updated_at before update on public.host_profiles
  for each row execute function public.fn_update_updated_at();
create trigger trg_host_contacts_updated_at before update on public.host_contacts
  for each row execute function public.fn_update_updated_at();
create trigger trg_experiences_updated_at before update on public.experiences
  for each row execute function public.fn_update_updated_at();
create trigger trg_bookings_updated_at before update on public.bookings
  for each row execute function public.fn_update_updated_at();
create trigger trg_reviews_updated_at before update on public.reviews
  for each row execute function public.fn_update_updated_at();
create trigger trg_posts_updated_at before update on public.posts
  for each row execute function public.fn_update_updated_at();
create trigger trg_exp_avail_updated_at before update on public.experience_availability
  for each row execute function public.fn_update_updated_at();
create trigger trg_create_profile_on_signup after insert on auth.users
  for each row execute function public.fn_create_profile_on_signup();
create trigger trg_sync_is_host after insert or delete on public.host_profiles
  for each row execute function public.fn_sync_is_host();
create trigger trg_update_experience_rating after insert or update or delete on public.reviews
  for each row execute function public.fn_update_experience_rating();
create trigger trg_update_post_like_count after insert or delete on public.post_likes
  for each row execute function public.fn_update_post_like_count();
create trigger trg_update_experience_save_count after insert or delete on public.saved_experiences
  for each row execute function public.fn_update_experience_save_count();

-- ── RPC functions ──────────────────────────────────────────────────────────

create or replace function public.generate_availability(
  p_experience_id uuid,
  p_from date default current_date,
  p_to date default (current_date + interval '180 days')::date
)
returns integer language plpgsql security invoker set search_path = public as $$
declare
  inserted_count integer := 0;
begin
  if p_to < p_from or p_to - p_from > 400 then
    raise exception 'invalid availability window';
  end if;
  if not exists (
    select 1 from public.experiences
    where id = p_experience_id and host_id = (select auth.uid())
  ) then
    raise exception 'not your experience';
  end if;
  with expanded as (
    select r.experience_id, d::date as slot_date, r.start_time, r.capacity, r.id as source_rule_id
    from public.availability_rules r
    cross join lateral generate_series(
      greatest(r.valid_from, p_from), least(r.valid_to, p_to), interval '1 day'
    ) as d
    where r.experience_id = p_experience_id
      and extract(dow from d)::smallint = any (r.weekdays)
  ), inserted as (
    insert into public.experience_availability
      (experience_id, slot_date, start_time, capacity, source_rule_id)
    select experience_id, slot_date, start_time, capacity, source_rule_id from expanded
    on conflict (experience_id, slot_date, start_time) do nothing
    returning 1
  )
  select count(*) into inserted_count from inserted;
  return inserted_count;
end;
$$;

create or replace function public.get_host_contact(target_host_id uuid)
returns table (phone_e164 text, phone_country text, phone_verified boolean)
language plpgsql security definer set search_path = public as $$
declare
  viewer uuid := auth.uid();
begin
  if viewer is null then raise exception 'authentication required'; end if;
  if (select count(*) from public.contact_reveals
      where viewer_id = viewer and revealed_at > now() - interval '1 hour') >= 30 then
    raise exception 'rate limit exceeded';
  end if;
  if not exists (
    select 1 from public.experiences
    where host_id = target_host_id and is_published = true
  ) then
    raise exception 'host not available';
  end if;
  insert into public.contact_reveals (viewer_id, host_id) values (viewer, target_host_id);
  return query
    select hc.phone_e164, hc.phone_country, hp.phone_verified
    from public.host_profiles hp
    left join public.host_contacts hc on hc.host_id = hp.id
    where hp.id = target_host_id;
end;
$$;

create or replace function public.get_nearby_experiences(
  ref_lat double precision,
  ref_lng double precision,
  radius_km double precision default 25
)
returns table (
  id uuid, title text, category text, location_lat double precision,
  location_lng double precision, price numeric, currency text, avg_rating numeric
)
language sql stable security invoker set search_path = public as $$
  select e.id, e.title, e.category, e.location_lat, e.location_lng,
         e.price, e.currency, e.avg_rating
  from public.experiences e
  where e.is_published = true
    and st_dwithin(
      e.location_geo,
      st_setsrid(st_makepoint(ref_lng, ref_lat), 4326)::geography,
      greatest(radius_km, 0) * 1000
    )
  order by e.location_geo <-> st_setsrid(st_makepoint(ref_lng, ref_lat), 4326)::geography
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
language sql stable security invoker set search_path = public as $$
  with ref as (
    select case when p_lat is not null and p_lng is not null
      then st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography end as pt
  ), filtered as (
    select e.*,
      case when (select pt from ref) is not null
        then st_distance(e.location_geo, (select pt from ref)) / 1000.0 end as distance_km,
      (select min(a.slot_date) from public.experience_availability a
       where a.experience_id = e.id and not a.is_blocked and a.seats_taken < a.capacity
         and a.slot_date >= coalesce(p_date_from, current_date)
         and (p_date_to is null or a.slot_date <= p_date_to)) as next_available,
      case when p_query is null or p_query = '' then 0
        else ts_rank(e.search_vector, websearch_to_tsquery('simple', p_query)) end as rank
    from public.experiences e
    where e.is_published = true
      and (p_query is null or p_query = ''
        or e.search_vector @@ websearch_to_tsquery('simple', p_query) or e.title % p_query)
      and (p_category is null or e.category = p_category)
      and (p_price_min is null or e.price >= p_price_min)
      and (p_price_max is null or e.price <= p_price_max)
      and (p_min_rating is null or e.avg_rating >= p_min_rating)
      and ((select pt from ref) is null or p_radius_km is null
        or st_dwithin(e.location_geo, (select pt from ref), greatest(p_radius_km, 0) * 1000))
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

-- ── Row-level security ─────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.host_profiles enable row level security;
alter table public.host_contacts enable row level security;
alter table public.experiences enable row level security;
alter table public.experience_photos enable row level security;
alter table public.bookings enable row level security;
alter table public.reviews enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.availability_rules enable row level security;
alter table public.experience_availability enable row level security;
alter table public.saved_experiences enable row level security;
alter table public.contact_reveals enable row level security;

create policy profiles_select_authenticated on public.profiles
  for select to authenticated using (true);
create policy profiles_update_own on public.profiles
  for update to authenticated using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy host_profiles_select_authenticated on public.host_profiles
  for select to authenticated using (true);
create policy host_profiles_insert_own on public.host_profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy host_profiles_update_own on public.host_profiles
  for update to authenticated using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
create policy host_profiles_delete_own on public.host_profiles
  for delete to authenticated using ((select auth.uid()) = id);

create policy host_contacts_select_own on public.host_contacts
  for select to authenticated using ((select auth.uid()) = host_id);
create policy host_contacts_insert_own on public.host_contacts
  for insert to authenticated with check ((select auth.uid()) = host_id);
create policy host_contacts_update_own on public.host_contacts
  for update to authenticated using ((select auth.uid()) = host_id)
  with check ((select auth.uid()) = host_id);
create policy host_contacts_delete_own on public.host_contacts
  for delete to authenticated using ((select auth.uid()) = host_id);

create policy experiences_select on public.experiences
  for select to authenticated using (is_published or host_id = (select auth.uid()));
create policy experiences_insert on public.experiences
  for insert to authenticated with check (
    host_id = (select auth.uid()) and exists (
      select 1 from public.host_profiles hp where hp.id = (select auth.uid())
    )
  );
create policy experiences_update_own on public.experiences
  for update to authenticated using (host_id = (select auth.uid()))
  with check (host_id = (select auth.uid()));
create policy experiences_delete_own on public.experiences
  for delete to authenticated using (host_id = (select auth.uid()));

create policy exp_photos_select on public.experience_photos
  for select to authenticated using (true);
create policy exp_photos_insert on public.experience_photos
  for insert to authenticated with check (
    uploaded_by = (select auth.uid()) and exists (
      select 1 from public.experiences e
      where e.id = experience_id and e.host_id = (select auth.uid())
    )
  );
create policy exp_photos_delete on public.experience_photos
  for delete to authenticated using (
    uploaded_by = (select auth.uid()) or exists (
      select 1 from public.experiences e
      where e.id = experience_id and e.host_id = (select auth.uid())
    )
  );

create policy bookings_select_own on public.bookings
  for select to authenticated using (
    traveller_id = (select auth.uid()) or exists (
      select 1 from public.experiences e
      where e.id = experience_id and e.host_id = (select auth.uid())
    )
  );
create policy bookings_insert on public.bookings
  for insert to authenticated with check (traveller_id = (select auth.uid()));

create policy reviews_select on public.reviews
  for select to authenticated using (true);
create policy reviews_insert on public.reviews
  for insert to authenticated with check (
    author_id = (select auth.uid()) and author_id <> (
      select e.host_id from public.experiences e where e.id = experience_id
    )
  );
create policy reviews_update_own on public.reviews
  for update to authenticated using (author_id = (select auth.uid()))
  with check (
    author_id = (select auth.uid()) and author_id <> (
      select e.host_id from public.experiences e where e.id = experience_id
    )
  );
create policy reviews_delete_own on public.reviews
  for delete to authenticated using (author_id = (select auth.uid()));

create policy posts_select on public.posts
  for select to authenticated using (true);
create policy posts_insert on public.posts
  for insert to authenticated with check (author_id = (select auth.uid()));
create policy posts_update_own on public.posts
  for update to authenticated using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));
create policy posts_delete_own on public.posts
  for delete to authenticated using (author_id = (select auth.uid()));

create policy post_likes_select on public.post_likes
  for select to authenticated using (true);
create policy post_likes_insert on public.post_likes
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy post_likes_delete_own on public.post_likes
  for delete to authenticated using (user_id = (select auth.uid()));

create policy availability_rules_own on public.availability_rules
  for all to authenticated
  using (exists (select 1 from public.experiences e
    where e.id = experience_id and e.host_id = (select auth.uid())))
  with check (exists (select 1 from public.experiences e
    where e.id = experience_id and e.host_id = (select auth.uid())));
create policy experience_availability_select on public.experience_availability
  for select to authenticated using (exists (
    select 1 from public.experiences e where e.id = experience_id
      and (e.is_published or e.host_id = (select auth.uid()))
  ));
create policy experience_availability_write_own on public.experience_availability
  for all to authenticated
  using (exists (select 1 from public.experiences e
    where e.id = experience_id and e.host_id = (select auth.uid())))
  with check (exists (select 1 from public.experiences e
    where e.id = experience_id and e.host_id = (select auth.uid())));

create policy saved_select_own on public.saved_experiences
  for select to authenticated using (user_id = (select auth.uid()));
create policy saved_insert_own on public.saved_experiences
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy saved_delete_own on public.saved_experiences
  for delete to authenticated using (user_id = (select auth.uid()));
create policy contact_reveals_select_own on public.contact_reveals
  for select to authenticated using (viewer_id = (select auth.uid()));

-- ── Data API grants ────────────────────────────────────────────────────────
-- Explicit grants are required for new Supabase projects; RLS remains the row filter.

grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.host_profiles to authenticated;
grant select, insert, update, delete on public.host_contacts to authenticated;
grant select, insert, update, delete on public.experiences to authenticated;
grant select, insert, delete on public.experience_photos to authenticated;
grant select, insert on public.bookings to authenticated;
grant select, insert, update, delete on public.reviews to authenticated;
grant select, insert, update, delete on public.posts to authenticated;
grant select, insert, delete on public.post_likes to authenticated;
grant select, insert, update, delete on public.availability_rules to authenticated;
grant select, insert, update, delete on public.experience_availability to authenticated;
grant select, insert, delete on public.saved_experiences to authenticated;
grant select on public.contact_reveals to authenticated;

revoke all on function public.fn_update_updated_at() from public, anon, authenticated;
revoke all on function public.fn_create_profile_on_signup() from public, anon, authenticated;
revoke all on function public.fn_sync_is_host() from public, anon, authenticated;
revoke all on function public.fn_update_experience_rating() from public, anon, authenticated;
revoke all on function public.fn_update_post_like_count() from public, anon, authenticated;
revoke all on function public.fn_update_experience_save_count() from public, anon, authenticated;
revoke all on function public.generate_availability(uuid, date, date) from public, anon;
revoke all on function public.get_host_contact(uuid) from public, anon;
revoke all on function public.get_nearby_experiences(double precision, double precision, double precision) from public, anon;
revoke all on function public.search_experiences(text, text, double precision, double precision, double precision, numeric, numeric, numeric, date, date, text, integer, integer) from public, anon;
grant execute on function public.generate_availability(uuid, date, date) to authenticated;
grant execute on function public.get_host_contact(uuid) to authenticated;
grant execute on function public.get_nearby_experiences(double precision, double precision, double precision) to authenticated;
grant execute on function public.search_experiences(text, text, double precision, double precision, double precision, numeric, numeric, numeric, date, date, text, integer, integer) to authenticated;

commit;
