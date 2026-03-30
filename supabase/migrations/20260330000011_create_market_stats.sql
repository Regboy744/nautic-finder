-- Market stats: aggregated pricing data per make/model/year range.
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
