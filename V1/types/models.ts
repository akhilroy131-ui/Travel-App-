// Roam — app-facing data models built from the generated Supabase contract.

import type { Database, Tables } from './database'

export type ExperienceCategory =
  | 'food_drink'
  | 'adventure_outdoors'
  | 'culture_history'
  | 'wellness_mindfulness'

export type Profile = Tables<'profiles'>

export type Experience = Omit<Tables<'experiences'>, 'category'> & {
  category: ExperienceCategory
  // Joined relations (populated selectively by hooks)
  host?: Profile
  photos?: ExperiencePhoto[]
}

// Lightweight type used only for map pin rendering (matches get_nearby_experiences RPC columns)
type NearbyExperience =
  Database['public']['Functions']['get_nearby_experiences']['Returns'][number]

export type ExperiencePin = Omit<NearbyExperience, 'category'> & {
  category: ExperienceCategory
}

export type ExperiencePhoto = Tables<'experience_photos'>

export type Review = Tables<'reviews'> & {
  // Joined
  author?: Profile
}

export type Post = Tables<'posts'> & {
  // Joined
  author?: Profile
  tagged_host?: Profile
}

export type PostLike = Tables<'post_likes'>

// v2 schema — no UI in v1
export type Booking = Tables<'bookings'>

// Filter state for the Experiences List Screen
export interface ExperienceFilters {
  category: ExperienceCategory | null
  radiusKm: number
  minRating: number | null
  sortBy: 'distance' | 'rating' | 'price_asc' | 'price_desc' | 'newest'
}
