# Roam — Supabase Schema

> **Legacy reference only (2026-09-01):** this document describes the original prototype
> schema and must not be executed. The authoritative schema is the timestamped migration
> chain in `../supabase/migrations/` from the repository root, with generated TypeScript
> types in `types/database.ts`.

## Extensions Required

Run once in Supabase SQL Editor before any table creation:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

## Tables

### `profiles`
One row per auth user. Auto-created by trigger on `auth.users` INSERT.

```sql
CREATE TABLE profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role         text NOT NULL CHECK (role IN ('traveller', 'host')),
  display_name text NOT NULL,
  avatar_url   text,
  bio          text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
```

---

### `experiences`
Host listings — the core content table.

```sql
CREATE TABLE experiences (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id          uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title            text NOT NULL,
  description      text NOT NULL,
  category         text NOT NULL CHECK (category IN (
                     'food_drink',
                     'adventure_outdoors',
                     'culture_history',
                     'wellness_mindfulness'
                   )),
  price            numeric(10,2) NOT NULL DEFAULT 0,
  currency         text NOT NULL DEFAULT 'USD',
  location_lat     double precision NOT NULL,
  location_lng     double precision NOT NULL,
  location_name    text NOT NULL,
  location_geo     geography(Point, 4326),  -- auto-set by trigger
  cover_image_url  text,
  is_published     boolean NOT NULL DEFAULT false,
  avg_rating       numeric(3,2) DEFAULT 0,   -- denormalized, trigger-maintained
  review_count     integer DEFAULT 0,         -- denormalized, trigger-maintained
  max_guests       integer,                   -- v2 booking field
  duration_minutes integer,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX experiences_host_id_idx      ON experiences(host_id);
CREATE INDEX experiences_category_idx     ON experiences(category);
CREATE INDEX experiences_published_idx    ON experiences(is_published);
CREATE INDEX experiences_location_geo_idx ON experiences USING GIST(location_geo);
```

---

### `experience_photos`
Gallery images for an experience.

```sql
CREATE TABLE experience_photos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id uuid NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  url           text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  uploaded_by   uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);
```

---

### `reviews`
Experience ratings. Only travellers with a confirmed booking can review in v2.
In v1 `booking_id` is nullable — any authenticated user can submit.

```sql
CREATE TABLE reviews (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id uuid NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  author_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating        smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body          text,
  booking_id    uuid REFERENCES bookings(id),  -- null in v1
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (experience_id, author_id)             -- one review per user per experience
);
```

---

### `bookings`
**v2 schema** — tables and columns exist; no UI in v1.

```sql
CREATE TABLE bookings (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id     uuid NOT NULL REFERENCES experiences(id),
  traveller_id      uuid NOT NULL REFERENCES profiles(id),
  status            text NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','confirmed','cancelled','completed')),
  booked_date       date NOT NULL,
  guest_count       integer NOT NULL DEFAULT 1,
  total_price       numeric(10,2) NOT NULL DEFAULT 0,
  payment_intent_id text,           -- Stripe v2
  payment_status    text DEFAULT 'unpaid'
                      CHECK (payment_status IN ('unpaid','paid','refunded')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
```

---

### `posts`
Traveller photo wall entries. Can be tagged to a host and/or experience.

```sql
CREATE TABLE posts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  experience_id  uuid REFERENCES experiences(id) ON DELETE SET NULL,
  tagged_host_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  image_url      text NOT NULL,
  caption        text,
  like_count     integer NOT NULL DEFAULT 0,  -- denormalized, trigger-maintained
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
```

---

### `post_likes`
Normalized likes. Composite PK prevents duplicate likes.

```sql
CREATE TABLE post_likes (
  post_id    uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
```

---

## Postgres Functions & Triggers

### 1. Auto-update `updated_at`

```sql
CREATE OR REPLACE FUNCTION fn_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at:
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();

CREATE TRIGGER trg_experiences_updated_at
  BEFORE UPDATE ON experiences FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();

CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();

CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();

CREATE TRIGGER trg_posts_updated_at
  BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();
```

---

### 2. Auto-create profile on sign-up

Reads `display_name`, `role`, and `avatar_url` from `raw_user_meta_data` (passed during signUp).

```sql
CREATE OR REPLACE FUNCTION fn_create_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, role, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'traveller'),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_create_profile_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION fn_create_profile_on_signup();
```

---

### 3. Sync `location_geo` from lat/lng

```sql
CREATE OR REPLACE FUNCTION fn_set_location_geo()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location_geo = ST_SetSRID(
    ST_MakePoint(NEW.location_lng, NEW.location_lat),
    4326
  )::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_location_geo
  BEFORE INSERT OR UPDATE OF location_lat, location_lng ON experiences
  FOR EACH ROW EXECUTE FUNCTION fn_set_location_geo();
```

---

### 4. Update experience avg_rating + review_count

```sql
CREATE OR REPLACE FUNCTION fn_update_experience_rating()
RETURNS TRIGGER AS $$
DECLARE
  exp_id uuid;
BEGIN
  exp_id := COALESCE(NEW.experience_id, OLD.experience_id);
  UPDATE experiences
  SET
    avg_rating   = COALESCE((SELECT AVG(rating::numeric) FROM reviews WHERE experience_id = exp_id), 0),
    review_count = (SELECT COUNT(*) FROM reviews WHERE experience_id = exp_id)
  WHERE id = exp_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_experience_rating
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION fn_update_experience_rating();
```

---

### 5. Update post like_count

```sql
CREATE OR REPLACE FUNCTION fn_update_post_likes_count()
RETURNS TRIGGER AS $$
DECLARE
  p_id uuid;
BEGIN
  p_id := COALESCE(NEW.post_id, OLD.post_id);
  UPDATE posts
  SET like_count = (SELECT COUNT(*) FROM post_likes WHERE post_id = p_id)
  WHERE id = p_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_post_likes_count
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION fn_update_post_likes_count();
```

