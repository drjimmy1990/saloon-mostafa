-- ============================================================
-- Salon CRM — Feature Migration 004: Payment Booking Flow
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- ─── 1. Add payment/hold columns to Booking ─────────────────
ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "bookingCode" TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS "paymentExpiresAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "paymobIntentionId" TEXT,
  ADD COLUMN IF NOT EXISTS "paymobTxnId" TEXT;

-- ─── 2. Index for fast lookups ──────────────────────────────
CREATE INDEX IF NOT EXISTS idx_booking_code ON "Booking" ("bookingCode");
CREATE INDEX IF NOT EXISTS idx_booking_payment_expires ON "Booking" ("paymentExpiresAt")
  WHERE status = 'waiting_payment';
CREATE INDEX IF NOT EXISTS idx_booking_pending_created ON "Booking" ("createdAt")
  WHERE status = 'pending';
