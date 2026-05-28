-- ============================================================
-- 002_contact_messages.sql
-- Creates ContactMessage table for website contact form submissions
-- ============================================================

CREATE TABLE IF NOT EXISTS public."ContactMessage" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT DEFAULT '',
  message TEXT NOT NULL,
  "branchId" UUID REFERENCES public."Branch"(id) ON DELETE SET NULL,
  "isRead" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- Index for dashboard queries (unread first, newest first)
CREATE INDEX IF NOT EXISTS idx_contact_message_read_date
  ON public."ContactMessage" ("isRead", "createdAt" DESC);

-- Allow service_role full access
ALTER TABLE public."ContactMessage" ENABLE ROW LEVEL SECURITY;

-- RLS: allow service_role to do everything (anon insert for public form)
CREATE POLICY "service_role_full_access" ON public."ContactMessage"
  FOR ALL USING (true) WITH CHECK (true);
