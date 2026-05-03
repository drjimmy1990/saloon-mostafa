INSERT INTO "public"."AppUserRole" (user_id, email, name, role, permissions)
VALUES (
  'PASTE-YOUR-UUID-HERE',
  'your@email.com',
  'المدير',
  'admin',
  '["all"]'::jsonb
);