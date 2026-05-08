-- Migration: Enable Supabase Realtime for Message and Client tables
-- Run this in Supabase SQL Editor

-- 1. Add tables to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE "public"."Message";
ALTER PUBLICATION supabase_realtime ADD TABLE "public"."Client";

-- 2. Set REPLICA IDENTITY FULL so UPDATE events include all columns
ALTER TABLE "public"."Message" REPLICA IDENTITY FULL;
ALTER TABLE "public"."Client" REPLICA IDENTITY FULL;

-- 3. Enable RLS on both tables (required for Realtime to work with anon key)
ALTER TABLE "public"."Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Client" ENABLE ROW LEVEL SECURITY;

-- 4. Create permissive SELECT policies for the anon role
--    (Realtime needs SELECT permission to broadcast changes)
CREATE POLICY "Allow anon select on Message" ON "public"."Message"
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon select on Client" ON "public"."Client"
  FOR SELECT TO anon USING (true);

-- 5. Allow service_role full access (used by API routes)
CREATE POLICY "Allow service_role full access on Message" ON "public"."Message"
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow service_role full access on Client" ON "public"."Client"
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 6. Allow anon full CRUD (for dashboard operations via anon key)
CREATE POLICY "Allow anon insert on Message" ON "public"."Message"
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon update on Message" ON "public"."Message"
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon delete on Message" ON "public"."Message"
  FOR DELETE TO anon USING (true);

CREATE POLICY "Allow anon insert on Client" ON "public"."Client"
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon update on Client" ON "public"."Client"
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon delete on Client" ON "public"."Client"
  FOR DELETE TO anon USING (true);
