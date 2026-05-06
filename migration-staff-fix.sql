-- ====================================================================
-- MIGRATION FIX: Add missing columns to Staff
-- ====================================================================

-- Add columns that existed in the original API but were missed in the new table schema
ALTER TABLE "public"."Staff" 
ADD COLUMN IF NOT EXISTS "phone" TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS "avatar" TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS "services" TEXT[] DEFAULT '{}';
