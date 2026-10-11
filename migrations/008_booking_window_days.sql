-- ============================================================
-- Salon CRM — Migration 008: Dynamic Rolling Booking Window (Max Days)
-- Run in Supabase Dashboard → SQL Editor. Idempotent.
-- ============================================================

ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "bookingWindowDays" INTEGER DEFAULT NULL;

COMMENT ON COLUMN "Product"."bookingWindowDays" IS 'Maximum rolling advance booking window in days from today (e.g., 30 for 1 month, 60 for 2 months, 90 for 3 months, 120 for 4 months, NULL for unlimited)';
