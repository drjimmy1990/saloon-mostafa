-- ============================================================
-- Salon CRM — Migration 007: slotNumber uniqueness + maxSlots enforcement (H11)
-- Run in Supabase Dashboard → SQL Editor. Idempotent.
-- ============================================================

-- NOTE on mixed-case columns: PostgreSQL lowercases unquoted identifiers, so
-- "slotNumber", "serviceId", "bookingDate" (mixed-case in this schema) MUST be
-- double-quoted. Lowercase columns (status, id) stay unquoted.

-- Drop the earlier (broken) expression-index attempt if a partial run left it.
DROP INDEX IF EXISTS booking_slotnumber_unique;

-- ------------------------------------------------------------
-- H11a: slotNumber uniqueness — one active slot per (service, day).
-- A GiST/UNIQUE *expression index* on date_trunc(day, timestamptz) is NOT
-- allowed (date_trunc on timestamptz is STABLE, not IMMUTABLE), so we enforce
-- it with a BEFORE INSERT/UPDATE trigger instead. Under a per-(service,day,
-- slot) advisory lock it rejects a duplicate active slot for the same service
-- on the same calendar day, raising SQLSTATE 23505 (unique_violation) — the
-- apps map that to a 409 alongside the existing 23P01 handling.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION enforce_slotnumber_unique()
RETURNS trigger AS $$
DECLARE
  day_start timestamptz;
  day_end   timestamptz;
  dup_id    uuid;
  v_slot    integer;
  v_svc     uuid;
BEGIN
  -- No slot to protect, or the row is being cancelled (frees the slot).
  IF NEW."slotNumber" IS NULL OR NEW.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  v_slot := NEW."slotNumber";
  v_svc  := NEW."serviceId";
  day_start := date_trunc('day', NEW."bookingDate");
  day_end   := day_start + interval '1 day';

  -- Serialize concurrent inserts/updates for the same (service, slot) so the
  -- check-then-act window can't let a duplicate through.
  PERFORM pg_advisory_xact_lock(
    hashtext(COALESCE(v_svc::text, '')),
    v_slot
  );

  SELECT id INTO dup_id
  FROM "Booking"
  WHERE "slotNumber" = v_slot
    AND "serviceId" IS NOT DISTINCT FROM v_svc
    AND "bookingDate" >= day_start
    AND "bookingDate" < day_end
    AND status <> 'cancelled'
    AND id <> NEW.id
  LIMIT 1;

  IF dup_id IS NOT NULL THEN
    RAISE EXCEPTION 'duplicate slotNumber % for service % on %', v_slot, v_svc, day_start
      USING ERRCODE = 'unique_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_booking_slotnumber_unique ON "Booking";
CREATE TRIGGER trg_booking_slotnumber_unique
  BEFORE INSERT OR UPDATE ON "Booking"
  FOR EACH ROW
  EXECUTE FUNCTION enforce_slotnumber_unique();

-- ------------------------------------------------------------
-- H11b: DB-enforced maxSlots — kills the count->check->insert TOCTOU race
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