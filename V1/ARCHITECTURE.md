# Roam — Architecture

## Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | React Native + Expo | SDK 55 |
| Language | TypeScript | ~5.9 (strict: false) |
| Navigation | React Navigation v7 (native-stack + bottom-tabs) | ^7 |
| Backend | Supabase (Auth, PostgreSQL, Realtime, Storage) | ^2 |
| Maps | @rnmapbox/maps (Phase 8) | TBD |
| State | React hooks only — no Redux/Zustand in v1 | — |
| Auth (v1) | Email/password, Google OAuth, Apple Sign-In | — |

---

## Folder Structure

```
V1/
├── App.tsx                        ← Root: NavigationContainer + providers
├── app.config.js                  ← Expo dynamic config (reads .env)
├── .env                           ← NOT committed — copy from .env.example
├── .env.example                   ← Committed — shows required env var names
│
├── assets/                        ← Static fonts, images, icons
│
├── constants/
│   ├── theme.ts                   ← Colors, Typography, Spacing, BorderRadius, Shadow
│   ├── categories.ts              ← CATEGORIES array (id, label, icon, color)
│   └── config.ts                  ← Pagination sizes, map defaults, bucket names
│
├── types/
│   ├── models.ts                  ← Core data interfaces: Experience, Profile, Review, Post…
│   └── navigation.ts              ← RootStackParamList, AppTabsParamList, ExperienceStackParamList, AuthStackParamList
│
├── lib/
│   ├── supabase.ts                ← createClient() with ExpoSecureStore adapter — typed export
│   ├── auth.ts                    ← signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithApple, signOut
│   └── storage.ts                 ← uploadAvatar, uploadExperiencePhoto, uploadPostPhoto, pickImageFromLibrary
│
├── hooks/
│   ├── auth/
│   │   └── useAuth.ts             ← session, user, loading, signOut (onAuthStateChange subscriber)
│   ├── experiences/
│   │   ├── useExperiences.ts      ← list with category/distance/rating filters
│   │   ├── useExperience.ts       ← single experience + joined host + photos
│   │   ├── useNearbyExperiences.ts ← PostGIS radius query for map pins → ExperiencePin[]
│   │   └── useHostExperiences.ts  ← experiences by host_id
│   ├── reviews/
│   │   ├── useReviews.ts          ← reviews for an experience
│   │   └── useSubmitReview.ts     ← mutation hook
│   ├── posts/
│   │   ├── usePosts.ts            ← posts for a user or tagged host
│   │   ├── useCreatePost.ts       ← upload + insert mutation
│   │   └── useToggleLike.ts       ← optimistic like/unlike
│   └── profiles/
│       ├── useProfile.ts          ← profile by ID
│       └── useUpdateProfile.ts    ← mutation hook
│
├── components/
│   ├── ui/                        ← Atomic, domain-unaware
│   │   ├── Button.tsx
│   │   ├── IconButton.tsx
│   │   ├── Tag.tsx
│   │   ├── Avatar.tsx
│   │   ├── Divider.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorMessage.tsx
│   │   └── SafeScrollView.tsx
│   ├── StarRating.tsx
│   ├── ExperienceCard.tsx
│   ├── HostBadge.tsx
│   ├── CategoryFilter.tsx
│   ├── PhotoGallery.tsx
│   ├── PhotoWall.tsx
│   ├── PhotoWallPost.tsx
│   ├── ReviewList.tsx
│   ├── ReviewItem.tsx
│   ├── ReviewForm.tsx
│   ├── MapPin.tsx
│   └── ExperiencePreviewSheet.tsx
│
├── screens/
│   ├── auth/
│   │   ├── WelcomeScreen.tsx
│   │   ├── SignInScreen.tsx
│   │   └── SignUpScreen.tsx
│   ├── map/
│   │   └── MapScreen.tsx
│   ├── experiences/
│   │   ├── ExperiencesListScreen.tsx
│   │   └── ExperienceDetailScreen.tsx
│   ├── host/
│   │   └── HostLandingScreen.tsx
│   └── profile/
│       └── CustomerProfileScreen.tsx
│
└── navigation/
    ├── RootNavigator.tsx          ← Auth gate: AuthStack vs AppTabs (based on useAuth session)
    ├── AuthStack.tsx              ← Welcome → SignIn → SignUp
    ├── AppTabs.tsx                ← Bottom tabs: Map | Experiences | Profile
    └── ExperienceStack.tsx        ← ExperiencesList → ExperienceDetail → HostLanding
```

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Component files | PascalCase | `ExperienceCard.tsx` |
| Hook files | camelCase, `use` prefix | `useExperiences.ts` |
| Lib / util files | camelCase | `supabase.ts`, `auth.ts` |
| Screen files | PascalCase + `Screen` suffix | `MapScreen.tsx` |
| Type interfaces | PascalCase | `Experience`, `HostBadgeProps` |
| Props interfaces | `ComponentNameProps` | `ExperienceCardProps` |
| Constants (scalar) | SCREAMING_SNAKE_CASE | `MAX_PHOTO_SIZE` |
| Constants (objects) | PascalCase | `CATEGORIES`, `Colors` |
| DB columns | snake_case | `host_id`, `avg_rating` |

