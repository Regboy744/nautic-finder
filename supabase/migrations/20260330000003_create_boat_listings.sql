-- Boat listings: every scraped listing from broker websites.
-- Nullable FK to boat_models (custom/unknown boats have model_id = NULL).
CREATE TABLE "boat_listings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  -- Model link
  "model_id" uuid REFERENCES "boat_models"("id") ON DELETE SET NULL,
  -- Listing identity
  "title" text,
  "make" text,
  "model_name" text,
  "year" integer,
  "boat_type" text,
  "subtype" text,
  -- Price
  "price" numeric,
  "currency" text,
  "price_normalized_eur" numeric,
  "price_normalized_usd" numeric,
  -- Location
  "country" text,
  "region" text,
  "city" text,
  "marina_name" text,
  "latitude" numeric,
  "longitude" numeric,
  -- Description & Media
  "description" text,
  "features" text[] DEFAULT '{}'::text[] NOT NULL,
  "image_urls" text[] DEFAULT '{}'::text[] NOT NULL,
  "image_count" integer DEFAULT 0 NOT NULL,
  -- Listing-specific specs
  "length_ft" numeric,
  "beam_ft" numeric,
  "draft_ft" numeric,
  "displacement_lbs" numeric,
  "hull_material" text,
  "engine_make" text,
  "engine_model" text,
  "engine_hp" integer,
  "engine_hours" integer,
  "engine_year" integer,
  "fuel_type" text,
  "drive_type" text,
  "cabins" integer,
  "berths" integer,
  "heads" integer,
  "fuel_capacity_l" numeric,
  "water_capacity_l" numeric,
  -- AI-generated fields
  "condition_analysis" text,
  "condition_score" integer,
  "beginner_score" integer,
  "use_case_tags" jsonb,
  "safety_notes" text,
  "summary_en" text,
  "price_assessment" text,
  "price_delta_pct" numeric,
  -- Broker info
  "broker_id" uuid REFERENCES "brokers"("id") ON DELETE SET NULL,
  "broker_name" text,
  "broker_phone" text,
  "broker_email" text,
  "broker_website" text,
  "is_private_sale" boolean DEFAULT false NOT NULL,
  -- Source tracking
  "source_url" text,
  "source_platform" text,
  "external_id" text,
  "fingerprint" text,
  -- Embeddings (pgvector)
  "embedding" vector(1536),
  "embedding_text" text,
  -- Timestamps
  "first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
  "last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
  "last_checked_at" timestamp with time zone,
  "price_changed_at" timestamp with time zone,
  -- Status
  "is_active" boolean DEFAULT true NOT NULL,
  "is_featured" boolean DEFAULT false NOT NULL,
  -- Metadata
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
