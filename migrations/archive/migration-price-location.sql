-- Migration: Change price to TEXT and add location options
ALTER TABLE "public"."Product" 
ALTER COLUMN "price" TYPE TEXT USING "price"::TEXT;

ALTER TABLE "public"."Product" 
ALTER COLUMN "price" SET DEFAULT '';

ALTER TABLE "public"."Product"
ADD COLUMN "availableAtHome" BOOLEAN DEFAULT FALSE,
ADD COLUMN "availableAtSalon" BOOLEAN DEFAULT TRUE;
