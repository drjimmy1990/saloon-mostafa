-- ============================================================
-- Salon CRM — Feature Migration 001
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- ─── Feature 1: Manual Booking Fields ─────────────────────────
ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "bookingTime" TEXT,
  ADD COLUMN IF NOT EXISTS "location" TEXT DEFAULT 'salon',
  ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT DEFAULT 'cash',
  ADD COLUMN IF NOT EXISTS "source" TEXT DEFAULT 'bot',
  ADD COLUMN IF NOT EXISTS "notes" TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS "branchId" UUID REFERENCES "Branch"(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "slotNumber" INTEGER;

-- ─── Feature 2: Staff Blocked Dates ──────────────────────────
CREATE TABLE IF NOT EXISTS "StaffBlockedDate" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "staff_id" UUID NOT NULL REFERENCES "Staff"(id) ON DELETE CASCADE,
  "blockedDate" DATE NOT NULL,
  "reason" TEXT DEFAULT '',
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  UNIQUE("staff_id", "blockedDate")
);
ALTER TABLE "StaffBlockedDate" ENABLE ROW LEVEL SECURITY;

-- ─── Feature 4: Branch Contact Info ──────────────────────────
ALTER TABLE "Branch"
  ADD COLUMN IF NOT EXISTS "whatsapp" TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS "email" TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS "instagramUrl" TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS "facebookUrl" TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS "googleMapsUrl" TEXT DEFAULT '';

-- ─── Feature 6: Offer Channel ────────────────────────────────
ALTER TABLE "Offer"
  ADD COLUMN IF NOT EXISTS "channel" TEXT DEFAULT 'website';

-- ─── Feature 8: Notifications ────────────────────────────────
CREATE TABLE IF NOT EXISTS "Notification" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "type" TEXT NOT NULL DEFAULT 'customer_service',
  "title" TEXT NOT NULL,
  "body" TEXT DEFAULT '',
  "client_id" UUID REFERENCES "Client"(id) ON DELETE SET NULL,
  "isRead" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;

-- ─── Feature 9: Queue Slots ─────────────────────────────────
ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "maxSlots" INTEGER DEFAULT NULL;
