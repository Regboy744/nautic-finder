-- Boat images analysis: per-image AI condition analysis.
CREATE TABLE "boat_images_analysis" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "listing_id" uuid NOT NULL REFERENCES "boat_listings"("id") ON DELETE CASCADE,
  "image_url" text NOT NULL,
  "image_order" integer DEFAULT 0 NOT NULL,
  "analysis" text,
  "issues_found" text[] DEFAULT '{}'::text[] NOT NULL,
  "area_analyzed" text,
  "condition_score" integer,
  "analyzed_at" timestamp with time zone,
  "ai_model_used" text
);
