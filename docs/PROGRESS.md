# Roam — Progress Log

This is the durable handoff log for completed work, verification evidence, open decisions,
and the next safe step. Update it after every material implementation or database change.

## 2026-09-01 — App aligned with generated profile contract

### Completed

- Typed the shared Supabase client as `createClient<Database>()`.
- Replaced hand-written database row interfaces with aliases/compositions built from the
  generated `Tables<...>` and RPC return types.
- Removed the obsolete traveller/host selector and user-editable `role` metadata from
  signup. New accounts start as travellers; hosting remains an explicit `host_profiles`
  opt-in.
- Updated profile joins and the customer profile screen to use `profiles.is_host`.
- Typed profile updates from the generated `TablesUpdate<'profiles'>` contract.

### Test evidence

- Added a compile-time regression contract covering both the generated profile shape and the
  three-argument, role-free signup function.
- RED: TypeScript failed because the app's old `Profile` contained `role` instead of
  `is_host`; checkpoint commit `667f9b8`.
- GREEN: `V1/node_modules/.bin/tsc --noEmit` passes after the alignment.
- Live verification confirms `profiles.is_host` is `boolean not null default false`, the
  legacy `role` column is absent, and the new project currently has zero profile rows.

### Next safe steps

1. Build the host opt-in flow that creates `host_profiles` and optionally `host_contacts`.
2. Configure Auth redirect URLs and required OAuth providers.
3. Exercise signup, profile update, host opt-in, listing creation, and storage uploads with
   authenticated test accounts.
4. Implement the image pipeline and CI specification before expanding feature scope.

## 2026-09-01 — New Roam Supabase project created and migrated

### Completed

- Created the `Roam` project in `akhilroy131-ui's Org` on the confirmed `$0/month`
  project tier.
- Project reference: `klbyqbsznbydpmlpbtfc`; region: `ap-south-1`; final status:
  `ACTIVE_HEALTHY`.
- Reconciled the app's current Supabase calls, legacy SQL, schema handoff, and product
  decisions into a clean-install migration chain.
- Applied four migrations: `initial_roam_schema`, `configure_storage_buckets`,
  `harden_extensions_and_indexes`, and `restrict_data_api_grants`.
- Preserved the five incompatible handoff migrations under `supabase/reference-migrations/`
  for audit context; they are not part of the executable chain.
- Regenerated `V1/types/database.ts` from the live database.
- Pointed the ignored `V1/.env` at the new project using its active publishable key.

### Live database verification

- 13 application tables exist and all 13 have RLS enabled.
- 39 policies protect the public-schema tables.
- The `avatars`, `experience-photos`, and `post-photos` buckets exist with MIME and
  size limits plus authenticated write policies.
- PostGIS and `pg_trgm` are installed in the non-exposed `extensions` schema.
- `get_nearby_experiences()` and `search_experiences()` executed successfully against the
  empty database.
- Anonymous users have no application-table privileges and cannot execute any application
  RPC. Authenticated users have only the per-table operations and RPCs required by the app;
  broad default `TRUNCATE`, `TRIGGER`, `REFERENCES`, and other unintended privileges were
  explicitly revoked.
- Supabase's security advisor reports one intentional warning: authenticated execution of
  the `SECURITY DEFINER` function `get_host_contact()`. The function validates auth,
  requires a published host, rate-limits to 30 reveals per hour, and writes an audit record;
  elevated access is required so the private `host_contacts` table is never directly
  exposed.
- Supabase's performance advisor reports only unused-index informational notices, expected
  because the database contains no application rows. Missing-FK-index and overlapping-policy
  warnings were resolved.
- Local migration filename versions exactly match the four versions in Supabase's migration
  history, preventing future push/pull drift.
- `V1/node_modules/.bin/tsc --noEmit` passes after generating the database types.

### Repository state

- No commit or push was performed. Database, migration, generated-type, and documentation
  changes remain available for review.
- The pre-existing local commit `c0f5c5f` remains ahead of the remote and unpushed.

### Next safe steps

1. Align the app with `profiles.is_host` and the private `host_contacts` model, then type
   the Supabase client with the generated `Database` contract.
2. Configure Auth redirect URLs and required OAuth providers before testing sign-in.
3. Run the authenticated signup/profile/listing/storage flows against the empty project.
4. Review the full Git diff and commit only the relevant files when explicitly requested.

## 2026-09-01 — Supabase availability check

### Findings

- The app's local `.env` references project `fofdncueyrwclvsmdcit`.
- That project is not present in the project list returned by the currently authenticated
  Supabase account.
- Its API and database hostnames no longer resolve in DNS, and its REST endpoint is
  unreachable. This strongly indicates that the project was deleted or that the saved
  project reference is obsolete.
- A different project, `Land Database` (`hfgfmucgwbthckxxwyas`), still exists in the same
  authenticated account but is currently `INACTIVE` (paused).

### Actions taken

- Performed read-only project, endpoint, and DNS checks.
- Did not restore, recreate, migrate, or otherwise modify any Supabase project.

### Next safe step

- Confirm whether `Land Database` is intended to replace the deleted project. If so, restore
  it first, inspect its current schema and data, and only then decide whether to point the app
  at it or create a clean Roam project.

## 2026-09-01 — Repository handoff integrated

### Completed

- Confirmed the Git root is `Travel-App-` and the remote is
  `https://github.com/akhilroy131-ui/Travel-App-.git`.
- Integrated the agent brief, constitution, decisions, frontend plan, first specification,
  and five ordered migrations into their repository-root locations.
- Added `CLAUDE.md` as the one-line import for `AGENTS.md`.
- Added this progress log and made maintaining it an explicit agent rule.
- Kept local agent settings, MCP credentials, dependency folders, native build output, and
  backup folders out of Git.

### Verification

- `npx tsc --noEmit` passed before the preceding local app commit.
- The migration files are present in numeric order under `supabase/migrations/`.
- No migration has been applied to a live or local database during this step.
- No commit or push was performed for this handoff integration.

### Existing local commit

- `c0f5c5f feat: migrate maps to Google and sync app schema`
- This commit is local and has not been pushed.
- The handoff documents choose Mapbox behind a `RoamMap` abstraction, while the existing
  local commit switches the app to Google Maps. Resolve this conflict before the next app
  implementation commit.

### Security note

- A Supabase personal access token was found in the ignored root `.mcp.json`. The file was
  not staged or committed. Revoke or rotate that token before connecting tooling again.

### Next safe steps

1. Confirm or take a Supabase backup before applying migration `0001_host_model.sql`; it
   drops `profiles.role`.
2. Decide whether Mapbox or Google Maps is the V1 provider, preserving the `RoamMap`
   abstraction either way.
3. Apply migrations `0001` through `0005` one at a time, stopping on the first error.
4. Regenerate `V1/types/database.ts` from the linked Supabase project.
5. Implement `specs/001-image-pipeline-and-ci.md` before feature work.
6. Commit and push only after reviewing the complete staged diff and verification results.

## Open product decisions

- Anonymous browsing policy: the candidate policy in `0005_policy_fixes.sql` remains
  commented out.
- Geocoding provider for host listing creation.
