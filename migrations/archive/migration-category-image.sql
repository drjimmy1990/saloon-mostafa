-- Add image column to Category table for booking wizard display
ALTER TABLE "public"."Category"
ADD COLUMN IF NOT EXISTS "image" TEXT DEFAULT '';
