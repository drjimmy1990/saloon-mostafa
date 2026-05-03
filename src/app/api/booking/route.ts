import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase";

// POST — Create a new booking
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { serviceSummary, date, time, location, address, name, phone, notes } = body;

    if (!name || !phone || !serviceSummary || !date || !time) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = getServiceRoleClient();

    // 1. Find or create client by phone
    let clientId: string | null = null;
    const { data: existingClient } = await supabase
      .from("Client")
      .select("id")
      .eq("phone", phone)
      .single();

    if (existingClient) {
      clientId = existingClient.id;
    } else {
      const { data: newClient } = await supabase
        .from("Client")
        .insert({
          name,
          phone,
          platform: "website",
        })
        .select("id")
        .single();
      clientId = newClient?.id || null;
    }

    // 2. Create booking
    const bookingDate = `${date}T${convertTo24h(time)}:00`;
    const { data: booking, error } = await supabase
      .from("Booking")
      .insert({
        client_id: clientId,
        serviceSummary,
        bookingDate,
        channelType: "website",
        status: "pending",
        notes: `${location === "home" ? `📍 ${address}\n` : ""}${notes || ""}`.trim(),
      })
      .select("id")
      .single();

    if (error) {
      console.error("Booking creation error:", error);
      return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
    }

    // 3. Optional: trigger n8n webhook
    // Uncomment and set the URL when ready:
    // try {
    //   await fetch(process.env.N8N_BOOKING_WEBHOOK_URL!, {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({
    //       type: "new_booking",
    //       bookingId: booking?.id,
    //       clientName: name,
    //       clientPhone: phone,
    //       service: serviceSummary,
    //       date: bookingDate,
    //       location,
    //       source: "website",
    //     }),
    //   });
    // } catch (e) {
    //   console.error("Webhook notification failed:", e);
    // }

    return NextResponse.json({ success: true, bookingId: booking?.id });
  } catch (err) {
    console.error("Booking API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Convert 12h time to 24h for database storage
function convertTo24h(time12h: string): string {
  const [time, modifier] = time12h.split(" ");
  let [hours, minutes] = time.split(":");
  let h = parseInt(hours, 10);
  if (modifier === "PM" && h !== 12) h += 12;
  if (modifier === "AM" && h === 12) h = 0;
  return `${h.toString().padStart(2, "0")}:${minutes}`;
}