---

## Row-Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences       ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews           ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes        ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────
-- profiles
-- ────────────────────────────────
CREATE POLICY "profiles_select_authenticated" ON profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- INSERT is handled by the trigger only — block direct client inserts
CREATE POLICY "profiles_insert_block" ON profiles
  FOR INSERT TO authenticated WITH CHECK (false);

-- ────────────────────────────────
-- experiences
-- ────────────────────────────────
CREATE POLICY "experiences_select" ON experiences
  FOR SELECT TO authenticated USING (is_published = true OR host_id = auth.uid());

CREATE POLICY "experiences_insert" ON experiences
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = host_id AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'host'
  );

CREATE POLICY "experiences_update_own" ON experiences
  FOR UPDATE TO authenticated USING (auth.uid() = host_id);

CREATE POLICY "experiences_delete_own" ON experiences
  FOR DELETE TO authenticated USING (auth.uid() = host_id);

-- ────────────────────────────────
-- experience_photos
-- ────────────────────────────────
CREATE POLICY "exp_photos_select" ON experience_photos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "exp_photos_insert" ON experience_photos
  FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "exp_photos_delete" ON experience_photos
  FOR DELETE TO authenticated USING (
    uploaded_by = auth.uid() OR
    (SELECT host_id FROM experiences WHERE id = experience_id) = auth.uid()
  );

-- ────────────────────────────────
-- reviews
-- ────────────────────────────────
CREATE POLICY "reviews_select" ON reviews
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "reviews_insert" ON reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

CREATE POLICY "reviews_update_own" ON reviews
  FOR UPDATE TO authenticated USING (auth.uid() = author_id);

CREATE POLICY "reviews_delete_own" ON reviews
  FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- ────────────────────────────────
-- bookings (v2)
-- ────────────────────────────────
CREATE POLICY "bookings_select_own" ON bookings
  FOR SELECT TO authenticated USING (
    traveller_id = auth.uid() OR
    (SELECT host_id FROM experiences WHERE id = experience_id) = auth.uid()
  );

CREATE POLICY "bookings_insert" ON bookings
  FOR INSERT TO authenticated WITH CHECK (traveller_id = auth.uid());

-- ────────────────────────────────
-- posts
-- ────────────────────────────────
CREATE POLICY "posts_select" ON posts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "posts_insert" ON posts
  FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());

CREATE POLICY "posts_update_own" ON posts
  FOR UPDATE TO authenticated USING (author_id = auth.uid());

CREATE POLICY "posts_delete_own" ON posts
  FOR DELETE TO authenticated USING (author_id = auth.uid());

-- ────────────────────────────────
-- post_likes
-- ────────────────────────────────
CREATE POLICY "post_likes_select" ON post_likes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "post_likes_insert" ON post_likes
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "post_likes_delete_own" ON post_likes
  FOR DELETE TO authenticated USING (user_id = auth.uid());
```

---

## Storage Buckets

Create via Supabase Dashboard → Storage → New bucket, or via the API.

| Bucket | Public? | Path Convention |
|---|---|---|
| `avatars` | Public read | `{user_id}/avatar.{ext}` |
| `experience-photos` | Public read | `{experience_id}/{timestamp}.{ext}` |
| `post-photos` | Public read | `{user_id}/{timestamp}.{ext}` |

Storage policies (set per bucket in Dashboard → Storage → Policies):
- All buckets: authenticated users can read
- `avatars`: owner (`user_id` in path matches `auth.uid()`) can insert/update/delete
- `experience-photos`: host can insert; uploader or host can delete
- `post-photos`: owner can insert/delete

---

## Useful Query Examples

### Experiences within 25km of a point (for map pins)
```sql
SELECT id, title, category, location_lat, location_lng, price, avg_rating, cover_image_url
FROM experiences
WHERE is_published = true
  AND ST_DWithin(
    location_geo,
    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
    :radius_meters
  )
ORDER BY ST_Distance(
  location_geo,
  ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
);
```

### Experiences with host profile joined
```sql
SELECT
  e.*,
  p.display_name,
  p.avatar_url,
  p.bio
FROM experiences e
JOIN profiles p ON p.id = e.host_id
WHERE e.is_published = true
ORDER BY e.created_at DESC
LIMIT 20;
```

---

## RPC Functions (Phase 8 — Map)

### `get_nearby_experiences`

Used by `useNearbyExperiences` hook to return lightweight `ExperiencePin` rows
within a given radius. Run this in the Supabase SQL Editor.

```sql
CREATE OR REPLACE FUNCTION get_nearby_experiences(
  ref_lat  double precision,
  ref_lng  double precision,
  radius_km double precision DEFAULT 25
)
RETURNS TABLE (
  id             uuid,
  title          text,
  category       text,
  location_lat   double precision,
  location_lng   double precision,
  price          numeric,
  avg_rating     numeric
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    e.id,
    e.title,
    e.category,
    e.location_lat,
    e.location_lng,
    e.price,
    e.avg_rating
  FROM experiences e
  WHERE
    e.is_published = true
    AND ST_DWithin(
      e.location_geo,
      ST_SetSRID(ST_MakePoint(ref_lng, ref_lat), 4326)::geography,
      radius_km * 1000  -- ST_DWithin uses metres for geography type
    )
  ORDER BY e.location_geo <-> ST_SetSRID(ST_MakePoint(ref_lng, ref_lat), 4326)::geography
  LIMIT 200;
$$;

-- Grant execute to authenticated and anon roles
GRANT EXECUTE ON FUNCTION get_nearby_experiences TO authenticated, anon;
```
