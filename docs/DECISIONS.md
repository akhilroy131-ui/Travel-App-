# Roam — Decisions

Why the schema and stack look the way they do. If you are an agent and something here
seems wrong, say so — do not silently reverse it.

## Scope

- **V1** — discovery, search + filters, host listing creation, availability calendar,
  reviews, wishlist, photo wall, host phone contact.
- **V2** — in-app chat, host verification.
- **V3** — bookings and payments.
- Later-version tables may exist. Their UI is not built early.

## Platform

**Mobile only.** Web was considered and dropped. A marketing site may come later; it will be
a separate Next.js or Astro project hitting the same Supabase, sharing nothing with this
codebase but generated types. Do not add React Native Web support "just in case" — it forces
a map library change, breaks `expo-secure-store`, and buys nothing until that site exists.

## Maps: Mapbox, deliberately, with an exit

Mapbox chosen for V1. 50,000 free map loads/month, then $0.50 per 1,000.

The alternative is MapLibre + OpenFreeMap, which is free with no per-load pricing at all.
It stays viable because `@maplibre/maplibre-react-native` began as a fork of `@rnmapbox/maps`
and the APIs are close to identical.

**Therefore:** the map SDK is reachable only from `V1/components/map/`, behind `<RoamMap>`
and `<RoamMarker>`. Screens never import `@rnmapbox`. Switching providers must stay a
one-file change. This is a constitution rule, not a preference.

Geocoding is a separate service from tiles and still needs choosing. Volume is tiny —
a few lookups per listing created, not per map view — so any free tier works.

## Host model: opt-in, not a role

The original schema had `profiles.role` as a single immutable value. That forces a traveller
who later wants to list an experience into a second account. Replaced with `profiles.is_host`
plus a `host_profiles` table that a user opts into. Host-specific fields (payout, verification,
cancellation policy) multiply in V3; they belong on their own table, not as nullable columns
on every traveller row.

## Phone numbers are not a normal column

Phone numbers live in the private `host_contacts` table, not in the publicly readable
`host_profiles` table. A plain `select * from host_profiles` by any signed-up user therefore
cannot hand over every host's phone number in one request — that would be a scraping target,
not a feature.

Access goes through `get_host_contact()`, which requires auth, rate-limits to 30 reveals per
hour, requires the host to have a published listing, and logs every reveal to
`contact_reveals`. That log is what makes rate limiting and abuse detection possible in V2
without another migration.

## Availability: rules generate, dates are truth

Recurrence rules (RRULE) were rejected. They are compact but every read has to expand them,
range queries cannot use an index, and DST/month-end/timezone edge cases are a well-known
bug source.

Instead: `availability_rules` is a **generator**, `experience_availability` is the
**queryable truth**. `generate_availability()` expands rules into date rows and is idempotent,
so a host's manual block or an existing booking is never overwritten. 365 rows per experience
is nothing for Postgres and makes "open next Saturday" an indexed range scan.

`seats_taken` is written by nothing today. In V3 it is incremented inside the booking
transaction, and the `seats_taken <= capacity` check constraint becomes the oversell guard.
Never increment it from the client.

## Search is an RPC, not a query builder

Once search combines text + geo radius + availability window + category + price + rating,
chained PostgREST calls cannot express it — "open on a date" needs a join the client can't
make, and there is no relevance ranking. `search_experiences()` does it in one round trip,
which also matters on a metered free tier.

Text search uses the `simple` config rather than `english`: the app is global, and stemming
with the wrong language is worse than not stemming.

## Security fixes carried over from the audit

- **Self-review was possible.** A host could review their own listing and the `avg_rating`
  trigger would apply it. Blocked in the consolidated initial schema. The real booking gate
  arrives in V3.
- **`get_nearby_experiences` bypassed RLS.** It was `SECURITY DEFINER` granted to `anon`, so
  anonymous callers could read rows through the RPC that RLS denied on the table. Now
  `SECURITY INVOKER`.
- **`experiences_insert` referenced the dropped `role` column** and re-evaluated `auth.uid()`
  per row. Both fixed.
- **`currency` defaulted to USD.** For a global app a host who forgets the field silently
  lists in dollars. Default removed, ISO-4217 format enforced.

## Deliberately not decided

- **Anonymous browsing.** No anonymous table or RPC grants are installed. Enabling public
  discovery raises conversion and exposes the supply list to scrapers and competitors, so
  it remains a product call implemented only through a future migration.
- **Named wishlist collections.** V1 is one flat list. `saved_experiences` is shaped so
  adding a `collections` table and a nullable `collection_id` is additive.
- **Geocoding provider.**
