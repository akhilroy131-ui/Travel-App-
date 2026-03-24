// App-wide configuration constants

export const Config = {
  // Pagination
  EXPERIENCES_PAGE_SIZE: 20,
  REVIEWS_PAGE_SIZE: 10,
  POSTS_PAGE_SIZE: 30,

  // Map defaults (lat/lng centre on app open before user location is known)
  MAP_DEFAULT_LAT: 40.7128,
  MAP_DEFAULT_LNG: -74.006,
  MAP_DEFAULT_ZOOM: 12,

  // Distance filter options (in km)
  DISTANCE_OPTIONS_KM: [5, 10, 25, 50, 100],
  DEFAULT_RADIUS_KM: 25,

  // Max file sizes (bytes)
  MAX_AVATAR_SIZE: 5 * 1024 * 1024,        // 5 MB
  MAX_EXPERIENCE_PHOTO_SIZE: 10 * 1024 * 1024, // 10 MB
  MAX_POST_PHOTO_SIZE: 10 * 1024 * 1024,   // 10 MB

  // Supabase storage bucket names
  BUCKET_AVATARS: 'avatars',
  BUCKET_EXPERIENCE_PHOTOS: 'experience-photos',
  BUCKET_POST_PHOTOS: 'post-photos',
}
