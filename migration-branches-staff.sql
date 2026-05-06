-- ====================================================================
-- MIGRATION: Add Branches, Staff, and Branch Pricing
-- ====================================================================

-- --------------------------------------------------------
-- Table: Branch
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."Branch" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "nameAr" TEXT DEFAULT '',
    "address" TEXT DEFAULT '',
    "phone" TEXT DEFAULT '',
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS handle_updated_at ON "public"."Branch";

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON "public"."Branch" 
FOR EACH ROW EXECUTE FUNCTION moddatetime("updatedAt");

-- --------------------------------------------------------
-- Table: Staff (العاملات)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."Staff" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "nameAr" TEXT DEFAULT '',
    "branchId" UUID REFERENCES "public"."Branch"("id") ON DELETE CASCADE,
    "role" TEXT DEFAULT 'staff',
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS handle_updated_at ON "public"."Staff";

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON "public"."Staff" 
FOR EACH ROW EXECUTE FUNCTION moddatetime("updatedAt");

-- --------------------------------------------------------
-- Table: ProductBranchPrice
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."ProductBranchPrice" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "productId" UUID NOT NULL REFERENCES "public"."Product"("id") ON DELETE CASCADE,
    "branchId" UUID NOT NULL REFERENCES "public"."Branch"("id") ON DELETE CASCADE,
    "price" DOUBLE PRECISION NOT NULL,
    "isAvailable" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_product_branch UNIQUE ("productId", "branchId")
);

DROP TRIGGER IF EXISTS handle_updated_at ON "public"."ProductBranchPrice";

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON "public"."ProductBranchPrice" 
FOR EACH ROW EXECUTE FUNCTION moddatetime("updatedAt");

-- --------------------------------------------------------
-- Alter Table: Booking
-- --------------------------------------------------------
ALTER TABLE "public"."Booking" 
ADD COLUMN IF NOT EXISTS "branchId" UUID REFERENCES "public"."Branch"("id") ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS "staffId" UUID REFERENCES "public"."Staff"("id") ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS "bookingType" TEXT DEFAULT 'in_branch';

-- --------------------------------------------------------
-- Seed: Disable At Home Service (SystemSetting)
-- --------------------------------------------------------
-- Create SystemSetting if it doesn't exist just in case
CREATE TABLE IF NOT EXISTS "public"."SystemSetting" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "key" TEXT UNIQUE NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO "public"."SystemSetting" ("key", "value") 
VALUES ('at_home_service_enabled', 'false')
ON CONFLICT ("key") DO UPDATE SET "value" = 'false';
