-- Migration: Add sortOrder column to Product table for manual ordering
-- Run this in Supabase SQL Editor

ALTER TABLE "public"."Product"
ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER DEFAULT 0;

-- Initialize sortOrder based on current createdAt order (newest = highest number)
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt" ASC) AS rn
  FROM "public"."Product"
)
UPDATE "public"."Product" p
SET "sortOrder" = r.rn
FROM ranked r
WHERE p.id = r.id;
