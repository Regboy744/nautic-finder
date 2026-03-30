-- =============================================================================
-- All indexes in a single migration file for easy maintenance.
-- Add new indexes here. Drop and recreate as needed without migration order issues.
-- =============================================================================

-- boat_models
CREATE UNIQUE INDEX IF NOT EXISTS "boat_models_make_model_idx" ON "boat_models" ("make", "model_name");

-- boat_listings: individual column indexes for common filters
CREATE INDEX IF NOT EXISTS "listings_boat_type_idx" ON "boat_listings" ("boat_type");
CREATE INDEX IF NOT EXISTS "listings_price_eur_idx" ON "boat_listings" ("price_normalized_eur");
CREATE INDEX IF NOT EXISTS "listings_year_idx" ON "boat_listings" ("year");
CREATE INDEX IF NOT EXISTS "listings_country_idx" ON "boat_listings" ("country");
CREATE INDEX IF NOT EXISTS "listings_make_idx" ON "boat_listings" ("make");
CREATE INDEX IF NOT EXISTS "listings_length_ft_idx" ON "boat_listings" ("length_ft");
CREATE INDEX IF NOT EXISTS "listings_is_active_idx" ON "boat_listings" ("is_active");

-- boat_listings: composite index for the most common filter combination
CREATE INDEX IF NOT EXISTS "listings_type_price_active_idx" ON "boat_listings" ("boat_type", "price_normalized_eur", "is_active");

-- boat_listings: deduplication and source lookups
CREATE INDEX IF NOT EXISTS "listings_fingerprint_idx" ON "boat_listings" ("fingerprint");
CREATE INDEX IF NOT EXISTS "listings_source_url_idx" ON "boat_listings" ("source_url");

-- boat_listings: GIN index for use_case_tags JSONB array queries
CREATE INDEX IF NOT EXISTS "listings_use_case_tags_idx" ON "boat_listings" USING GIN ("use_case_tags");

-- boat_listings: HNSW index for pgvector semantic search (cosine distance)
-- NOTE: This index can take time to build on large datasets. Consider building
-- it after initial data load or during a maintenance window.
CREATE INDEX IF NOT EXISTS "listings_embedding_idx" ON "boat_listings"
  USING hnsw ("embedding" vector_cosine_ops);

-- calculated_ratios: one-to-one with boat_models
CREATE UNIQUE INDEX IF NOT EXISTS "calculated_ratios_model_id_idx" ON "calculated_ratios" ("model_id");

-- price_history: lookup by listing + time
CREATE INDEX IF NOT EXISTS "price_history_listing_recorded_idx" ON "price_history" ("listing_id", "recorded_at");

-- saved_boats: unique constraint + lookup index
CREATE UNIQUE INDEX IF NOT EXISTS "saved_boats_user_listing_idx" ON "saved_boats" ("user_id", "listing_id");

-- search_alerts: user's active alerts
CREATE INDEX IF NOT EXISTS "search_alerts_user_active_idx" ON "search_alerts" ("user_id", "is_active");

-- market_stats: lookup by make/model
CREATE INDEX IF NOT EXISTS "market_stats_make_model_idx" ON "market_stats" ("make", "model_name");
