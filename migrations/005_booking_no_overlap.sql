-- ============================================================
-- Salon CRM — Migration 005: Prevent double-booking (DB-level)
-- Run this in Supabase Dashboard → SQL Editor. Idempotent.
-- ============================================================

-- btree_gist allows scalar columns (staff_id uuid) inside a GiST exclusion.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- One staff member cannot have two non-cancelled, time-based bookings
-- whose [bookingDate, endTime) intervals overlap.
ALTER TABLE "Booking"
  DROP CONSTRAINT IF EXISTS booking_no_overlap;

ALTER TABLE "Booking"
  ADD CONSTRAINT booking_no_overlap
  EXCLUDE USING gist (
    staff_id WITH =,
    tstzrange("bookingDate", "endTime") WITH &&
  )
  WHERE ("endTime" IS NOT NULL
         AND staff_id IS NOT NULL
         AND status <> 'cancelled');

-- Index to support the overlap query the apps already run.
CREATE INDEX IF NOT EXISTS idx_booking_staff_date_gist
  ON "Booking" USING gist (staff_id, tstzrange("bookingDate", "endTime"));