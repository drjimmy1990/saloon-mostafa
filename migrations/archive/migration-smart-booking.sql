-- ====================================================================
-- MIGRATION: Smart Booking Engine
-- Adds service duration, deposit, publish timing, staff-service junction,
-- and enhanced booking columns for the availability engine.
-- ====================================================================

-- ────────────────────────────────────────────────────────────────────
-- 1. Product (Service) Enhancements
-- ────────────────────────────────────────────────────────────────────

-- Duration in minutes (e.g. 30, 60, 90)
ALTER TABLE "public"."Product"
ADD COLUMN IF NOT EXISTS "durationMinutes" INTEGER DEFAULT 30;

-- Duration mode: 'time' = customer picks a time slot, 'queue' = customer gets queue number
ALTER TABLE "public"."Product"
ADD COLUMN IF NOT EXISTS "durationMode" TEXT DEFAULT 'time';

-- Deposit amount (عربون) — paid via payment gateway
ALTER TABLE "public"."Product"
ADD COLUMN IF NOT EXISTS "depositAmount" DOUBLE PRECISION DEFAULT 0;

-- Publish timing — NULL = publish immediately, otherwise publish at this date
ALTER TABLE "public"."Product"
ADD COLUMN IF NOT EXISTS "publishAt" TIMESTAMPTZ;

-- ────────────────────────────────────────────────────────────────────
-- 2. StaffService Junction Table (which staff can perform which service)
-- ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "public"."StaffService" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "staff_id" UUID NOT NULL REFERENCES "public"."Staff"("id") ON DELETE CASCADE,
    "product_id" UUID NOT NULL REFERENCES "public"."Product"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_staff_product UNIQUE ("staff_id", "product_id")
);

-- ────────────────────────────────────────────────────────────────────
-- 3. Booking Enhancements
-- ────────────────────────────────────────────────────────────────────

-- Link booking to specific service
ALTER TABLE "public"."Booking"
ADD COLUMN IF NOT EXISTS "serviceId" UUID REFERENCES "public"."Product"("id") ON DELETE SET NULL;

-- End time (calculated as bookingDate + durationMinutes)
ALTER TABLE "public"."Booking"
ADD COLUMN IF NOT EXISTS "endTime" TIMESTAMPTZ;

-- Deposit tracking
ALTER TABLE "public"."Booking"
ADD COLUMN IF NOT EXISTS "depositAmount" DOUBLE PRECISION DEFAULT 0;

ALTER TABLE "public"."Booking"
ADD COLUMN IF NOT EXISTS "depositStatus" TEXT DEFAULT 'unpaid';

-- Queue number (for queue-mode services)
ALTER TABLE "public"."Booking"
ADD COLUMN IF NOT EXISTS "queueNumber" INTEGER;

-- Payment method
ALTER TABLE "public"."Booking"
ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT DEFAULT 'cash';

-- ────────────────────────────────────────────────────────────────────
-- 4. Row Level Security for StaffService
-- ────────────────────────────────────────────────────────────────────

ALTER TABLE "public"."StaffService" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'StaffService' AND policyname = 'Allow anon full access on StaffService'
  ) THEN
    CREATE POLICY "Allow anon full access on StaffService"
      ON "public"."StaffService" FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'StaffService' AND policyname = 'Allow service_role full access on StaffService'
  ) THEN
    CREATE POLICY "Allow service_role full access on StaffService"
      ON "public"."StaffService" FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────────────
-- 5. SystemSetting Seeds (Terms & Conditions)
-- ────────────────────────────────────────────────────────────────────

INSERT INTO "public"."SystemSetting" ("key", "value") VALUES
  ('booking_terms', 'يرجى الالتزام بموعد الحجز. في حالة التأخر أكثر من 15 دقيقة، قد يتم إلغاء الحجز. العربون غير قابل للاسترداد في حالة الإلغاء قبل أقل من 24 ساعة من الموعد.'),
  ('terms_and_conditions', 'باستخدامك لخدمات صالون جاردينيا، فإنك توافق على شروط الخدمة وسياسة الخصوصية الخاصة بنا. جميع الأسعار قابلة للتغيير دون إشعار مسبق.')
ON CONFLICT ("key") DO NOTHING;

-- ────────────────────────────────────────────────────────────────────
-- 6. Deposit Status Constraint (safe add)
-- ────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'booking_deposit_status_check'
  ) THEN
    ALTER TABLE "public"."Booking"
      ADD CONSTRAINT booking_deposit_status_check
      CHECK ("depositStatus" IN ('unpaid', 'paid', 'refunded'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'booking_payment_method_check'
  ) THEN
    ALTER TABLE "public"."Booking"
      ADD CONSTRAINT booking_payment_method_check
      CHECK ("paymentMethod" IN ('cash', 'card', 'online'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_duration_mode_check'
  ) THEN
    ALTER TABLE "public"."Product"
      ADD CONSTRAINT product_duration_mode_check
      CHECK ("durationMode" IN ('time', 'queue'));
  END IF;
END $$;
