-- Search alerts: automated notification criteria with optional keyword embeddings.
CREATE TABLE "search_alerts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "filters" jsonb,
  "keywords" text,
  "keywords_embedding" vector(1536),
  "frequency" text DEFAULT 'daily' NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "last_notified_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
