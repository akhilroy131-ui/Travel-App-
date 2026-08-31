# Roam — V1 project handoff

Roam is an Expo SDK 55 + React Native application backed by Supabase. Application source
lives in `V1/`; the live database schema is reproduced by the timestamped migrations in
`supabase/migrations/`.

## Current Supabase project

- Project: `Roam`
- Project reference: `klbyqbsznbydpmlpbtfc`
- Region: `ap-south-1`
- Local app connection: `V1/.env` (ignored by Git)
- Generated database contract: `V1/types/database.ts`

The live project was created and migrated on 2026-09-01. Do not run the files under
`supabase/reference-migrations/`; they are preserved only as the historical design handoff
that preceded the consolidated clean-install migrations.

## Schema installation order

Apply the files in `supabase/migrations/` by timestamp:

1. `20260831203210_initial_roam_schema.sql`
2. `20260831203224_configure_storage_buckets.sql`
3. `20260831203931_harden_extensions_and_indexes.sql`
4. `20260831204931_restrict_data_api_grants.sql`

The migrations create 13 RLS-protected application tables, the search/nearby/availability/
contact RPCs, PostGIS and trigram search support, three image storage buckets with
authenticated write policies, and an explicit least-privilege Data API surface.

## Working agreements

- Read `AGENTS.md` and `constitution.md` before implementation work.
- Treat `supabase/migrations/` as the database source of truth.
- Record material work and verification evidence in `docs/PROGRESS.md`.
- Regenerate `V1/types/database.ts` after any schema change.
- Never commit `.env`, `.mcp.json`, credentials, dependency folders, or native build output.
- Commit and push only after reviewing the complete diff and verification results.

## Next implementation sequence

1. Align the app's old `profiles.role` assumptions with the new opt-in `profiles.is_host`
   model and wire the generated database types into the Supabase client.
2. Resolve the existing Google Maps implementation versus the documented Mapbox abstraction.
3. Implement `specs/001-image-pipeline-and-ci.md` before adding feature work.
4. Configure Supabase Auth redirect URLs and any OAuth providers required for release.

See `docs/PROGRESS.md` for live status and `docs/DECISIONS.md` for design rationale.
