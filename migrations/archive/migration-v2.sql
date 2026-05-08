-- ====================================================================
-- GARDENIA SALON — PLATFORM UPGRADE MIGRATION (v2)
-- Run this in Supabase SQL Editor
-- ====================================================================

-- ====================================================================
-- 1. STAFF TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS "public"."Staff" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "phone" TEXT DEFAULT '',
    "role" TEXT DEFAULT 'stylist',
    "avatar" TEXT DEFAULT '',
    "isActive" BOOLEAN DEFAULT TRUE,
    "services" JSONB DEFAULT '[]'::jsonb,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS handle_updated_at ON "public"."Staff";
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON "public"."Staff"
FOR EACH ROW EXECUTE FUNCTION moddatetime("updatedAt");

-- ====================================================================
-- 2. STAFF SCHEDULE TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS "public"."StaffSchedule" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "staff_id" UUID NOT NULL REFERENCES "public"."Staff"("id") ON DELETE CASCADE,
    "dayOfWeek" INTEGER NOT NULL CHECK ("dayOfWeek" BETWEEN 0 AND 6),
    "startTime" TIME NOT NULL DEFAULT '09:00',
    "endTime" TIME NOT NULL DEFAULT '18:00',
    "isOff" BOOLEAN DEFAULT FALSE,
    UNIQUE("staff_id", "dayOfWeek")
);

-- ====================================================================
-- 3. LINK BOOKINGS TO STAFF
-- ====================================================================
ALTER TABLE "public"."Booking"
    ADD COLUMN IF NOT EXISTS "staff_id" UUID REFERENCES "public"."Staff"("id") ON DELETE SET NULL;

-- ====================================================================
-- 4. OFFER TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS "public"."Offer" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "product_id" UUID NOT NULL REFERENCES "public"."Product"("id") ON DELETE CASCADE,
    "discountType" TEXT NOT NULL CHECK ("discountType" IN ('percentage', 'fixed')),
    "discountValue" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMPTZ,
    "endDate" TIMESTAMPTZ,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS handle_updated_at ON "public"."Offer";
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON "public"."Offer"
FOR EACH ROW EXECUTE FUNCTION moddatetime("updatedAt");

-- ====================================================================
-- 5. PRODUCT STOCK COLUMN
-- ====================================================================
ALTER TABLE "public"."Product"
    ADD COLUMN IF NOT EXISTS "stock" INTEGER DEFAULT NULL;

-- ====================================================================
-- 6. CLIENT ENHANCEMENTS
-- ====================================================================
ALTER TABLE "public"."Client"
    ADD COLUMN IF NOT EXISTS "tags" JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS "email" TEXT DEFAULT '';

-- ====================================================================
-- 7. GALLERY TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS "public"."Gallery" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "title" TEXT DEFAULT '',
    "imageUrl" TEXT NOT NULL,
    "category" TEXT DEFAULT '',
    "sortOrder" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 8. ORDER TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS "public"."Order" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "orderCode" TEXT NOT NULL UNIQUE DEFAULT '',
    "client_id" UUID REFERENCES "public"."Client"("id") ON DELETE SET NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerAddress" TEXT DEFAULT '',
    "items" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "subtotal" DOUBLE PRECISION DEFAULT 0,
    "deliveryFee" DOUBLE PRECISION DEFAULT 0,
    "total" DOUBLE PRECISION DEFAULT 0,
    "status" TEXT DEFAULT 'pending' CHECK ("status" IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
    "paymentMethod" TEXT DEFAULT 'cash',
    "paymentStatus" TEXT DEFAULT 'unpaid' CHECK ("paymentStatus" IN ('unpaid', 'paid', 'refunded')),
    "notes" TEXT DEFAULT '',
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS handle_updated_at ON "public"."Order";
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON "public"."Order"
FOR EACH ROW EXECUTE FUNCTION moddatetime("updatedAt");

-- Auto-generate order code
CREATE OR REPLACE FUNCTION generate_order_code()
RETURNS TRIGGER AS $$
DECLARE
    today_count INTEGER;
    today_str TEXT;
BEGIN
    today_str := TO_CHAR(NOW(), 'YYYYMMDD');
    SELECT COUNT(*) + 1 INTO today_count FROM "public"."Order"
    WHERE "createdAt"::date = CURRENT_DATE;
    NEW."orderCode" := 'GRD-' || today_str || '-' || LPAD(today_count::TEXT, 3, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_order_code ON "public"."Order";
CREATE TRIGGER set_order_code
BEFORE INSERT ON "public"."Order"
FOR EACH ROW EXECUTE FUNCTION generate_order_code();

-- ====================================================================
-- 9. CMS PAGES TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS "public"."CmsPage" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "slug" TEXT UNIQUE NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT DEFAULT '',
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS handle_updated_at ON "public"."CmsPage";
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON "public"."CmsPage"
FOR EACH ROW EXECUTE FUNCTION moddatetime("updatedAt");

INSERT INTO "public"."CmsPage" ("slug", "title", "content") VALUES
    ('about', 'من نحن', ''),
    ('contact', 'تواصلي معنا', ''),
    ('privacy', 'سياسة الخصوصية', ''),
    ('terms', 'الشروط والأحكام', ''),
    ('booking-conditions', 'شروط الحجز', '')
ON CONFLICT ("slug") DO NOTHING;

-- ====================================================================
-- 10. ROW LEVEL SECURITY FOR ALL NEW TABLES
-- ====================================================================

-- Staff
ALTER TABLE "public"."Staff" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon full access on Staff" ON "public"."Staff" FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full access on Staff" ON "public"."Staff" FOR ALL TO service_role USING (true) WITH CHECK (true);

-- StaffSchedule
ALTER TABLE "public"."StaffSchedule" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon full access on StaffSchedule" ON "public"."StaffSchedule" FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full access on StaffSchedule" ON "public"."StaffSchedule" FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Offer
ALTER TABLE "public"."Offer" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon full access on Offer" ON "public"."Offer" FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full access on Offer" ON "public"."Offer" FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Gallery
ALTER TABLE "public"."Gallery" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon full access on Gallery" ON "public"."Gallery" FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full access on Gallery" ON "public"."Gallery" FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Order
ALTER TABLE "public"."Order" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon full access on Order" ON "public"."Order" FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role full access on Order" ON "public"."Order" FOR ALL TO service_role USING (true) WITH CHECK (true);

-- CmsPage
ALTER TABLE "public"."CmsPage" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon read on CmsPage" ON "public"."CmsPage" FOR SELECT TO anon USING (true);
CREATE POLICY "Allow service_role full access on CmsPage" ON "public"."CmsPage" FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ====================================================================
-- DONE! Run this entire script in Supabase SQL Editor.
-- ====================================================================
