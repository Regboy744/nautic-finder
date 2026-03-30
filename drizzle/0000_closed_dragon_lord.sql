CREATE TABLE "boat_images_analysis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"image_order" integer DEFAULT 0 NOT NULL,
	"analysis" text,
	"issues_found" text[] DEFAULT '{}'::text[] NOT NULL,
	"area_analyzed" text,
	"condition_score" integer,
	"analyzed_at" timestamp with time zone,
	"ai_model_used" text
);
--> statement-breakpoint
CREATE TABLE "boat_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" uuid,
	"title" text,
	"make" text,
	"model_name" text,
	"year" integer,
	"boat_type" text,
	"subtype" text,
	"price" numeric,
	"currency" text,
	"price_normalized_eur" numeric,
	"price_normalized_usd" numeric,
	"country" text,
	"region" text,
	"city" text,
	"marina_name" text,
	"latitude" numeric,
	"longitude" numeric,
	"description" text,
	"features" text[] DEFAULT '{}'::text[] NOT NULL,
	"image_urls" text[] DEFAULT '{}'::text[] NOT NULL,
	"image_count" integer DEFAULT 0 NOT NULL,
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
	"condition_analysis" text,
	"condition_score" integer,
	"beginner_score" integer,
	"use_case_tags" jsonb,
	"safety_notes" text,
	"summary_en" text,
	"price_assessment" text,
	"price_delta_pct" numeric,
	"broker_id" uuid,
	"broker_name" text,
	"broker_phone" text,
	"broker_email" text,
	"broker_website" text,
	"is_private_sale" boolean DEFAULT false NOT NULL,
	"source_url" text,
	"source_platform" text,
	"external_id" text,
	"fingerprint" text,
	"embedding" vector(1536),
	"embedding_text" text,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_checked_at" timestamp with time zone,
	"price_changed_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "boat_models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"make" text NOT NULL,
	"model_name" text NOT NULL,
	"boat_type" text NOT NULL,
	"subtype" text,
	"loa_ft" numeric,
	"lwl_ft" numeric,
	"beam_ft" numeric,
	"draft_max_ft" numeric,
	"draft_min_ft" numeric,
	"displacement_lbs" numeric,
	"displacement_kg" numeric,
	"ballast_lbs" numeric,
	"freeboard_ft" numeric,
	"air_draft_ft" numeric,
	"hull_type" text,
	"hull_material" text,
	"deck_material" text,
	"construction_notes" text,
	"first_built" integer,
	"last_built" integer,
	"designer" text,
	"builder" text,
	"rig_type" text,
	"sail_area_main_sqft" numeric,
	"sail_area_jib_sqft" numeric,
	"sail_area_total_sqft" numeric,
	"i_spar_ft" numeric,
	"j_spar_ft" numeric,
	"p_spar_ft" numeric,
	"e_spar_ft" numeric,
	"mast_material" text,
	"keel_type" text,
	"keel_material" text,
	"rudder_type" text,
	"cockpit_type" text,
	"hull_form" text,
	"engine_count_default" integer,
	"drive_type_default" text,
	"fuel_type_default" text,
	"max_speed_kts" numeric,
	"cruise_speed_kts" numeric,
	"headroom_m" numeric,
	"berths_default" integer,
	"heads_default" integer,
	"water_tank_l" numeric,
	"fuel_tank_l" numeric,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE "calculated_ratios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" uuid NOT NULL,
	"sa_displacement" numeric,
	"ballast_displacement" numeric,
	"displacement_length" numeric,
	"comfort_ratio" numeric,
	"capsize_screening" numeric,
	"hull_speed_kts" numeric,
	"s_number" numeric,
	"lwl_loa_ratio" numeric,
	"pounds_per_inch" numeric,
	"power_weight_ratio" numeric,
	"fuel_range_nm" numeric,
	"speed_length_ratio" numeric,
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text,
	"messages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"search_context" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"make" text NOT NULL,
	"model_name" text NOT NULL,
	"year_range" text,
	"avg_price_eur" numeric,
	"avg_price_usd" numeric,
	"median_price_eur" numeric,
	"median_price_usd" numeric,
	"min_price_eur" numeric,
	"max_price_eur" numeric,
	"min_price_usd" numeric,
	"max_price_usd" numeric,
	"sample_count" integer DEFAULT 0 NOT NULL,
	"last_calculated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"price" numeric NOT NULL,
	"currency" text NOT NULL,
	"price_normalized_eur" numeric,
	"price_normalized_usd" numeric,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_boats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"listing_id" uuid NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "search_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"filters" jsonb,
	"keywords" text,
	"keywords_embedding" vector(1536),
	"frequency" text DEFAULT 'daily' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_notified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"avatar_url" text,
	"experience_level" text DEFAULT 'beginner' NOT NULL,
	"preferences" jsonb,
	"notification_settings" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "boat_images_analysis" ADD CONSTRAINT "boat_images_analysis_listing_id_boat_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."boat_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boat_listings" ADD CONSTRAINT "boat_listings_model_id_boat_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."boat_models"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boat_listings" ADD CONSTRAINT "boat_listings_broker_id_brokers_id_fk" FOREIGN KEY ("broker_id") REFERENCES "public"."brokers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calculated_ratios" ADD CONSTRAINT "calculated_ratios_model_id_boat_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."boat_models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_listing_id_boat_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."boat_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_boats" ADD CONSTRAINT "saved_boats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_boats" ADD CONSTRAINT "saved_boats_listing_id_boat_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."boat_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_alerts" ADD CONSTRAINT "search_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "listings_boat_type_idx" ON "boat_listings" USING btree ("boat_type");--> statement-breakpoint
CREATE INDEX "listings_price_eur_idx" ON "boat_listings" USING btree ("price_normalized_eur");--> statement-breakpoint
CREATE INDEX "listings_year_idx" ON "boat_listings" USING btree ("year");--> statement-breakpoint
CREATE INDEX "listings_country_idx" ON "boat_listings" USING btree ("country");--> statement-breakpoint
CREATE INDEX "listings_make_idx" ON "boat_listings" USING btree ("make");--> statement-breakpoint
CREATE INDEX "listings_length_ft_idx" ON "boat_listings" USING btree ("length_ft");--> statement-breakpoint
CREATE INDEX "listings_is_active_idx" ON "boat_listings" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "listings_type_price_active_idx" ON "boat_listings" USING btree ("boat_type","price_normalized_eur","is_active");--> statement-breakpoint
CREATE INDEX "listings_fingerprint_idx" ON "boat_listings" USING btree ("fingerprint");--> statement-breakpoint
CREATE INDEX "listings_source_url_idx" ON "boat_listings" USING btree ("source_url");--> statement-breakpoint
CREATE UNIQUE INDEX "boat_models_make_model_idx" ON "boat_models" USING btree ("make","model_name");--> statement-breakpoint
CREATE UNIQUE INDEX "calculated_ratios_model_id_idx" ON "calculated_ratios" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "market_stats_make_model_idx" ON "market_stats" USING btree ("make","model_name");--> statement-breakpoint
CREATE INDEX "price_history_listing_recorded_idx" ON "price_history" USING btree ("listing_id","recorded_at");--> statement-breakpoint
CREATE UNIQUE INDEX "saved_boats_user_listing_idx" ON "saved_boats" USING btree ("user_id","listing_id");--> statement-breakpoint
CREATE INDEX "search_alerts_user_active_idx" ON "search_alerts" USING btree ("user_id","is_active");