-- Boat models: static specifications collected once per production model.
-- E.g., "Beneteau Oceanis 40.1" has fixed dimensions, sail area, designer.
CREATE TABLE "boat_models" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  -- Identity
  "make" text NOT NULL,
  "model_name" text NOT NULL,
  "boat_type" text NOT NULL,
  "subtype" text,
  -- Dimensions
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
  -- Hull & Construction
  "hull_type" text,
  "hull_material" text,
  "deck_material" text,
  "construction_notes" text,
  -- Production
  "first_built" integer,
  "last_built" integer,
  "designer" text,
  "builder" text,
  -- Sailing-specific (nullable)
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
  -- Motor-specific (nullable)
  "hull_form" text,
  "engine_count_default" integer,
  "drive_type_default" text,
  "fuel_type_default" text,
  "max_speed_kts" numeric,
  "cruise_speed_kts" numeric,
  -- Common interior
  "headroom_m" numeric,
  "berths_default" integer,
  "heads_default" integer,
  "water_tank_l" numeric,
  "fuel_tank_l" numeric,
  -- Metadata
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
