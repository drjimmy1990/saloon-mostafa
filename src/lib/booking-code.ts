import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Generate a unique booking code (e.g. NOON-4821 or CD109100)
 * Checks PostgreSQL Booking table to prevent any collision.
 */
export async function generateUniqueBookingCode(
  supabase: SupabaseClient,
  prefix = "NOON"
): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const randomNum = Math.floor(1000 + Math.random() * 9000); // 4 digits (e.g. 4821)
    const candidate = `${prefix}-${randomNum}`;
    
    const { data: existing } = await supabase
      .from("Booking")
      .select("id")
      .eq("bookingCode", candidate)
      .maybeSingle();

    if (!existing) {
      return candidate;
    }
  }

  // Fallback timestamp-based code
  return `${prefix}-${Date.now().toString().slice(-5)}`;
}
