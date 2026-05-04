import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase";

// GET /api/settings — fetch all public settings
export async function GET() {
  try {
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from("SystemSetting")
      .select("key, value");

    if (error) throw error;

    const settings: Record<string, string> = {};
    for (const row of data || []) {
      settings[row.key] = row.value;
    }

    return NextResponse.json(settings);
  } catch (err) {
    console.error("Settings fetch error:", err);
    // Safe fallbacks
    return NextResponse.json({
      delivery_fee: "2",
      salon_phone: "962786753791",
      whatsapp_number: "962786753791",
    });
  }
}
