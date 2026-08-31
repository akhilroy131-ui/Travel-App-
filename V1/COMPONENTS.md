# Roam — Component Library

All components live in `/components`. They are props-driven and contain no data-fetching logic.
Custom hooks live in `/hooks` and are called only from screen files (with one documented exception).

**Rule:** Components never import `supabase`. All data flows in via props from screen-level hooks.

---

## Atomic UI (`/components/ui/`)

These components have no domain knowledge — they work with any data.

### `Button`
General-purpose button with 4 variants.

```typescript
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps {
  label: string
  onPress: () => void
  variant?: ButtonVariant   // default: 'primary'
  loading?: boolean         // shows ActivityIndicator, disables press
  disabled?: boolean
  icon?: React.ReactElement // optional left-side icon
  style?: ViewStyle
}
```

### `IconButton`
Circular pressable icon, used for close/back/action buttons.

```typescript
interface IconButtonProps {
  icon: React.ReactElement
  onPress: () => void
  size?: number             // default: 40
  backgroundColor?: string
  style?: ViewStyle
}
```

### `Tag`
Pill-shaped label chip for categories, status badges, etc.

```typescript
interface TagProps {
  label: string
  color?: string            // background colour
  textColor?: string        // default: white
  size?: 'sm' | 'md'        // default: 'md'
  style?: ViewStyle
}
```

### `Avatar`
Circular image with text initial fallback.

```typescript
interface AvatarProps {
  uri: string | null
  size?: number             // default: 40
  fallbackInitials?: string // shown when uri is null, e.g. "AK"
  style?: ViewStyle
}
```

### `LoadingSpinner`
Centred `ActivityIndicator` with optional label.

```typescript
interface LoadingSpinnerProps {
  size?: 'small' | 'large' // default: 'large'
  color?: string            // default: Colors.accent
  label?: string
}
```

### `ErrorMessage`
Error display with optional retry button.

```typescript
interface ErrorMessageProps {
  message: string
  onRetry?: () => void
}
```

### `SectionHeader`
Row with title and optional right-side action link.

```typescript
interface SectionHeaderProps {
  title: string
  actionLabel?: string
  onActionPress?: () => void
  style?: ViewStyle
}
```

### `SafeScrollView`
`ScrollView` wrapped in `SafeAreaView` with standard horizontal padding.

```typescript
interface SafeScrollViewProps {
  children: React.ReactNode
  style?: ViewStyle
  contentContainerStyle?: ViewStyle
}
```

### `Divider`
Horizontal rule using `Colors.surfaceBorder`.

```typescript
interface DividerProps {
  style?: ViewStyle
}
```

---

## Domain Components (`/components/`)

### `StarRating`
Renders 1–5 stars. Supports display-only and interactive (tap-to-rate) modes.

```typescript
interface StarRatingProps {
  rating: number             // 0–5; decimals supported in display mode
  maxStars?: number          // default: 5
  size?: number              // star icon size in px, default: 16
  color?: string             // filled colour, default: Colors.star
  interactive?: boolean      // false = display only
  onRatingChange?: (rating: number) => void  // required when interactive: true
}
```

---

### `ExperienceCard`
Full card used in list views (Phase 4). Composes `HostBadge` (small), `StarRating`, and `Tag`.

```typescript
interface ExperienceCardProps {
  experience: Experience       // full Experience object with host joined
  onPress: (id: string) => void
  style?: ViewStyle
}
```

Renders:
- Cover image (16:9 aspect ratio)
- Category `Tag` overlaid top-left on image
- Title, price, `StarRating` (display) below image
- `HostBadge` (small variant) overlaid bottom-left on image

---

### `HostBadge`
Host identifier with avatar and star rating badge. Used on `ExperienceCard` (small) and `ExperienceDetailScreen` (large).

```typescript
type HostBadgeVariant = 'small' | 'large'

interface HostBadgeProps {
  host: Pick<Profile, 'id' | 'display_name' | 'avatar_url'>
  avgRating?: number         // shown as ★ X.X badge overlaid on avatar
  reviewCount?: number       // shown in large variant only
  variant?: HostBadgeVariant // default: 'small'
  onPress?: () => void       // navigate to HostLandingScreen
}
```

`small`: Avatar (28px) + display_name in a compact pill. Used inside ExperienceCard.
`large`: Avatar (56px) + display_name + star rating row + review count. Used on ExperienceDetail. Must be visually distinct from the experience's own rating (different layout, labelled "Host rating").

---

### `CategoryFilter`
Horizontal scrollable filter chip row. Used at the top of ExperiencesListScreen.

```typescript
interface CategoryFilterProps {
  selected: ExperienceCategory | null  // null = "All" selected
  onSelect: (category: ExperienceCategory | null) => void
  style?: ViewStyle
}
```

