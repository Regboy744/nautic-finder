-- Brokers: external websites being scraped (YachtWorld, Boat Trader, etc.)
CREATE TABLE "brokers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "website" text NOT NULL,
  "scraper_type" text NOT NULL,
  "scraper_config" jsonb,
  "scraping_schedule" text,
  "last_scraped_at" timestamp with time zone,
  "total_listings" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
