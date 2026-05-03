import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase";

// GET /api/settings — fetch public settings (delivery_fee, etc.)
export async function GET() {
  try {
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from("SystemSetting")
      .select("key, value")
      .in("key", ["delivery_fee", "salon_address"]);

    if (error) throw error;

    const settings: Record<string, string> = {};
    for (const row of data || []) {
      settings[row.key] = row.value;
    }

    return NextResponse.json(settings);
  } catch (err) {
    console.error("Settings fetch error:", err);
    return NextResponse.json({ delivery_fee: "2" }); // fallback
  }
}
