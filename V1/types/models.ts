// Roam — Core Data Models
// These match the Supabase schema defined in SUPABASE_SCHEMA.md

export type ExperienceCategory =
  | 'food_drink'
  | 'adventure_outdoors'
  | 'culture_history'
  | 'wellness_mindfulness'

export type UserRole = 'traveller' | 'host'

export interface Profile {
  id: string
  role: UserRole
  display_name: string
  avatar_url: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

export interface Experience {
  id: string
  host_id: string
  title: string
  description: string
  category: ExperienceCategory
  price: number
  currency: string
  location_lat: number
  location_lng: number
  location_name: string
  cover_image_url: string | null
  is_published: boolean
  avg_rating: number
  review_count: number
  max_guests: number | null
  duration_minutes: number | null
  created_at: string
  updated_at: string
  // Joined relations (populated selectively by hooks)
  host?: Profile
  photos?: ExperiencePhoto[]
}

// Lightweight type used only for map pin rendering (matches get_nearby_experiences RPC columns)
export interface ExperiencePin {
  id: string
  title: string
  category: ExperienceCategory
  location_lat: number
  location_lng: number
  price: number
  avg_rating: number
}

export interface ExperiencePhoto {
  id: string
  experience_id: string
  url: string
  display_order: number
  uploaded_by: string | null
  created_at: string
}

export interface Review {
  id: string
  experience_id: string
  author_id: string
  rating: number
  body: string | null
  booking_id: string | null
  created_at: string
  updated_at: string
  // Joined
  author?: Profile
}

export interface Post {
  id: string
  author_id: string
  experience_id: string | null
  tagged_host_id: string | null
  image_url: string
  caption: string | null
  like_count: number
  created_at: string
  updated_at: string
  // Joined
  author?: Profile
  tagged_host?: Profile
}

export interface PostLike {
  post_id: string
  user_id: string
  created_at: string
}

// v2 schema — no UI in v1
export interface Booking {
  id: string
  experience_id: string
  traveller_id: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  booked_date: string
  guest_count: number
  total_price: number
  payment_intent_id: string | null
  payment_status: 'unpaid' | 'paid' | 'refunded'
  created_at: string
  updated_at: string
}

// Filter state for the Experiences List Screen
export interface ExperienceFilters {
  category: ExperienceCategory | null
  radiusKm: number
  minRating: number | null
  sortBy: 'distance' | 'rating' | 'price_asc' | 'price_desc' | 'newest'
}