Renders: "All" chip first, then one chip per entry in `CATEGORIES` constant. Uses `Tag` internally.

---

### `PhotoGallery`
Horizontal paginated image gallery for experience photos.

```typescript
interface PhotoGalleryProps {
  photos: ExperiencePhoto[]
  initialIndex?: number       // default: 0
  mode?: 'carousel' | 'modal' // default: 'carousel'
  onClose?: () => void        // required in modal mode
}
```

`carousel`: Inline horizontal `FlatList` with pagination dots below.
`modal`: Full-screen overlay with a close button. Tap a carousel image to open modal.

---

### `ReviewList`
`FlatList` wrapper for reviews. Used on ExperienceDetailScreen.

```typescript
interface ReviewListProps {
  reviews: Review[]           // each Review should have author joined
  loading?: boolean
  ListHeaderComponent?: React.ReactElement
}
```

---

### `ReviewItem`
Single review row rendered inside `ReviewList`.

```typescript
interface ReviewItemProps {
  review: Review              // with author joined
}
```

Renders: Author `Avatar` + `display_name`, `StarRating` (display), formatted date, body text.

---

### `ReviewForm`
Star selector + text input for submitting a review.

```typescript
interface ReviewFormProps {
  experienceId: string
  onSubmitSuccess?: () => void
}
```

**v1 note:** Renders a "Complete a booking to review this experience" info banner above the form. The form itself is functional — `booking_id` will be null in v1. In v2, gate submission on a confirmed booking.

---

### `PhotoWall`
Instagram-style 3-column photo grid using `FlatList`. Used on HostLandingScreen and CustomerProfileScreen.

```typescript
interface PhotoWallProps {
  posts: Post[]
  numColumns?: number           // default: 3
  onPostPress: (post: Post) => void
  onLikePress?: (postId: string) => void
  currentUserId?: string        // to show liked state
  ListHeaderComponent?: React.ReactElement
  ListEmptyComponent?: React.ReactElement
}
```

---

### `PhotoWallPost`
Single tile in the `PhotoWall` grid.

```typescript
interface PhotoWallPostProps {
  post: Post
  size: number                  // tile width and height in px (calculated from screen width)
  onPress: () => void
  onLikePress?: () => void
  isLiked?: boolean
}
```

Renders: Full-bleed image with heart icon + `like_count` overlaid at bottom.

---

### `ExperienceCardSkeleton`
Pulsing placeholder card shown while experience list is loading (first page only).
Matches the layout of `ExperienceCard` — same aspect-ratio image block, same info row.

```typescript
interface ExperienceCardSkeletonProps {
  style?: ViewStyle
}
```

Uses `Animated.loop` with opacity 0.4 → 1 → 0.4 at 700 ms per step. No extra deps.

---

### `ErrorBoundary`
React class component that catches render-phase errors from its subtree.
Wraps the entire app in `App.tsx`. Renders a themed fallback UI with a "Try Again" button that resets the error state.

```typescript
interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode   // custom fallback; uses built-in themed UI if omitted
}
```

---

### `MapPin`
Custom `react-native-maps` marker content (Phase 8). Colour reflects category.

```typescript
interface MapPinProps {
  pin: ExperiencePin
  isSelected?: boolean          // enlarges pin, shows price label
  onPress: (pin: ExperiencePin) => void
}
```

---

### `ExperiencePreviewSheet`
Bottom sheet shown when a map pin is tapped (Phase 8).

```typescript
interface ExperiencePreviewSheetProps {
  experienceId: string | null   // null collapses the sheet
  onViewDetail: (id: string) => void
  onDismiss: () => void
}
```

**Documented exception to the no-fetching rule:** This component calls `useExperience(experienceId)` internally. Rationale: The map layer only carries lightweight `ExperiencePin` data. Loading full experience data inside the sheet keeps the map rendering lean and only fetches on demand.

Renders: Cover image, title, location name, price, `StarRating` (display), "View Experience" button.

---

## Component Composition Map

```
ExperiencesListScreen
  └─ ExperienceCard
       ├─ Tag (category)
       ├─ StarRating (display)
       └─ HostBadge (small)

ExperienceDetailScreen
  ├─ PhotoGallery
  ├─ StarRating (display) ← experience rating
  ├─ HostBadge (large)    ← host rating (visually separate)
  └─ ReviewList
       └─ ReviewItem
            ├─ Avatar
            └─ StarRating (display)

HostLandingScreen
  ├─ Avatar (large host photo)
  ├─ ExperienceCard (for each experience, tappable)
  └─ PhotoWall
       └─ PhotoWallPost

CustomerProfileScreen
  ├─ Avatar
  └─ PhotoWall
       └─ PhotoWallPost

MapScreen
  ├─ MapPin (one per experience)
  └─ ExperiencePreviewSheet
       └─ StarRating (display)
```