---

## Key Architectural Rules

1. **All Supabase queries live in hooks or lib only.** Screens and components never import `supabase` directly.
2. **Components are props-driven.** No component fetches its own data — except `ExperiencePreviewSheet` (documented exception: lazy-loads experience data on map pin tap to keep map layer lean).
3. **Navigation types are enforced.** All `navigation.navigate()` calls use typed param lists from `types/navigation.ts`.
4. **Storage URLs are resolved at the hook layer** before being passed to components. Components receive resolved `string | null` URLs only.
5. **Denormalized fields** (`avg_rating`, `review_count`, `like_count`) are maintained by Postgres triggers — never computed client-side.
6. **No inline styles** — all styles defined via `StyleSheet.create()` at the bottom of each file.
7. **Theme tokens always** — never use raw hex colours or magic numbers; always import from `constants/theme.ts`.

---

## Environment Variables

```
EXPO_PUBLIC_SUPABASE_URL=        ← Supabase project URL
EXPO_PUBLIC_SUPABASE_ANON_KEY=   ← Supabase anon/public key
EXPO_PUBLIC_MAPBOX_TOKEN=        ← Mapbox access token (Phase 8)
```

These are read in `app.config.js` and passed to the app via `Constants.expoConfig.extra`.
Copy `.env.example` → `.env` and fill in real values. **Never commit `.env`.**

---

## Auth Flow

```
App opens
  └─ RootNavigator reads useAuth()
       ├─ loading = true → show ActivityIndicator
       ├─ session = null → show AuthStack (Welcome → SignIn/SignUp)
       └─ session exists → show AppTabs
            └─ On sign-out → useAuth detects session null → AuthStack shown
```

`useAuth` subscribes to `supabase.auth.onAuthStateChange` for live session updates.
On sign-up, a Postgres trigger auto-creates a `profiles` row from `auth.users`.

---

## Navigation Structure

```
RootNavigator (NativeStack, no header)
├── Auth (AuthStack)
│   ├── Welcome
│   ├── SignIn
│   └── SignUp
└── App (AppTabs — bottom tab navigator)
    ├── Map tab → MapScreen
    ├── Experiences tab → ExperienceStack (NativeStack)
    │   ├── ExperiencesList
    │   ├── ExperienceDetail
    │   └── HostLanding
    └── Profile tab → CustomerProfileScreen
```

**Cross-tab navigation** (e.g. Map pin → ExperienceDetail):
```typescript
navigation.navigate('Experiences', {
  screen: 'ExperienceDetail',
  params: { experienceId: id }
})
```

---

## Build Order

| Phase | What | Why first |
|---|---|---|
| 1 | Scaffolding + constants + types + lib | Everything imports these |
| 2 | Auth screens + useAuth | Required before any protected screen |
| 3 | Atomic UI components | Every domain component depends on these |
| 4 | Experiences List Screen | First end-to-end Supabase data flow |
| 5 | Experience Detail Screen | Builds on list; adds gallery + reviews |
| 6 | Host Landing Page | Builds on detail; adds photo wall |
| 7 | Customer Profile | Adds post creation + likes |
| 8 | Map Screen (last) | Mapbox native setup is friction-heavy |
| 9 | Polish | Empty states, skeletons, pull-to-refresh |
