-- 0002 — Availability calendar
--
-- DESIGN NOTE (read before changing this):
-- Two shapes were considered.
--
--   (a) Recurrence rules only (RRULE + exceptions). Elegant, compact, and painful:
--       every read has to expand the rule, date-range queries can't use an index,
--       and RRULE edge cases (DST, month-end, timezone) are a classic source of bugs.
--
--   (b) Materialised date rows, generated from rules. One row per bookable slot.
--
-- We use (b). A year of daily slots is 365 rows per experience — nothing for Postgres,
-- and it makes "which experiences are free next Saturday" a plain indexed range scan.
-- `availability_rules` is the *generator*; `experience_availability` is the *truth*.
-- Never query the rules table to answer an availability question.

begin;

-- ── Rules: how a host describes their pattern ───────────────────────────────

create table if not exists availability_rules (
  id             uuid primary key default gen_random_uuid(),
  experience_id  uuid not null references experiences(id) on delete cascade,
  weekdays       smallint[] not null,  -- 0=Sunday … 6=Saturday, per Postgres EXTRACT(DOW)
  start_time     time,                 -- null = all-day / host arranges time
  capacity       integer not null default 1 check (capacity > 0),
  valid_from     date not null,
  valid_to       date not null,
  created_at     timestamptz not null default now(),
  check (valid_to >= valid_from),
  check (array_length(weekdays, 1) between 1 and 7)
);

create index if not exists availability_rules_exp_idx on availability_rules(experience_id);

-- ── Slots: the queryable truth ──────────────────────────────────────────────

create table if not exists experience_availability (
  id             uuid primary key default gen_random_uuid(),
  experience_id  uuid not null references experiences(id) on delete cascade,
  slot_date      date not null,
  start_time     time,
  capacity       integer not null default 1 check (capacity > 0),
  seats_taken    integer not null default 0 check (seats_taken >= 0),
  price_override numeric(10,2),        -- null = use experiences.price
  is_blocked     boolean not null default false,  -- host closed this specific date
  source_rule_id uuid references availability_rules(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (experience_id, slot_date, start_time),
  check (seats_taken <= capacity)
);

create index if not exists exp_avail_lookup_idx
  on experience_availability(experience_id, slot_date);

-- Partial index: the only rows a search ever cares about are open future slots.
create index if not exists exp_avail_open_idx
  on experience_availability(slot_date, experience_id)
  where is_blocked = false and seats_taken < capacity;

create trigger trg_exp_avail_updated_at
  before update on experience_availability
  for each row execute function fn_update_updated_at();

-- ── Generator ───────────────────────────────────────────────────────────────
-- Expands rules into slot rows for a window. Idempotent: existing slots are left
-- alone, so a host's manual block or an existing booking is never clobbered.

create or replace function generate_availability(
  p_experience_id uuid,
  p_from          date default current_date,
  p_to            date default (current_date + interval '180 days')::date
)
returns integer
language plpgsql security invoker set search_path = public as $$
declare
  inserted_count integer := 0;
begin
  if not exists (
    select 1 from experiences
    where id = p_experience_id and host_id = (select auth.uid())
  ) then
    raise exception 'not your experience';
  end if;

  if p_to - p_from > 400 then
    raise exception 'window too large (max 400 days)';
  end if;

  with expanded as (
    select
      r.experience_id,
      d::date            as slot_date,
      r.start_time,
      r.capacity,
      r.id               as source_rule_id
    from availability_rules r
    cross join lateral generate_series(
      greatest(r.valid_from, p_from),
      least(r.valid_to, p_to),
      interval '1 day'
    ) as d
    where r.experience_id = p_experience_id
      and extract(dow from d)::smallint = any (r.weekdays)
  ),
  ins as (
    insert into experience_availability
      (experience_id, slot_date, start_time, capacity, source_rule_id)
    select experience_id, slot_date, start_time, capacity, source_rule_id
    from expanded
    on conflict (experience_id, slot_date, start_time) do nothing
    returning 1
  )
  select count(*) into inserted_count from ins;

  return inserted_count;
end;
$$;

grant execute on function generate_availability(uuid, date, date) to authenticated;

-- ── RLS ─────────────────────────────────────────────────────────────────────

alter table availability_rules       enable row level security;
alter table experience_availability  enable row level security;

-- Anyone signed in can read availability for a published experience.
create policy "exp_avail_select" on experience_availability
  for select to authenticated
  using (exists (
    select 1 from experiences e
    where e.id = experience_id
      and (e.is_published = true or e.host_id = (select auth.uid()))
  ));

-- Only the owning host writes.
create policy "exp_avail_write_own" on experience_availability
  for all to authenticated
  using (exists (
    select 1 from experiences e
    where e.id = experience_id and e.host_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from experiences e
    where e.id = experience_id and e.host_id = (select auth.uid())
  ));

create policy "avail_rules_own" on availability_rules
  for all to authenticated
  using (exists (
    select 1 from experiences e
    where e.id = experience_id and e.host_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from experiences e
    where e.id = experience_id and e.host_id = (select auth.uid())
  ));

-- NOTE for V3: `seats_taken` is written by nothing today. When bookings land it is
-- incremented inside the booking transaction, and the `seats_taken <= capacity` check
-- constraint becomes the oversell guard. Do not increment it from the client.

commit;
