-- ====================================================================
-- MIGRATION: Add auth_user_id to Client for Customer Login
-- Links Supabase Auth users to the CRM Client table
-- ====================================================================

-- Add auth_user_id column (nullable — most clients are guests or WhatsApp)
ALTER TABLE "public"."Client"
ADD COLUMN IF NOT EXISTS "auth_user_id" UUID UNIQUE;

-- NOTE: We intentionally do NOT add a FK to auth.users because the 
-- service_role client cannot always reference auth schema directly.
-- The link is maintained at the application level.
