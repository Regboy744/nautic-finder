-- Price history: append-only log of every price change per listing.
CREATE TABLE "price_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "listing_id" uuid NOT NULL REFERENCES "boat_listings"("id") ON DELETE CASCADE,
  "price" numeric NOT NULL,
  "currency" text NOT NULL,
  "price_normalized_eur" numeric,
  "price_normalized_usd" numeric,
  "recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
