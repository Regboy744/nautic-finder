-- Users: platform user profiles. ID matches Supabase Auth user ID.
CREATE TABLE "users" (
  "id" uuid PRIMARY KEY NOT NULL,
  "email" text NOT NULL UNIQUE,
  "name" text,
  "avatar_url" text,
  "experience_level" text DEFAULT 'beginner' NOT NULL,
  "preferences" jsonb,
  "notification_settings" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
