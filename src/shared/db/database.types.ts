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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      boat_images_analysis: {
        Row: {
          ai_model_used: string | null
          analysis: string | null
          analyzed_at: string | null
          area_analyzed: string | null
          condition_score: number | null
          id: string
          image_order: number
          image_url: string
          issues_found: string[]
          listing_id: string
        }
        Insert: {
          ai_model_used?: string | null
          analysis?: string | null
          analyzed_at?: string | null
          area_analyzed?: string | null
          condition_score?: number | null
          id?: string
          image_order?: number
          image_url: string
          issues_found?: string[]
          listing_id: string
        }
        Update: {
          ai_model_used?: string | null
          analysis?: string | null
          analyzed_at?: string | null
          area_analyzed?: string | null
          condition_score?: number | null
          id?: string
          image_order?: number
          image_url?: string
          issues_found?: string[]
          listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boat_images_analysis_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "boat_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      boat_listings: {
        Row: {
          beam_ft: number | null
          beginner_score: number | null
          berths: number | null
          boat_type: string | null
          broker_email: string | null
          broker_id: string | null
          broker_name: string | null
          broker_phone: string | null
          broker_website: string | null
          cabins: number | null
          city: string | null
          condition_analysis: string | null
          condition_score: number | null
          country: string | null
          created_at: string
          currency: string | null
          description: string | null
          displacement_lbs: number | null
          draft_ft: number | null
          drive_type: string | null
          embedding: string | null
          embedding_text: string | null
          engine_hours: number | null
          engine_hp: number | null
          engine_make: string | null
          engine_model: string | null
          engine_year: number | null
          external_id: string | null
          features: string[]
          fingerprint: string | null
          first_seen_at: string
          fuel_capacity_l: number | null
          fuel_type: string | null
          heads: number | null
          hull_material: string | null
          id: string
          image_count: number
          image_urls: string[]
          is_active: boolean
          is_featured: boolean
          is_private_sale: boolean
          last_checked_at: string | null
          last_seen_at: string
          latitude: number | null
          length_ft: number | null
          longitude: number | null
          make: string | null
          marina_name: string | null
          model_id: string | null
          model_name: string | null
          price: number | null
          price_assessment: string | null
          price_changed_at: string | null
          price_delta_pct: number | null
          price_normalized_eur: number | null
          price_normalized_usd: number | null
          region: string | null
          safety_notes: string | null
          source_platform: string | null
          source_url: string | null
          subtype: string | null
          summary_en: string | null
          title: string | null
          updated_at: string
          use_case_tags: Json | null
          water_capacity_l: number | null
          year: number | null
        }
        Insert: {
          beam_ft?: number | null
          beginner_score?: number | null
          berths?: number | null
          boat_type?: string | null
          broker_email?: string | null
          broker_id?: string | null
          broker_name?: string | null
          broker_phone?: string | null
          broker_website?: string | null
          cabins?: number | null
          city?: string | null
          condition_analysis?: string | null
          condition_score?: number | null
          country?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          displacement_lbs?: number | null
          draft_ft?: number | null
          drive_type?: string | null
          embedding?: string | null
          embedding_text?: string | null
          engine_hours?: number | null
          engine_hp?: number | null
          engine_make?: string | null
          engine_model?: string | null
          engine_year?: number | null
          external_id?: string | null
          features?: string[]
          fingerprint?: string | null
          first_seen_at?: string
          fuel_capacity_l?: number | null
          fuel_type?: string | null
          heads?: number | null
          hull_material?: string | null
          id?: string
          image_count?: number
          image_urls?: string[]
          is_active?: boolean
          is_featured?: boolean
          is_private_sale?: boolean
          last_checked_at?: string | null
          last_seen_at?: string
          latitude?: number | null
          length_ft?: number | null
          longitude?: number | null
          make?: string | null
          marina_name?: string | null
          model_id?: string | null
          model_name?: string | null
          price?: number | null
          price_assessment?: string | null
          price_changed_at?: string | null
          price_delta_pct?: number | null
          price_normalized_eur?: number | null
          price_normalized_usd?: number | null
          region?: string | null
          safety_notes?: string | null
          source_platform?: string | null
          source_url?: string | null
          subtype?: string | null
          summary_en?: string | null
          title?: string | null
          updated_at?: string
          use_case_tags?: Json | null
          water_capacity_l?: number | null
          year?: number | null
        }
        Update: {
          beam_ft?: number | null
          beginner_score?: number | null
          berths?: number | null
          boat_type?: string | null
          broker_email?: string | null
          broker_id?: string | null
          broker_name?: string | null
          broker_phone?: string | null
          broker_website?: string | null
          cabins?: number | null
          city?: string | null
          condition_analysis?: string | null
          condition_score?: number | null
          country?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          displacement_lbs?: number | null
          draft_ft?: number | null
          drive_type?: string | null
          embedding?: string | null
          embedding_text?: string | null
          engine_hours?: number | null
          engine_hp?: number | null
          engine_make?: string | null
          engine_model?: string | null
          engine_year?: number | null
          external_id?: string | null
          features?: string[]
          fingerprint?: string | null
          first_seen_at?: string
          fuel_capacity_l?: number | null
          fuel_type?: string | null
          heads?: number | null
          hull_material?: string | null
          id?: string
          image_count?: number
          image_urls?: string[]
          is_active?: boolean
          is_featured?: boolean
          is_private_sale?: boolean
          last_checked_at?: string | null
          last_seen_at?: string
          latitude?: number | null
          length_ft?: number | null
          longitude?: number | null
          make?: string | null
          marina_name?: string | null
          model_id?: string | null
          model_name?: string | null
          price?: number | null
          price_assessment?: string | null
          price_changed_at?: string | null
          price_delta_pct?: number | null
          price_normalized_eur?: number | null
          price_normalized_usd?: number | null
          region?: string | null
          safety_notes?: string | null
          source_platform?: string | null
          source_url?: string | null
          subtype?: string | null
          summary_en?: string | null
          title?: string | null
          updated_at?: string
          use_case_tags?: Json | null
          water_capacity_l?: number | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "boat_listings_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boat_listings_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "boat_models"
            referencedColumns: ["id"]
          },
        ]
      }
      boat_models: {
        Row: {
          air_draft_ft: number | null
          ballast_lbs: number | null
          beam_ft: number | null
          berths_default: number | null
          boat_type: string
          builder: string | null
          cockpit_type: string | null
          construction_notes: string | null
          created_at: string
          cruise_speed_kts: number | null
          deck_material: string | null
          designer: string | null
          displacement_kg: number | null
          displacement_lbs: number | null
          draft_max_ft: number | null
          draft_min_ft: number | null
          drive_type_default: string | null
          e_spar_ft: number | null
          engine_count_default: number | null
          first_built: number | null
          freeboard_ft: number | null
          fuel_tank_l: number | null
          fuel_type_default: string | null
          headroom_m: number | null
          heads_default: number | null
          hull_form: string | null
          hull_material: string | null
          hull_type: string | null
          i_spar_ft: number | null
          id: string
          j_spar_ft: number | null
          keel_material: string | null
          keel_type: string | null
          last_built: number | null
          loa_ft: number | null
          lwl_ft: number | null
          make: string
          mast_material: string | null
          max_speed_kts: number | null
          model_name: string
          p_spar_ft: number | null
          rig_type: string | null
          rudder_type: string | null
          sail_area_jib_sqft: number | null
          sail_area_main_sqft: number | null
          sail_area_total_sqft: number | null
          subtype: string | null
          updated_at: string
          water_tank_l: number | null
        }
        Insert: {
          air_draft_ft?: number | null
          ballast_lbs?: number | null
          beam_ft?: number | null
          berths_default?: number | null
          boat_type: string
          builder?: string | null
          cockpit_type?: string | null
          construction_notes?: string | null
          created_at?: string
          cruise_speed_kts?: number | null
          deck_material?: string | null
          designer?: string | null
          displacement_kg?: number | null
          displacement_lbs?: number | null
          draft_max_ft?: number | null
          draft_min_ft?: number | null
          drive_type_default?: string | null
          e_spar_ft?: number | null
          engine_count_default?: number | null
          first_built?: number | null
          freeboard_ft?: number | null
          fuel_tank_l?: number | null
          fuel_type_default?: string | null
          headroom_m?: number | null
          heads_default?: number | null
          hull_form?: string | null
          hull_material?: string | null
          hull_type?: string | null
          i_spar_ft?: number | null
          id?: string
          j_spar_ft?: number | null
          keel_material?: string | null
          keel_type?: string | null
          last_built?: number | null
          loa_ft?: number | null
          lwl_ft?: number | null
          make: string
          mast_material?: string | null
          max_speed_kts?: number | null
          model_name: string
          p_spar_ft?: number | null
          rig_type?: string | null
          rudder_type?: string | null
          sail_area_jib_sqft?: number | null
          sail_area_main_sqft?: number | null
          sail_area_total_sqft?: number | null
          subtype?: string | null
          updated_at?: string
          water_tank_l?: number | null
        }
        Update: {
          air_draft_ft?: number | null
          ballast_lbs?: number | null
          beam_ft?: number | null
          berths_default?: number | null
          boat_type?: string
          builder?: string | null
          cockpit_type?: string | null
          construction_notes?: string | null
          created_at?: string
          cruise_speed_kts?: number | null
          deck_material?: string | null
          designer?: string | null
          displacement_kg?: number | null
          displacement_lbs?: number | null
          draft_max_ft?: number | null
          draft_min_ft?: number | null
          drive_type_default?: string | null
          e_spar_ft?: number | null
          engine_count_default?: number | null
          first_built?: number | null
          freeboard_ft?: number | null
          fuel_tank_l?: number | null
          fuel_type_default?: string | null
          headroom_m?: number | null
          heads_default?: number | null
          hull_form?: string | null
          hull_material?: string | null
          hull_type?: string | null
          i_spar_ft?: number | null
          id?: string
          j_spar_ft?: number | null
          keel_material?: string | null
          keel_type?: string | null
          last_built?: number | null
          loa_ft?: number | null
          lwl_ft?: number | null
          make?: string
          mast_material?: string | null
          max_speed_kts?: number | null
          model_name?: string
          p_spar_ft?: number | null
          rig_type?: string | null
          rudder_type?: string | null
          sail_area_jib_sqft?: number | null
          sail_area_main_sqft?: number | null
          sail_area_total_sqft?: number | null
          subtype?: string | null
          updated_at?: string
          water_tank_l?: number | null
        }
        Relationships: []
      }
      brokers: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          last_scraped_at: string | null
          name: string
          scraper_config: Json | null
          scraper_type: string
          scraping_schedule: string | null
          total_listings: number
          updated_at: string
          website: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_scraped_at?: string | null
          name: string
          scraper_config?: Json | null
          scraper_type: string
          scraping_schedule?: string | null
          total_listings?: number
          updated_at?: string
          website: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_scraped_at?: string | null
          name?: string
          scraper_config?: Json | null
          scraper_type?: string
          scraping_schedule?: string | null
          total_listings?: number
          updated_at?: string
          website?: string
        }
        Relationships: []
      }
      calculated_ratios: {
        Row: {
          ballast_displacement: number | null
          calculated_at: string
          capsize_screening: number | null
          comfort_ratio: number | null
          displacement_length: number | null
          fuel_range_nm: number | null
          hull_speed_kts: number | null
          id: string
          lwl_loa_ratio: number | null
          model_id: string
          pounds_per_inch: number | null
          power_weight_ratio: number | null
          s_number: number | null
          sa_displacement: number | null
          speed_length_ratio: number | null
        }
        Insert: {
          ballast_displacement?: number | null
          calculated_at?: string
          capsize_screening?: number | null
          comfort_ratio?: number | null
          displacement_length?: number | null
          fuel_range_nm?: number | null
          hull_speed_kts?: number | null
          id?: string
          lwl_loa_ratio?: number | null
          model_id: string
          pounds_per_inch?: number | null
          power_weight_ratio?: number | null
          s_number?: number | null
          sa_displacement?: number | null
          speed_length_ratio?: number | null
        }
        Update: {
          ballast_displacement?: number | null
          calculated_at?: string
          capsize_screening?: number | null
          comfort_ratio?: number | null
          displacement_length?: number | null
          fuel_range_nm?: number | null
          hull_speed_kts?: number | null
          id?: string
          lwl_loa_ratio?: number | null
          model_id?: string
          pounds_per_inch?: number | null
          power_weight_ratio?: number | null
          s_number?: number | null
          sa_displacement?: number | null
          speed_length_ratio?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "calculated_ratios_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "boat_models"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          messages: Json
          search_context: Json | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          messages?: Json
          search_context?: Json | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          search_context?: Json | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      market_stats: {
        Row: {
          avg_price_eur: number | null
          avg_price_usd: number | null
          id: string
          last_calculated_at: string
          make: string
          max_price_eur: number | null
          max_price_usd: number | null
          median_price_eur: number | null
          median_price_usd: number | null
          min_price_eur: number | null
          min_price_usd: number | null
          model_name: string
          sample_count: number
          year_range: string | null
        }
        Insert: {
          avg_price_eur?: number | null
          avg_price_usd?: number | null
          id?: string
          last_calculated_at?: string
          make: string
          max_price_eur?: number | null
          max_price_usd?: number | null
          median_price_eur?: number | null
          median_price_usd?: number | null
          min_price_eur?: number | null
          min_price_usd?: number | null
          model_name: string
          sample_count?: number
          year_range?: string | null
        }
        Update: {
          avg_price_eur?: number | null
          avg_price_usd?: number | null
          id?: string
          last_calculated_at?: string
          make?: string
          max_price_eur?: number | null
          max_price_usd?: number | null
          median_price_eur?: number | null
          median_price_usd?: number | null
          min_price_eur?: number | null
          min_price_usd?: number | null
          model_name?: string
          sample_count?: number
          year_range?: string | null
        }
        Relationships: []
      }
      price_history: {
        Row: {
          currency: string
          id: string
          listing_id: string
          price: number
          price_normalized_eur: number | null
          price_normalized_usd: number | null
          recorded_at: string
        }
        Insert: {
          currency: string
          id?: string
          listing_id: string
          price: number
          price_normalized_eur?: number | null
          price_normalized_usd?: number | null
          recorded_at?: string
        }
        Update: {
          currency?: string
          id?: string
          listing_id?: string
          price?: number
          price_normalized_eur?: number | null
          price_normalized_usd?: number | null
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_history_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "boat_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_boats: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_boats_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "boat_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_boats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      search_alerts: {
        Row: {
          created_at: string
          filters: Json | null
          frequency: string
          id: string
          is_active: boolean
          keywords: string | null
          keywords_embedding: string | null
          last_notified_at: string | null
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filters?: Json | null
          frequency?: string
          id?: string
          is_active?: boolean
          keywords?: string | null
          keywords_embedding?: string | null
          last_notified_at?: string | null
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          filters?: Json | null
          frequency?: string
          id?: string
          is_active?: boolean
          keywords?: string | null
          keywords_embedding?: string | null
          last_notified_at?: string | null
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "search_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          experience_level: string
          id: string
          name: string | null
          notification_settings: Json | null
          preferences: Json | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          experience_level?: string
          id: string
          name?: string | null
          notification_settings?: Json | null
          preferences?: Json | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          experience_level?: string
          id?: string
          name?: string | null
          notification_settings?: Json | null
          preferences?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
