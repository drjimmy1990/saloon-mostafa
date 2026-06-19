import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase";

// POST — Create a new booking
export async function POST(req: NextRequest) {
  try {
    // Support both JSON body (website) and query params (n8n bot)
    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      // If no JSON body, fall back to query params (n8n sends data this way)
    }
    
    // Merge query params as fallback
    const url = new URL(req.url);
    const params = Object.fromEntries(url.searchParams.entries());
    const merged = { ...params, ...body };
    
    const serviceId = merged.serviceId as string;
    const serviceSummary = merged.serviceSummary as string || "";
    const date = merged.date as string;
    const time = merged.time as string | null;
    const branchId = merged.branchId as string;
    const staffId = merged.staffId as string;
    const name = merged.name as string;
    const phone = merged.phone as string;
    const notes = merged.notes as string || "";
    const depositAmount = Number(merged.depositAmount) || 0;
    const paymentMethod = (merged.paymentMethod as string) || "cash";
    const authUserId = merged.authUserId as string | null;
    const durationMode = (merged.durationMode as string) || "time";
    const durationMinutes = Number(merged.durationMinutes) || 30;

    if (!name || !phone || !serviceId || !date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // 1. Find or create client
    let clientId: string | null = null;

    if (authUserId) {
      const { data: authClient } = await supabase
        .from("Client")
        .select("id, name, phone")
        .eq("auth_user_id", authUserId)
        .single();
      if (authClient) {
        clientId = authClient.id;
        // Always update name/phone from booking form so user can change them
        const updates: Record<string, string> = {};
        if (name && name !== authClient.name) updates.name = name;
        if (phone && phone !== authClient.phone) updates.phone = phone;
        if (Object.keys(updates).length > 0) {
          await supabase.from("Client").update(updates).eq("id", authClient.id);
        }
      }
    }

    if (!clientId) {
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
            auth_user_id: authUserId || null,
          })
          .select("id")
          .single();
        clientId = newClient?.id || null;
      }
    }

    // 2. Calculate booking date and end time
    // Store as UTC so the time value matches exactly what user selected
    const bookingDate =
      time && durationMode !== "queue"
        ? `${date}T${time}:00Z`
        : `${date}T00:00:00Z`;
    const duration = durationMinutes || 30;
    // Calculate end time manually to avoid timezone shifts
    const [timeH, timeM] = (time || "00:00").split(":").map(Number);
    const endMinutes = timeH * 60 + timeM + duration;
    const endH = Math.floor(endMinutes / 60);
    const endM = endMinutes % 60;
    const endTime = `${date}T${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}:00Z`;

    // 3. Check if staff has a blocked date (emergency leave)
    if (staffId && date) {
      const { data: blockedDate } = await supabase
        .from("StaffBlockedDate")
        .select("id")
        .eq("staff_id", staffId)
        .eq("blockedDate", date)
        .limit(1);

      if (blockedDate && blockedDate.length > 0) {
        return NextResponse.json(
          { error: "العاملة في إجازة في هذا اليوم. يرجى اختيار يوم آخر." },
          { status: 409 }
        );
      }
    }

    // 4. For time-based bookings: double-check for overlap
    if (durationMode !== "queue" && staffId && time) {
      const { data: overlaps } = await supabase
        .from("Booking")
        .select("id, bookingDate, endTime")
        .eq("staff_id", staffId)
        .neq("status", "cancelled")
        .gte("bookingDate", `${date}T00:00:00`)
        .lt("bookingDate", `${date}T23:59:59`);

      if (overlaps) {
        const newStart = new Date(bookingDate).getTime();
        const newEnd = new Date(endTime).getTime();

        const hasConflict = overlaps.some((b) => {
          const bStart = new Date(b.bookingDate).getTime();
          const bEnd = b.endTime
            ? new Date(b.endTime).getTime()
            : bStart + duration * 60 * 1000;
          return newStart < bEnd && newEnd > bStart;
        });

        if (hasConflict) {
          return NextResponse.json(
            { error: "هذا الوقت محجوز بالفعل. يرجى اختيار وقت آخر." },
            { status: 409 }
          );
        }
      }
    }

    // 4. For queue mode: calculate queue number
    let queueNumber: number | null = null;
    if (durationMode === "queue") {
      const { count } = await supabase
        .from("Booking")
        .select("id", { count: "exact", head: true })
        .eq("staff_id", staffId)
        .eq("serviceId", serviceId)
        .gte("bookingDate", `${date}T00:00:00`)
        .lt("bookingDate", `${date}T23:59:59`)
        .neq("status", "cancelled");

      queueNumber = (count || 0) + 1;
    }

    // 5. Create booking
    const { data: booking, error } = await supabase
      .from("Booking")
      .insert({
        client_id: clientId,
        serviceId,
        serviceSummary: serviceSummary || "",
        bookingDate,
        endTime: durationMode !== "queue" ? endTime : null,
        channelType: (merged.channelType as string) || "website",
        status: "pending",
        branchId: branchId || null,
        staff_id: staffId || null,
        depositAmount: depositAmount || 0,
        depositStatus: depositAmount > 0 ? "unpaid" : "unpaid",
        paymentMethod: paymentMethod || "cash",
        queueNumber,
        notes: notes || "",
      })
      .select("id, queueNumber")
      .single();

    if (error) {
      console.error("Booking creation error:", JSON.stringify(error, null, 2));
      console.error("Booking insert payload:", JSON.stringify({
        client_id: clientId, serviceId, serviceSummary, bookingDate, endTime,
        branchId, staff_id: staffId, depositAmount, paymentMethod, queueNumber,
      }, null, 2));
      return NextResponse.json(
        { error: "Failed to create booking", details: error.message || error.code },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      bookingId: booking?.id,
      queueNumber: booking?.queueNumber || queueNumber,
    });
  } catch (err) {
    console.error("Booking API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
