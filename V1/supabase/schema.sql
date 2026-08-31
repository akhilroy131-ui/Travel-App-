-- Roam — Full Database Schema
-- LEGACY REFERENCE ONLY. DO NOT RUN THIS FILE.
-- The authoritative schema is ../../supabase/migrations/ at the repository root.

-- ─────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────
create extension if not exists postgis;

-- ─────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────
create type user_role as enum ('traveller', 'host');
create type experience_category as enum ('food_drink', 'adventure_outdoors', 'culture_history', 'wellness_mindfulness');
create type booking_status as enum ('pending', 'confirmed', 'cancelled', 'completed');
create type payment_status as enum ('unpaid', 'paid', 'refunded');

-- ─────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          user_role not null default 'traveller',
  display_name  text not null,
  avatar_url    text,
  bio           text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'traveller')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────
-- EXPERIENCES
-- ─────────────────────────────────────────
create table public.experiences (
  id                uuid primary key default gen_random_uuid(),
  host_id           uuid not null references public.profiles(id) on delete cascade,
  title             text not null,
  description       text not null default '',
  category          experience_category not null,
  price             numeric(10,2) not null default 0,
  currency          text not null default 'USD',
  location_lat      double precision not null,
  location_lng      double precision not null,
  location_name     text not null default '',
  location_point    geography(Point, 4326),
  cover_image_url   text,
  is_published      boolean not null default false,
  avg_rating        numeric(3,2) not null default 0,
  review_count      int not null default 0,
  max_guests        int,
  duration_minutes  int,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Keep location_point in sync with lat/lng
create or replace function public.sync_experience_location()
returns trigger language plpgsql as $$
begin
  new.location_point := st_setsrid(st_makepoint(new.location_lng, new.location_lat), 4326);
  return new;
end;
$$;

create trigger sync_location
  before insert or update of location_lat, location_lng on public.experiences
  for each row execute procedure public.sync_experience_location();

create index experiences_location_idx on public.experiences using gist(location_point);
create index experiences_published_idx on public.experiences(is_published);
create index experiences_host_idx on public.experiences(host_id);

-- ─────────────────────────────────────────
-- EXPERIENCE PHOTOS
-- ─────────────────────────────────────────
create table public.experience_photos (
  id              uuid primary key default gen_random_uuid(),
  experience_id   uuid not null references public.experiences(id) on delete cascade,
  url             text not null,
  display_order   int not null default 0,
  uploaded_by     uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);

create index experience_photos_exp_idx on public.experience_photos(experience_id);

-- ─────────────────────────────────────────
-- REVIEWS
-- ─────────────────────────────────────────
create table public.reviews (
  id              uuid primary key default gen_random_uuid(),
  experience_id   uuid not null references public.experiences(id) on delete cascade,
  author_id       uuid not null references public.profiles(id) on delete cascade,
  rating          int not null check (rating between 1 and 5),
  body            text,
  booking_id      uuid,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (experience_id, author_id)
);

create index reviews_experience_idx on public.reviews(experience_id);

-- Recalculate avg_rating and review_count on experiences
create or replace function public.update_experience_rating()
returns trigger language plpgsql as $$
declare
  exp_id uuid;
begin
  exp_id := coalesce(new.experience_id, old.experience_id);
  update public.experiences
  set
    avg_rating   = (select coalesce(avg(rating), 0) from public.reviews where experience_id = exp_id),
    review_count = (select count(*) from public.reviews where experience_id = exp_id),
    updated_at   = now()
  where id = exp_id;
  return coalesce(new, old);
end;
$$;

create trigger on_review_change
  after insert or update or delete on public.reviews
  for each row execute procedure public.update_experience_rating();

-- ─────────────────────────────────────────
-- POSTS
-- ─────────────────────────────────────────
create table public.posts (
  id              uuid primary key default gen_random_uuid(),
  author_id       uuid not null references public.profiles(id) on delete cascade,
  experience_id   uuid references public.experiences(id) on delete set null,
  tagged_host_id  uuid references public.profiles(id) on delete set null,
  image_url       text not null,
  caption         text,
  like_count      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index posts_author_idx on public.posts(author_id);
create index posts_created_idx on public.posts(created_at desc);

-- ─────────────────────────────────────────
-- POST LIKES
-- ─────────────────────────────────────────
create table public.post_likes (
  post_id     uuid not null references public.posts(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- Keep like_count in sync
create or replace function public.update_post_like_count()
returns trigger language plpgsql as $$
declare
  p_id uuid;
begin
  p_id := coalesce(new.post_id, old.post_id);
  update public.posts
  set like_count = (select count(*) from public.post_likes where post_id = p_id)
  where id = p_id;
  return coalesce(new, old);
end;
$$;

create trigger on_like_change
  after insert or delete on public.post_likes
  for each row execute procedure public.update_post_like_count();

-- ─────────────────────────────────────────
-- BOOKINGS (v2 — table exists, no UI yet)
-- ─────────────────────────────────────────
create table public.bookings (
  id                  uuid primary key default gen_random_uuid(),
  experience_id       uuid not null references public.experiences(id) on delete cascade,
  traveller_id        uuid not null references public.profiles(id) on delete cascade,
  status              booking_status not null default 'pending',
  booked_date         date not null,
  guest_count         int not null default 1,
  total_price         numeric(10,2) not null,
  payment_intent_id   text,
  payment_status      payment_status not null default 'unpaid',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- RPC: get_nearby_experiences (PostGIS radius query)
-- ─────────────────────────────────────────
create or replace function public.get_nearby_experiences(
  ref_lat   double precision,
  ref_lng   double precision,
  radius_km double precision default 25
)
returns table (
  id            uuid,
  title         text,
  category      experience_category,
  location_lat  double precision,
  location_lng  double precision,
  price         numeric,
  avg_rating    numeric
)
language sql stable as $$
  select
    id,
    title,
    category,
    location_lat,
    location_lng,
    price,
    avg_rating
  from public.experiences
  where
    is_published = true
    and st_dwithin(
      location_point,
      st_setsrid(st_makepoint(ref_lng, ref_lat), 4326)::geography,
      radius_km * 1000
    )
  order by location_point <-> st_setsrid(st_makepoint(ref_lng, ref_lat), 4326)::geography
  limit 100;
$$;

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.experiences enable row level security;
alter table public.experience_photos enable row level security;
alter table public.reviews enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.bookings enable row level security;

-- Profiles
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);

-- Experiences
create policy "Published experiences are viewable by everyone" on public.experiences for select using (is_published = true or host_id = auth.uid());
create policy "Hosts can insert experiences" on public.experiences for insert with check (auth.uid() = host_id);
create policy "Hosts can update their own experiences" on public.experiences for update using (auth.uid() = host_id);
create policy "Hosts can delete their own experiences" on public.experiences for delete using (auth.uid() = host_id);

-- Experience photos
create policy "Photos viewable by everyone" on public.experience_photos for select using (true);
create policy "Hosts can manage their experience photos" on public.experience_photos for all using (
  auth.uid() = (select host_id from public.experiences where id = experience_id)
);

-- Reviews
create policy "Reviews viewable by everyone" on public.reviews for select using (true);
create policy "Authenticated users can insert reviews" on public.reviews for insert with check (auth.uid() = author_id);
create policy "Authors can update their reviews" on public.reviews for update using (auth.uid() = author_id);
create policy "Authors can delete their reviews" on public.reviews for delete using (auth.uid() = author_id);

-- Posts
create policy "Posts viewable by everyone" on public.posts for select using (true);
create policy "Authenticated users can insert posts" on public.posts for insert with check (auth.uid() = author_id);
create policy "Authors can update their posts" on public.posts for update using (auth.uid() = author_id);
create policy "Authors can delete their posts" on public.posts for delete using (auth.uid() = author_id);

-- Post likes
create policy "Likes viewable by everyone" on public.post_likes for select using (true);
create policy "Authenticated users can like" on public.post_likes for insert with check (auth.uid() = user_id);
create policy "Users can unlike" on public.post_likes for delete using (auth.uid() = user_id);

-- Bookings
create policy "Users can view their own bookings" on public.bookings for select using (auth.uid() = traveller_id);
create policy "Users can create bookings" on public.bookings for insert with check (auth.uid() = traveller_id);
