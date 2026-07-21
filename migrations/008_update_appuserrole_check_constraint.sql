-- Migration 008: Allow 'demo' role in AppUserRole_role_check
ALTER TABLE "public"."AppUserRole" DROP CONSTRAINT IF EXISTS "AppUserRole_role_check";
ALTER TABLE "public"."AppUserRole" ADD CONSTRAINT "AppUserRole_role_check" CHECK (role IN ('admin', 'team', 'demo'));
