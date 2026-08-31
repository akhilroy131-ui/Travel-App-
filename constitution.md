# Roam — Constitution

Rules that hold for every change, by any author, human or agent.
Each is written as a single testable claim. If a rule blocks you, stop and ask.
Do not work around a rule to make a task pass.

## 1. Security

- Every table SHALL have RLS enabled and at least one explicit policy.
- No agent SHALL disable RLS, drop a policy, or use the service-role key to make a test,
  build, or feature pass. If a policy blocks a legitimate operation, change the policy
  deliberately in a migration and say why in the commit.
- The service-role key SHALL NEVER appear in the mobile app, in `V1/`, in any `EXPO_PUBLIC_*`
  variable, or in any file tracked by git.
- Host phone numbers SHALL NOT be readable via a plain table select. They are exposed only
  through `get_host_contact()`, which records the reveal.
- No secret SHALL be committed. `.env` stays gitignored.

## 2. Data

- The schema in `supabase/migrations/` is the source of truth. Markdown docs describe it;
  they never define it.
- TypeScript DB types SHALL be generated (`supabase gen types`), never hand-written.
- Denormalised counters (`avg_rating`, `review_count`, `like_count`, `save_count`) SHALL be
  maintained by Postgres triggers, never computed or written from the client.
- Every migration SHALL be forward-only and idempotent where practical. No editing an
  already-applied migration file.

## 3. Architecture

- Screens and components SHALL NOT import `lib/supabase`. All queries live in `hooks/**`
  or `lib/**`.
- Screens and components SHALL NOT import `@rnmapbox/maps`. The map SDK is reachable only
  from `V1/components/map/`, behind `<RoamMap>` / `<RoamMarker>`.
- Server state SHALL be owned by TanStack Query. No hand-rolled
  `useState` + `useEffect` + `loading` + `error` fetch hooks.
- Any query combining more than two of {text search, geo radius, availability, category,
  price, rating} SHALL be a Postgres RPC, not a chained PostgREST query.
- Components SHALL be props-driven and SHALL NOT fetch their own data.
- Styles SHALL come from `constants/theme.ts`. No raw hex values, no magic numbers.

## 4. Images

- No image SHALL be uploaded at original resolution. Every upload passes through
  `lib/images.ts`: resize longest edge to 1600px, JPEG quality 0.7, plus a 400px thumbnail.
- Uploads SHALL NOT use `fetch(uri).then(r => r.blob())`. React Native's Blob support is
  incomplete and this silently produces 0-byte files. Use base64 → ArrayBuffer.
- The size limits in `constants/config.ts` SHALL be enforced, not merely declared.

## 5. Verification

- Every feature change SHALL ship with at least one test that fails without it.
- `npx tsc --noEmit` SHALL pass before any commit.
- CI SHALL run typecheck, lint, unit tests, and Semgrep on every pull request.
- A pull request SHALL NOT merge with a failing check, and SHALL NOT merge unreviewed.
  Codex review (`@codex review`) counts as a first pass; a human still reads the diff.

## 6. Scope

- V1 is discovery, host listing creation, availability, reviews, wishlist, search, photo wall.
- V2 is chat and host verification. V3 is bookings and payments.
- Tables and columns for later versions MAY exist. UI for them SHALL NOT be built early.
- No agent SHALL expand scope beyond the spec it was given. If the spec is wrong, stop and say so.
