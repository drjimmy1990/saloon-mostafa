-- ====================================================================
-- BOT DATABASE FUNCTIONS
-- Supabase RPC functions for the AI bot to query availability,
-- services, staff, and create bookings.
-- 
-- The bot can call these via Supabase REST API:
-- POST https://<project>.supabase.co/rest/v1/rpc/<function_name>
-- Headers: apikey: <anon_key>, Authorization: Bearer <anon_key>
-- Body: { "param1": "value1", ... }
-- ====================================================================

-- ────────────────────────────────────────────────────────────────────
-- 1. get_services_by_branch(branch_id)
-- Returns all published, available services for a branch
-- Bot usage: "عايزه أعرف الخدمات المتاحة في فرع X"
-- ────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_services_by_branch(p_branch_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  name TEXT,
  price TEXT,
  category TEXT,
  duration_minutes INTEGER,
  duration_mode TEXT,
  deposit_amount DOUBLE PRECISION,
  available_at_home BOOLEAN,
  available_at_salon BOOLEAN
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p."id",
    p."name",
    p."price",
    p."category",
    p."durationMinutes" AS duration_minutes,
    p."durationMode" AS duration_mode,
    p."depositAmount" AS deposit_amount,
    p."availableAtHome" AS available_at_home,
    p."availableAtSalon" AS available_at_salon
  FROM "public"."Product" p
  WHERE p."isAvailable" = true
    AND p."type" = 'service'
    AND (p."publishAt" IS NULL OR p."publishAt" <= NOW())
    AND (p_branch_id IS NULL OR p."branchId" = p_branch_id)
  ORDER BY p."sortOrder" ASC;
END;
$$;

-- ────────────────────────────────────────────────────────────────────
-- 2. get_staff_for_service(service_id, branch_id)
-- Returns active staff who can perform a specific service
-- Bot usage: "مين العاملات اللي بتعمل خدمة X؟"
-- ────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_staff_for_service(
  p_service_id UUID,
  p_branch_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  name_ar TEXT,
  role TEXT,
  branch_id UUID
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s."id",
    s."name",
    s."nameAr" AS name_ar,
    s."role",
    s."branchId" AS branch_id
  FROM "public"."StaffService" ss
  JOIN "public"."Staff" s ON s."id" = ss."staff_id"
  WHERE ss."product_id" = p_service_id
    AND s."isActive" = true
    AND (p_branch_id IS NULL OR s."branchId" = p_branch_id);
END;
$$;

-- ────────────────────────────────────────────────────────────────────
-- 3. get_available_slots(staff_id, service_id, target_date)
-- Returns available time slots for a staff member on a specific date
-- Bot usage: "عايزه أحجز مع فاطمة يوم الأحد - إيه الأوقات المتاحة؟"
-- ────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_available_slots(
  p_staff_id UUID,
  p_service_id UUID,
  p_date DATE
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_duration INTEGER;
  v_mode TEXT;
  v_deposit DOUBLE PRECISION;
  v_day_of_week INTEGER;
  v_start_time TIME;
  v_end_time TIME;
  v_is_off BOOLEAN;
  v_start_min INTEGER;
  v_end_min INTEGER;
  v_slot_min INTEGER;
  v_slot_end INTEGER;
  v_has_overlap BOOLEAN;
  v_slots JSONB := '[]'::JSONB;
  v_queue_count INTEGER;
  rec RECORD;
BEGIN
  -- Get service details
  SELECT "durationMinutes", "durationMode", "depositAmount"
  INTO v_duration, v_mode, v_deposit
  FROM "public"."Product"
  WHERE "id" = p_service_id;

  IF v_duration IS NULL THEN
    v_duration := 30;
  END IF;
  IF v_deposit IS NULL THEN
    v_deposit := 0;
  END IF;

  -- Queue mode: return next queue number
  IF v_mode = 'queue' THEN
    SELECT COUNT(*) INTO v_queue_count
    FROM "public"."Booking"
    WHERE "staff_id" = p_staff_id
      AND "serviceId" = p_service_id
      AND "bookingDate" >= p_date::TIMESTAMP
      AND "bookingDate" < (p_date + INTERVAL '1 day')::TIMESTAMP
      AND "status" != 'cancelled';

    RETURN jsonb_build_object(
      'mode', 'queue',
      'next_queue_number', v_queue_count + 1,
      'duration_minutes', v_duration,
      'deposit_amount', v_deposit
    );
  END IF;

  -- Get staff schedule for this day
  v_day_of_week := EXTRACT(DOW FROM p_date); -- 0=Sunday

  SELECT "startTime"::TIME, "endTime"::TIME, "isOff"
  INTO v_start_time, v_end_time, v_is_off
  FROM "public"."StaffSchedule"
  WHERE "staff_id" = p_staff_id
    AND "dayOfWeek" = v_day_of_week;

  -- If no schedule or day off
  IF v_start_time IS NULL OR v_is_off = true THEN
    RETURN jsonb_build_object(
      'mode', 'time',
      'slots', '[]'::JSONB,
      'message', 'العاملة في إجازة هذا اليوم',
      'duration_minutes', v_duration,
      'deposit_amount', v_deposit
    );
  END IF;

  -- Convert to minutes
  v_start_min := EXTRACT(HOUR FROM v_start_time) * 60 + EXTRACT(MINUTE FROM v_start_time);
  v_end_min := EXTRACT(HOUR FROM v_end_time) * 60 + EXTRACT(MINUTE FROM v_end_time);

  -- Generate slots every 15 minutes
  v_slot_min := v_start_min;
  WHILE v_slot_min + v_duration <= v_end_min LOOP
    v_slot_end := v_slot_min + v_duration;
    v_has_overlap := false;

    -- Check for overlap with existing bookings
    SELECT true INTO v_has_overlap
    FROM "public"."Booking" b
    WHERE b."staff_id" = p_staff_id
      AND b."status" != 'cancelled'
      AND b."bookingDate" >= p_date::TIMESTAMP
      AND b."bookingDate" < (p_date + INTERVAL '1 day')::TIMESTAMP
      AND (
        -- Overlap check using minutes
        (EXTRACT(HOUR FROM b."bookingDate"::TIME) * 60 + EXTRACT(MINUTE FROM b."bookingDate"::TIME)) < v_slot_end
        AND
        COALESCE(
          EXTRACT(HOUR FROM b."endTime"::TIME) * 60 + EXTRACT(MINUTE FROM b."endTime"::TIME),
          EXTRACT(HOUR FROM b."bookingDate"::TIME) * 60 + EXTRACT(MINUTE FROM b."bookingDate"::TIME) + v_duration
        ) > v_slot_min
      )
    LIMIT 1;

    IF v_has_overlap IS NOT true THEN
      v_slots := v_slots || to_jsonb(
        LPAD((v_slot_min / 60)::TEXT, 2, '0') || ':' || LPAD((v_slot_min % 60)::TEXT, 2, '0')
      );
    END IF;

    v_slot_min := v_slot_min + 15;
  END LOOP;

  RETURN jsonb_build_object(
    'mode', 'time',
    'slots', v_slots,
    'schedule_start', v_start_time::TEXT,
    'schedule_end', v_end_time::TEXT,
    'duration_minutes', v_duration,
    'deposit_amount', v_deposit
  );
END;
$$;

-- ────────────────────────────────────────────────────────────────────
-- 4. create_booking(...)
-- Creates a new booking with overlap protection
-- Bot usage: "أحجز مع فاطمة يوم الأحد الساعة 10 صباحاً"
-- ────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION create_bot_booking(
  p_client_name TEXT,
  p_client_phone TEXT,
  p_service_id UUID,
  p_staff_id UUID,
  p_branch_id UUID,
  p_date DATE,
  p_time TEXT DEFAULT NULL,        -- 'HH:MM' or NULL for queue
  p_notes TEXT DEFAULT '',
  p_channel TEXT DEFAULT 'whatsapp'
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_client_id UUID;
  v_booking_id UUID;
  v_duration INTEGER;
  v_mode TEXT;
  v_deposit DOUBLE PRECISION;
  v_booking_date TIMESTAMP;
  v_end_time TIMESTAMP;
  v_queue_number INTEGER;
  v_overlap_count INTEGER;
  v_service_name TEXT;
BEGIN
  -- Get service details
  SELECT "name", "durationMinutes", "durationMode", "depositAmount"
  INTO v_service_name, v_duration, v_mode, v_deposit
  FROM "public"."Product"
  WHERE "id" = p_service_id;

  IF v_duration IS NULL THEN v_duration := 30; END IF;
  IF v_deposit IS NULL THEN v_deposit := 0; END IF;

  -- Find or create client
  SELECT "id" INTO v_client_id
  FROM "public"."Client"
  WHERE "phone" = p_client_phone
  LIMIT 1;

  IF v_client_id IS NULL THEN
    INSERT INTO "public"."Client" ("name", "phone", "platform")
    VALUES (p_client_name, p_client_phone, p_channel)
    RETURNING "id" INTO v_client_id;
  END IF;

  -- Calculate booking datetime
  IF v_mode = 'queue' OR p_time IS NULL THEN
    v_booking_date := p_date::TIMESTAMP;
    v_end_time := NULL;

    -- Get queue number
    SELECT COUNT(*) + 1 INTO v_queue_number
    FROM "public"."Booking"
    WHERE "staff_id" = p_staff_id
      AND "serviceId" = p_service_id
      AND "bookingDate" >= p_date::TIMESTAMP
      AND "bookingDate" < (p_date + INTERVAL '1 day')::TIMESTAMP
      AND "status" != 'cancelled';
  ELSE
    v_booking_date := (p_date::TEXT || ' ' || p_time || ':00')::TIMESTAMP;
    v_end_time := v_booking_date + (v_duration || ' minutes')::INTERVAL;
    v_queue_number := NULL;

    -- Check for overlaps
    SELECT COUNT(*) INTO v_overlap_count
    FROM "public"."Booking" b
    WHERE b."staff_id" = p_staff_id
      AND b."status" != 'cancelled'
      AND b."bookingDate" >= p_date::TIMESTAMP
      AND b."bookingDate" < (p_date + INTERVAL '1 day')::TIMESTAMP
      AND (
        b."bookingDate" < v_end_time
        AND COALESCE(b."endTime", b."bookingDate" + (v_duration || ' minutes')::INTERVAL) > v_booking_date
      );

    IF v_overlap_count > 0 THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'هذا الوقت محجوز بالفعل. يرجى اختيار وقت آخر.'
      );
    END IF;
  END IF;

  -- Insert booking
  INSERT INTO "public"."Booking" (
    "client_id", "serviceId", "serviceSummary",
    "bookingDate", "endTime", "channelType", "status",
    "branchId", "staff_id",
    "depositAmount", "depositStatus", "paymentMethod",
    "queueNumber"
  ) VALUES (
    v_client_id, p_service_id, v_service_name,
    v_booking_date, v_end_time, p_channel, 'pending',
    p_branch_id, p_staff_id,
    v_deposit, 'unpaid', 'cash',
    v_queue_number
  ) RETURNING "id" INTO v_booking_id;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'service', v_service_name,
    'date', p_date::TEXT,
    'time', COALESCE(p_time, 'بالدور'),
    'queue_number', v_queue_number,
    'deposit_amount', v_deposit,
    'message', 'تم تأكيد حجزك بنجاح! 🌸'
  );
END;
$$;

-- ────────────────────────────────────────────────────────────────────
-- 5. get_branches()
-- Returns all active branches
-- Bot usage: "إيه الفروع المتاحة؟"
-- ────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_active_branches()
RETURNS TABLE (
  id UUID,
  name TEXT,
  name_ar TEXT,
  address TEXT,
  phone TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b."id",
    b."name",
    b."nameAr" AS name_ar,
    b."address",
    b."phone"
  FROM "public"."Branch" b
  WHERE b."isActive" = true
  ORDER BY b."name" ASC;
END;
$$;

-- ────────────────────────────────────────────────────────────────────
-- 6. check_booking_status(phone)
-- Check existing bookings for a customer by phone
-- Bot usage: "عايزه أعرف حجوزاتي"
-- ────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION check_customer_bookings(p_phone TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSONB := '[]'::JSONB;
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT 
      bk."id",
      bk."serviceSummary",
      bk."bookingDate",
      bk."endTime",
      bk."status",
      bk."queueNumber",
      bk."depositAmount",
      bk."depositStatus",
      s."name" AS staff_name,
      br."nameAr" AS branch_name
    FROM "public"."Booking" bk
    LEFT JOIN "public"."Client" c ON c."id" = bk."client_id"
    LEFT JOIN "public"."Staff" s ON s."id" = bk."staff_id"
    LEFT JOIN "public"."Branch" br ON br."id" = bk."branchId"
    WHERE c."phone" = p_phone
      AND bk."bookingDate" >= NOW() - INTERVAL '1 day'
    ORDER BY bk."bookingDate" ASC
    LIMIT 10
  LOOP
    v_result := v_result || jsonb_build_object(
      'id', rec."id",
      'service', rec."serviceSummary",
      'date', rec."bookingDate"::DATE::TEXT,
      'time', TO_CHAR(rec."bookingDate"::TIME, 'HH24:MI'),
      'status', rec."status",
      'queue_number', rec."queueNumber",
      'staff', rec.staff_name,
      'branch', rec.branch_name,
      'deposit', rec."depositAmount",
      'deposit_status', rec."depositStatus"
    );
  END LOOP;

  IF jsonb_array_length(v_result) = 0 THEN
    RETURN jsonb_build_object(
      'found', false,
      'message', 'لا توجد حجوزات لهذا الرقم'
    );
  END IF;

  RETURN jsonb_build_object(
    'found', true,
    'count', jsonb_array_length(v_result),
    'bookings', v_result
  );
END;
$$;

-- ────────────────────────────────────────────────────────────────────
-- 7. cancel_booking(booking_id, phone)
-- Cancel a booking (requires matching phone for security)
-- Bot usage: "عايزه ألغي حجزي"
-- ────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION cancel_bot_booking(
  p_booking_id UUID,
  p_phone TEXT
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_booking RECORD;
BEGIN
  SELECT bk.*, c."phone" AS client_phone
  INTO v_booking
  FROM "public"."Booking" bk
  LEFT JOIN "public"."Client" c ON c."id" = bk."client_id"
  WHERE bk."id" = p_booking_id;

  IF v_booking IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'الحجز غير موجود');
  END IF;

  IF v_booking.client_phone != p_phone THEN
    RETURN jsonb_build_object('success', false, 'error', 'رقم الهاتف غير مطابق');
  END IF;

  IF v_booking.status = 'cancelled' THEN
    RETURN jsonb_build_object('success', false, 'error', 'الحجز ملغي بالفعل');
  END IF;

  UPDATE "public"."Booking"
  SET "status" = 'cancelled'
  WHERE "id" = p_booking_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'تم إلغاء الحجز بنجاح',
    'booking_id', p_booking_id
  );
END;
$$;

-- ────────────────────────────────────────────────────────────────────
-- GRANT PERMISSIONS (allow anon/service_role to call these)
-- ────────────────────────────────────────────────────────────────────

GRANT EXECUTE ON FUNCTION get_services_by_branch TO anon, service_role;
GRANT EXECUTE ON FUNCTION get_staff_for_service TO anon, service_role;
GRANT EXECUTE ON FUNCTION get_available_slots TO anon, service_role;
GRANT EXECUTE ON FUNCTION create_bot_booking TO anon, service_role;
GRANT EXECUTE ON FUNCTION get_active_branches TO anon, service_role;
GRANT EXECUTE ON FUNCTION check_customer_bookings TO anon, service_role;
GRANT EXECUTE ON FUNCTION cancel_bot_booking TO anon, service_role;
