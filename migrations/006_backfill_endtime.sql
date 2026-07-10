-- ============================================================
-- Salon CRM — Migration 006: Backfill endTime (H10)
-- Run in Supabase Dashboard → SQL Editor.
-- Apply AFTER 005_booking_no_overlap.sql.
-- ============================================================
--
-- Why: migration 005's exclusion constraint only protects rows where
-- "endTime" IS NOT NULL. The CRM used to insert NULL endTime for
-- time-mode bookings that had no bookingTime, and the app fell back to a
-- hardcoded +30 min during overlap checks — so a 60-min service booked in
-- the 30–60 min window of such a row was NOT caught (double-booking gap).
-- This migration backfills endTime on every existing non-cancelled
-- time-mode booking so 005 fully protects them and the +30 min fallback
-- in the app can be removed.
--
-- STEP 1 — PRE-CHECK (run this SELECT first; resolve any pairs it returns
-- manually — e.g. cancel one of them — before running STEP 2).
-- It finds non-cancelled bookings for the same staff whose intervals
-- [bookingDate, computed_end) would overlap once endTime is backfilled.
-- computed_end = endTime when already set, else bookingDate + duration.

WITH computed AS (
  SELECT
    b.id,
    b.staff_id,
    b."bookingDate",
    COALESCE(
      b."endTime",
      b."bookingDate" + (p."durationMinutes" || ' minutes')::interval
    ) AS "computedEnd",
    b.status
  FROM "Booking" b
  LEFT JOIN "Product" p ON p.id = b."serviceId"
  WHERE b.status <> 'cancelled'
    AND b.staff_id IS NOT NULL
)
SELECT
  a.id   AS booking_a,
  b.id   AS booking_b,
  a.staff_id,
  a."bookingDate" AS start_a,
  a."computedEnd" AS end_a,
  b."bookingDate" AS start_b,
  b."computedEnd" AS end_b
FROM computed a
JOIN computed b
  ON a.staff_id = b.staff_id
 AND a.id < b.id
 AND tstzrange(a."bookingDate", a."computedEnd") && tstzrange(b."bookingDate", b."computedEnd")
ORDER BY a.staff_id, a."bookingDate";

-- STEP 2 — BACKFILL endTime for rows that are missing it.
-- (If STEP 1 returned rows, fix them first or this UPDATE will raise
--  exclusion_violation from the 005 constraint — which is the safety net
--  working as intended.)
UPDATE "Booking" b
SET "endTime" = b."bookingDate" + (p."durationMinutes" || ' minutes')::interval
FROM "Product" p
WHERE p.id = b."serviceId"
  AND b."endTime" IS NULL
  AND b.status <> 'cancelled'
  AND p."durationMinutes" IS NOT NULL;