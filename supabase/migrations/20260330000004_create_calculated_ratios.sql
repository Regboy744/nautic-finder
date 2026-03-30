-- Calculated ratios: derived performance metrics per boat model.
-- Sailboat ratios (SA/Disp, comfort, capsize, etc.) and motorboat ratios.
CREATE TABLE "calculated_ratios" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "model_id" uuid NOT NULL REFERENCES "boat_models"("id") ON DELETE CASCADE,
  -- Sailboat ratios
  "sa_displacement" numeric,
  "ballast_displacement" numeric,
  "displacement_length" numeric,
  "comfort_ratio" numeric,
  "capsize_screening" numeric,
  "hull_speed_kts" numeric,
  "s_number" numeric,
  "lwl_loa_ratio" numeric,
  "pounds_per_inch" numeric,
  -- Motorboat ratios
  "power_weight_ratio" numeric,
  "fuel_range_nm" numeric,
  "speed_length_ratio" numeric,
  -- Metadata
  "calculated_at" timestamp with time zone DEFAULT now() NOT NULL
);
