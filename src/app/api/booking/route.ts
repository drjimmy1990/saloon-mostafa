import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase";
import {
  createPaymentIntention,
  isPaymobConfigured,
} from "@/lib/paymob";

// Generate a unique booking code like NOON-4821
function generateBookingCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000); // 4-digit random
  return `NOON-${num}`;
}

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

    // 0. Get service details (for deposit amount and booking availability)
    const { data: service } = await supabase
      .from("Product")
      .select("id, name, depositAmount, publishAt")
      .eq("id", serviceId)
      .single();

    const depositAmount = service?.depositAmount ? Number(service.depositAmount) : 0;

    // Check if chosen appointment date is before booking availability start date
    if (service?.publishAt) {
      // Convert publishAt to YYYY-MM-DD in Saudi timezone for date-only comparison
      const availabilityStartDate = new Date(service.publishAt)
        .toLocaleDateString("sv-SE", { timeZone: "Asia/Riyadh" }); // 'sv-SE' gives YYYY-MM-DD
      if (date < availabilityStartDate) {
        const openDate = new Date(service.publishAt)
          .toLocaleDateString("ar-SA", { timeZone: "Asia/Riyadh", year: "numeric", month: "long", day: "numeric" });
        return NextResponse.json(
          { error: `لا يمكن حجز موعد قبل ${openDate}` },
          { status: 400 }
        );
      }
    }

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

    // 5. For queue mode: calculate queue number
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

    // 6. Generate unique booking code
    let bookingCode = generateBookingCode();
    // Ensure uniqueness (retry up to 5 times)
    for (let i = 0; i < 5; i++) {
      const { data: existing } = await supabase
        .from("Booking")
        .select("id")
        .eq("bookingCode", bookingCode)
        .single();
      if (!existing) break;
      bookingCode = generateBookingCode();
    }

    // 7. Determine status and payment expiry
    const hasDeposit = depositAmount > 0 && isPaymobConfigured();
    const initialStatus = hasDeposit ? "waiting_payment" : "pending";
    const paymentExpiresAt = hasDeposit
      ? new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes from now
      : null;

    // 8. Create booking
    const { data: booking, error } = await supabase
      .from("Booking")
      .insert({
        client_id: clientId,
        serviceId,
        serviceSummary: serviceSummary || "",
        bookingDate,
        endTime: durationMode !== "queue" ? endTime : null,
        channelType: (merged.channelType as string) || "website",
        status: initialStatus,
        branchId: branchId || null,
        staff_id: staffId || null,
        depositAmount: depositAmount || 0,
        depositStatus: depositAmount > 0 ? "unpaid" : "unpaid",
        paymentMethod: paymentMethod || "cash",
        queueNumber,
        notes: notes || "",
        bookingCode,
        paymentExpiresAt,
      })
      .select("id, queueNumber, bookingCode")
      .single();

    if (error) {
      if (error.code === '23P01') {
        return NextResponse.json(
          { error: "هذا الوقت محجوز بالفعل. يرجى اختيار وقت آخر." },
          { status: 409 }
        );
      }
      console.error("Booking creation error:", JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: "Failed to create booking" },
        { status: 500 }
      );
    }

    // 9. If deposit required, create Paymob payment intention
    let paymentUrl: string | null = null;
    if (hasDeposit && booking?.id) {
      try {
        const origin = req.headers.get("origin") || "https://salonnoon.net";
        const n8nPaymentWebhook = process.env.N8N_PAYMENT_WEBHOOK_URL;
        const result = await createPaymentIntention({
          amount: Math.round(depositAmount * 100), // Convert to cents (halalas)
          reference: `BOOKING-${booking.id}`,
          billingData: {
            first_name: name.split(" ")[0] || "NA",
            last_name: name.split(" ").slice(1).join(" ") || "NA",
            email: "booking@salonnoon.net",
            phone_number: phone,
          },
          ...(n8nPaymentWebhook ? { notificationUrl: n8nPaymentWebhook } : {}),
          redirectionUrl: `${origin}/booking/success?code=${bookingCode}`,
        });

        paymentUrl = result.checkoutUrl;

        // Store the intention ID
        await supabase
          .from("Booking")
          .update({ paymobIntentionId: result.intentionId })
          .eq("id", booking.id);
      } catch (payErr) {
        console.error("Paymob intent error for booking:", payErr);
        // Payment intent creation failed — cancel the booking entirely
        // so the slot is not held by an unpayable waiting_payment booking.
        await supabase
          .from("Booking")
          .update({ status: "cancelled", paymentExpiresAt: null })
          .eq("id", booking.id);
        return NextResponse.json(
          { error: "تعذر إنشاء رابط الدفع. يرجى المحاولة مرة أخرى أو التواصل معنا." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      bookingId: booking?.id,
      bookingCode: booking?.bookingCode || bookingCode,
      queueNumber: booking?.queueNumber || queueNumber,
      paymentUrl,
      depositAmount: depositAmount || 0,
    });
  } catch (err) {
    console.error("Booking API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
