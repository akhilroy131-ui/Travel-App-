export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      availability_rules: {
        Row: {
          capacity: number
          created_at: string
          experience_id: string
          id: string
          start_time: string | null
          valid_from: string
          valid_to: string
          weekdays: number[]
        }
        Insert: {
          capacity?: number
          created_at?: string
          experience_id: string
          id?: string
          start_time?: string | null
          valid_from: string
          valid_to: string
          weekdays: number[]
        }
        Update: {
          capacity?: number
          created_at?: string
          experience_id?: string
          id?: string
          start_time?: string | null
          valid_from?: string
          valid_to?: string
          weekdays?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "availability_rules_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booked_date: string
          created_at: string
          experience_id: string
          guest_count: number
          id: string
          payment_intent_id: string | null
          payment_status: string
          status: string
          total_price: number
          traveller_id: string
          updated_at: string
        }
        Insert: {
          booked_date: string
          created_at?: string
          experience_id: string
          guest_count?: number
          id?: string
          payment_intent_id?: string | null
          payment_status?: string
          status?: string
          total_price: number
          traveller_id: string
          updated_at?: string
        }
        Update: {
          booked_date?: string
          created_at?: string
          experience_id?: string
          guest_count?: number
          id?: string
          payment_intent_id?: string | null
          payment_status?: string
          status?: string
          total_price?: number
          traveller_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_traveller_id_fkey"
            columns: ["traveller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_reveals: {
        Row: {
          host_id: string
          id: string
          revealed_at: string
          viewer_id: string
        }
        Insert: {
          host_id: string
          id?: string
          revealed_at?: string
          viewer_id: string
        }
        Update: {
          host_id?: string
          id?: string
          revealed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_reveals_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "host_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_reveals_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_availability: {
        Row: {
          capacity: number
          created_at: string
          experience_id: string
          id: string
          is_blocked: boolean
          price_override: number | null
          seats_taken: number
          slot_date: string
          source_rule_id: string | null
          start_time: string | null
          updated_at: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          experience_id: string
          id?: string
          is_blocked?: boolean
          price_override?: number | null
          seats_taken?: number
          slot_date: string
          source_rule_id?: string | null
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          experience_id?: string
          id?: string
          is_blocked?: boolean
          price_override?: number | null
          seats_taken?: number
          slot_date?: string
          source_rule_id?: string | null
          start_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "experience_availability_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_availability_source_rule_id_fkey"
            columns: ["source_rule_id"]
            isOneToOne: false
            referencedRelation: "availability_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_photos: {
        Row: {
          created_at: string
          display_order: number
          experience_id: string
          id: string
          uploaded_by: string | null
          url: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          experience_id: string
          id?: string
          uploaded_by?: string | null
          url: string
        }
        Update: {
          created_at?: string
          display_order?: number
          experience_id?: string
          id?: string
          uploaded_by?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "experience_photos_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      experiences: {
        Row: {
          avg_rating: number
          category: string
          cover_image_url: string | null
          created_at: string
          currency: string
          description: string
          duration_minutes: number | null
          host_id: string
          id: string
          is_published: boolean
          location_geo: unknown
          location_lat: number
          location_lng: number
          location_name: string
          max_guests: number | null
          price: number
          review_count: number
          save_count: number
          search_vector: unknown
          title: string
          updated_at: string
        }
        Insert: {
          avg_rating?: number
          category: string
          cover_image_url?: string | null
          created_at?: string
          currency: string
          description?: string
          duration_minutes?: number | null
          host_id: string
          id?: string
          is_published?: boolean
          location_geo?: unknown
          location_lat: number
          location_lng: number
          location_name: string
          max_guests?: number | null
          price: number
          review_count?: number
          save_count?: number
          search_vector?: unknown
          title: string
          updated_at?: string
        }
        Update: {
          avg_rating?: number
          category?: string
          cover_image_url?: string | null
          created_at?: string
          currency?: string
          description?: string
          duration_minutes?: number | null
          host_id?: string
          id?: string
          is_published?: boolean
          location_geo?: unknown
          location_lat?: number
          location_lng?: number
          location_name?: string
          max_guests?: number | null
          price?: number
          review_count?: number
          save_count?: number
          search_vector?: unknown
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiences_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      host_contacts: {
        Row: {
          host_id: string
          phone_country: string | null
          phone_e164: string | null
          updated_at: string
        }
        Insert: {
          host_id: string
          phone_country?: string | null
          phone_e164?: string | null
          updated_at?: string
        }
        Update: {
          host_id?: string
          phone_country?: string | null
          phone_e164?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "host_contacts_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: true
            referencedRelation: "host_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      host_profiles: {
        Row: {
          created_at: string
          headline: string | null
          id: string
          languages: string[]
          phone_verified: boolean
          updated_at: string
          verification_status: string
        }
        Insert: {
          created_at?: string
          headline?: string | null
          id: string
          languages?: string[]
          phone_verified?: boolean
          updated_at?: string
          verification_status?: string
        }
        Update: {
          created_at?: string
          headline?: string | null
          id?: string
          languages?: string[]
          phone_verified?: boolean
          updated_at?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "host_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          caption: string | null
          created_at: string
          experience_id: string | null
          id: string
          image_url: string
          like_count: number
          tagged_host_id: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          caption?: string | null
          created_at?: string
          experience_id?: string | null
          id?: string
          image_url: string
          like_count?: number
          tagged_host_id?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          caption?: string | null
          created_at?: string
          experience_id?: string | null
          id?: string
          image_url?: string
          like_count?: number
          tagged_host_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_tagged_host_id_fkey"
            columns: ["tagged_host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          id: string
          is_host: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          id: string
          is_host?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_host?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          author_id: string
          body: string | null
          booking_id: string | null
          created_at: string
          experience_id: string
          id: string
          rating: number
          updated_at: string
        }
        Insert: {
          author_id: string
          body?: string | null
          booking_id?: string | null
          created_at?: string
          experience_id: string
          id?: string
          rating: number
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string | null
          booking_id?: string | null
          created_at?: string
          experience_id?: string
          id?: string
          rating?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_experiences: {
        Row: {
          created_at: string
          experience_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          experience_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          experience_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_experiences_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_experiences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_availability: {
        Args: { p_experience_id: string; p_from?: string; p_to?: string }
        Returns: number
      }
      get_host_contact: {
        Args: { target_host_id: string }
        Returns: {
          phone_country: string
          phone_e164: string
          phone_verified: boolean
        }[]
      }
      get_nearby_experiences: {
        Args: { radius_km?: number; ref_lat: number; ref_lng: number }
        Returns: {
          avg_rating: number
          category: string
          currency: string
          id: string
          location_lat: number
          location_lng: number
          price: number
          title: string
        }[]
      }
      search_experiences: {
        Args: {
          p_category?: string
          p_date_from?: string
          p_date_to?: string
          p_lat?: number
          p_limit?: number
          p_lng?: number
          p_min_rating?: number
          p_offset?: number
          p_price_max?: number
          p_price_min?: number
          p_query?: string
          p_radius_km?: number
          p_sort?: string
        }
        Returns: {
          avg_rating: number
          category: string
          cover_image_url: string
          currency: string
          distance_km: number
          host_id: string
          id: string
          location_lat: number
          location_lng: number
          location_name: string
          next_available: string
          price: number
          review_count: number
          save_count: number
          title: string
          total_count: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
