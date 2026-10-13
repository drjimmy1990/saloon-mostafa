import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Generate a sequential manual booking code (e.g. M-0001, M-0002, ...)
 * Scans highest existing M-XXXX code in PostgreSQL Booking table and increments sequentially.
 */
export async function generateManualBookingCode(
  supabase: SupabaseClient,
  prefix = "M"
): Promise<string> {
  const { data: existingBookings } = await supabase
    .from("Booking")
    .select("bookingCode")
    .ilike("bookingCode", `${prefix}-%`)
    .order("createdAt", { ascending: false })
    .limit(200);

  let maxNum = 0;
  if (existingBookings && existingBookings.length > 0) {
    const regex = new RegExp(`^${prefix}-(\\d+)$`, "i");
    for (const b of existingBookings) {
      if (b.bookingCode) {
        const match = b.bookingCode.match(regex);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    }
  }

  let nextNum = maxNum + 1;
  while (true) {
    const candidate = `${prefix}-${String(nextNum).padStart(4, "0")}`;
    const { data: exists } = await supabase
      .from("Booking")
      .select("id")
      .ilike("bookingCode", candidate)
      .maybeSingle();

    if (!exists) {
      return candidate;
    }
    nextNum++;
  }
}

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
