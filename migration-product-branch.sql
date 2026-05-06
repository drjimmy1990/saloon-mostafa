-- ====================================================================
-- MIGRATION: Add branchId to Product (Service/Product belongs to Branch)
-- Pattern: Same as Staff.branchId → Branch FK
-- ====================================================================

ALTER TABLE "public"."Product"
ADD COLUMN IF NOT EXISTS "branchId" UUID REFERENCES "public"."Branch"("id") ON DELETE CASCADE;

-- NOTE: Existing products will have branchId = NULL.
-- Assign them to branches manually via the dashboard.
-- The ProductBranchPrice table is left intact but is no longer used.
