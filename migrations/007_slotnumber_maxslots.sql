-- ============================================================
-- Salon CRM — Migration 007: slotNumber uniqueness + maxSlots enforcement (H11)
-- Run in Supabase Dashboard → SQL Editor. Idempotent.
-- ============================================================

-- ------------------------------------------------------------
-- H11a: one active slotNumber per (service, day).
-- A partial UNIQUE INDEX (table UNIQUE constraints can't carry
-- expressions) so two non-cancelled bookings cannot share the same
-- slotNumber for the same service on the same calendar day.
-- SQLSTATE 23505 (unique_violation) on conflict — the apps map it to 409.
-- ------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS booking_slotnumber_unique
  ON "Booking" (slotNumber, serviceId, date_trunc('day', "bookingDate"))
  WHERE slotNumber IS NOT NULL
    AND status <> 'cancelled';

-- ------------------------------------------------------------
-- H11b: DB-enforced maxSlots — kills the count→check→insert TOCTOU race
-- that let concurrent bookings exceed Product.maxSlots. Applies to
-- inserts from BOTH apps (CRM saloon-mostafa + storefront gardenia-website).
--
-- The trigger locks the Product row (FOR UPDATE) so concurrent inserts
-- for the same service serialize, then counts non-cancelled bookings for
-- the same service on the same day. If the count already >= maxSlots it
-- raises 'max_slots_exceeded' (SQLSTATE P0001) — the apps map it to 409.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION enforce_booking_max_slots()
RETURNS trigger AS $$
DECLARE
  day_start    timestamptz;
  day_end      timestamptz;
  current_count integer;
  max_slots    integer;
BEGIN
  IF NEW.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  -- Lock the service row so concurrent inserts for the same service
  -- serialize within their transactions, removing the TOCTOU window.
  SELECT "maxSlots" INTO max_slots
  FROM "Product"
  WHERE id = NEW."serviceId"
  FOR UPDATE;

  IF max_slots IS NULL THEN
    RETURN NEW;
  END IF;

  day_start := date_trunc('day', NEW."bookingDate");
  day_end   := day_start + interval '1 day';

  SELECT count(*) INTO current_count
  FROM "Booking"
  WHERE "serviceId" = NEW."serviceId"
    AND "bookingDate" >= day_start
    AND "bookingDate" < day_end
    AND status <> 'cancelled'
    AND id <> NEW.id;

  IF current_count >= max_slots THEN
    RAISE EXCEPTION 'max_slots_exceeded';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_booking_max_slots ON "Booking";
CREATE TRIGGER trg_booking_max_slots
  BEFORE INSERT ON "Booking"
  FOR EACH ROW
  EXECUTE FUNCTION enforce_booking_max_slots();