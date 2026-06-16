-- Migration: Add bot_services_text SystemSetting
INSERT INTO "public"."SystemSetting" ("key", "value")
VALUES ('bot_services_text', '')
ON CONFLICT ("key") DO NOTHING;
