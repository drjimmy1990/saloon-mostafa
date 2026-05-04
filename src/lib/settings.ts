import { getServiceRoleClient } from "@/lib/supabase";

export type SiteSettings = Record<string, string>;

/**
 * Fetch all SystemSetting rows as a key-value map.
 * Use in server components — no API call needed, goes direct to DB.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  const supabase = getServiceRoleClient();
  const { data } = await supabase.from("SystemSetting").select("key, value");

  const settings: SiteSettings = {};
  for (const row of data || []) {
    settings[row.key] = row.value ?? "";
  }
  return settings;
}
