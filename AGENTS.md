# Roam — Agent Brief

Expo (SDK 55) + React Native + TypeScript strict. Supabase (Postgres + Auth + Storage).
Mapbox via `@rnmapbox/maps`. App source lives in `V1/`.

## Commands
```bash
cd V1 && npm install
npx expo start                      # dev server (needs a dev build, NOT Expo Go — Mapbox is native)
npx expo run:ios                    # build + run iOS
npx expo run:android                # build + run Android
npx tsc --noEmit                    # typecheck — must pass before any commit
npx supabase db push                # apply migrations in supabase/migrations
npx supabase gen types typescript --linked > V1/types/database.ts
maestro test V1/e2e/                # E2E flows
```

## Do
- Read `constitution.md` before writing code. Its rules are not negotiable.
- Update `docs/PROGRESS.md` after each material implementation, migration, or verification step.
- Put every Supabase call in `V1/hooks/**` or `V1/lib/**`. Never in a screen or component.
- Use generated types from `V1/types/database.ts`. Do not hand-write DB types.
- Compress every image before upload (see constitution §4).
- Add or update a test in the same change as the feature.

## Don't
- Don't disable, weaken, or bypass an RLS policy to make something work.
- Don't import `@rnmapbox/maps` outside `V1/components/map/`.
- Don't add a dependency without saying why in the PR body.
- Don't edit `V1/types/database.ts` by hand — regenerate it.

## Reference (read only when relevant, do not summarise into this file)
- `constitution.md` — hard rules
- `docs/DECISIONS.md` — what changed from the original build and why
- `docs/PROGRESS.md` — completed work, verification evidence, and the next safe step
- `V1/ARCHITECTURE.md` — folder layout, naming, navigation
- `supabase/migrations/` — schema is the source of truth, not the docs
