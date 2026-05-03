-- ====================================================================
-- GARDENIA SALON — Split Catalog into Services + Products
-- Run this in Supabase SQL Editor
-- ====================================================================

-- 1. Add "type" column with CHECK constraint
ALTER TABLE "public"."Product"
  ADD COLUMN IF NOT EXISTS "type" TEXT DEFAULT 'service';

-- Add constraint safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_type_check'
  ) THEN
    ALTER TABLE "public"."Product"
      ADD CONSTRAINT product_type_check CHECK ("type" IN ('service', 'product'));
  END IF;
END $$;

-- 2. Auto-classify existing rows based on stock column
-- stock IS NOT NULL → product, otherwise → service
UPDATE "public"."Product"
SET "type" = CASE
  WHEN "stock" IS NOT NULL THEN 'product'
  ELSE 'service'
END
WHERE "type" IS NULL OR "type" = 'service';

-- ====================================================================
-- DONE! After running this, existing items will be auto-classified.
-- ====================================================================
