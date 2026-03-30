-- Saved boats: user's watchlist of tracked listings.
CREATE TABLE "saved_boats" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "listing_id" uuid NOT NULL REFERENCES "boat_listings"("id") ON DELETE CASCADE,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
