-- ====================================================================
-- FIX: Add missing FK constraint from Staff.branchId → Branch.id
-- The Staff table was created before the Branch table, so the FK
-- constraint was never applied by CREATE TABLE IF NOT EXISTS.
-- ====================================================================

-- 1. Add branchId column if it doesn't exist
ALTER TABLE "public"."Staff"
ADD COLUMN IF NOT EXISTS "branchId" UUID;

-- 2. Add the FK constraint (skip if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'staff_branchid_fkey'
  ) THEN
    ALTER TABLE "public"."Staff"
    ADD CONSTRAINT staff_branchid_fkey
    FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE CASCADE;
  END IF;
END $$;
