# Spec 001 — Image pipeline and verification loop

**Do this first.** It fixes a bug that silently corrupts uploads, removes the constraint
that would end the project on the Supabase free tier, and puts the test/CI harness in place
before the volume of agent-generated code goes up.

Sized for one Claude Code session.

## Problem

Three things, all in the upload path.

1. `V1/lib/storage.ts` converts files with `fetch(uri).then(r => r.blob())`. React Native's
   Blob implementation is incomplete; this pattern silently produces **0-byte uploads** and
   blows memory on large images. It affects all three upload functions.

2. Nothing resizes or compresses. Uploads go through at `quality: 0.85` full resolution —
   4–8MB per modern phone photo. Supabase free tier gives **1GB of storage**, so roughly
   150–250 photos before the app stops working. The core loop of this product is a photo
   wall.

3. `constants/config.ts` declares `MAX_AVATAR_SIZE`, `MAX_EXPERIENCE_PHOTO_SIZE`,
   `MAX_POST_PHOTO_SIZE` and nothing anywhere reads them. Dead constants.

## Requirements

- The system SHALL resize every uploaded image to a longest edge of 1600px before upload.
- The system SHALL produce a 400px thumbnail for every uploaded image.
- The system SHALL reject any image exceeding the limit in `constants/config.ts`, with a
  user-visible message.
- The system SHALL NOT use `Blob` in the upload path.
- When an upload fails, the system SHALL surface the error to the caller rather than
  returning `null` after a `console.error`.

## Out of scope

Do not touch the UI of any screen. Do not migrate hooks to TanStack Query — that is spec 003.
Do not add a CDN or image transformation service.

## Approach

- New `V1/lib/images.ts` owning resize/compress/thumbnail via `expo-image-manipulator`.
- Rewrite `V1/lib/storage.ts` to read base64 (`expo-file-system`) and decode to an
  ArrayBuffer for upload.
- Upload functions return a discriminated result (`{ ok: true, url, thumbUrl }` |
  `{ ok: false, error }`), not `string | null`.
- Store thumbnails under a `thumb/` prefix in the same bucket.

## Verification

- Unit test: `images.ts` resizes a 4000px fixture to 1600px longest edge.
- Unit test: an oversized file is rejected before any network call.
- Unit test: upload result shape is correct on both success and failure.
- Manual: upload a real photo on a device and confirm non-zero object size in the Supabase
  dashboard. This is the check that catches the Blob bug — it will not fail in a unit test.

## Also in this spec: the harness

Nothing in this repo currently verifies anything. Add:

- `npm run typecheck` → `tsc --noEmit`
- ESLint + Prettier, minimal config
- Jest + `@testing-library/react-native`
- `.github/workflows/ci.yml` running typecheck, lint, test, and Semgrep on every PR
- Maestro installed with one smoke flow: launch → sign in → see the experiences list

## Done when

- `npx tsc --noEmit` passes.
- CI is green on a pull request.
- A photo uploaded from a real device appears in Supabase at under 500KB with a thumbnail
  beside it.
- `grep -r "\.blob()" V1/` returns nothing.
