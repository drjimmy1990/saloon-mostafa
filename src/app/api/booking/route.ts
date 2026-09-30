import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase";
import { normalizePhone } from "@/lib/phone";
import { parseServiceNotice, getEarliestBookingDate, formatDisplayDate, getSaudiToday } from "@/lib/booking-notice";
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
    const name = (merged.name as string)?.trim() || "";
    const rawPhone = merged.phone as string;
    const notes = merged.notes as string || "";
    const paymentMethod = (merged.paymentMethod as string) || "cash";
    const authUserId = merged.authUserId as string | null;
    const durationMode = (merged.durationMode as string) || "time";
    const durationMinutes = Number(merged.durationMinutes) || 30;

    // Support multi-person / group bookings
    // Parses either explicit 'times' array (e.g. ["16:30", "19:00"]),
    // or single 'time' with personsCount (auto-generated consecutive slots),
    // or standard single booking.
    const singleDuration = durationMinutes || 30;
    const rawPersons = merged.personsCount ?? merged.quantity ?? merged.guestCount ?? 1;
    let personsCount = Math.max(1, parseInt(String(rawPersons), 10) || 1);

    let effectiveTimes: string[] = [];
    if (Array.isArray(merged.times) && merged.times.length > 0) {
      effectiveTimes = merged.times.map((t: any) => String(t).trim()).filter(Boolean);
      personsCount = effectiveTimes.length;
    } else if (typeof merged.times === "string" && merged.times.trim()) {
      try {
        const parsed = JSON.parse(merged.times);
        if (Array.isArray(parsed)) {
          effectiveTimes = parsed.map((t: any) => String(t).trim()).filter(Boolean);
        }
      } catch {
        effectiveTimes = merged.times.split(",").map((t: string) => t.trim()).filter(Boolean);
      }
      if (effectiveTimes.length > 0) personsCount = effectiveTimes.length;
    } else if (time && durationMode !== "queue") {
      const trimmedTime = time.trim();
      if (trimmedTime.includes(",")) {
        // e.g. time: "16:30, 19:00"
        effectiveTimes = trimmedTime.split(",").map((t: string) => t.trim()).filter(Boolean);
        if (effectiveTimes.length > 0) personsCount = effectiveTimes.length;
      } else if (personsCount > 1) {
        // Auto-generate discrete consecutive slots for website flow so each person gets a real slot
        const [h, m] = trimmedTime.split(":").map(Number);
        const startTotalM = h * 60 + m;
        for (let p = 0; p < personsCount; p++) {
          const slotM = startTotalM + (p * singleDuration);
          const sh = Math.floor(slotM / 60);
          const sm = slotM % 60;
          effectiveTimes.push(`${sh.toString().padStart(2, "0")}:${sm.toString().padStart(2, "0")}`);
        }
      } else {
        effectiveTimes = [trimmedTime];
      }
    }

    if (!name || !rawPhone || !serviceId || !date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const phone = normalizePhone(rawPhone);
    const last9 = phone.length >= 9 ? phone.slice(-9) : phone;

    const supabase = getServiceRoleClient();

    // 0. Get service details (for deposit amount and booking availability)
    const { data: service } = await supabase
      .from("Product")
      .select("id, name, depositAmount, publishAt, maxSlots")
      .eq("id", serviceId)
      .single();

    const unitDeposit = service?.depositAmount ? Number(service.depositAmount) : 0;
    const finalPersonsCount = effectiveTimes.length > 0 ? effectiveTimes.length : personsCount;
    const depositAmount = unitDeposit * finalPersonsCount;

    // Check if chosen appointment date is before booking availability start date / rolling notice
    if (service?.publishAt) {
      const earliestBookingDate = getEarliestBookingDate(service.publishAt);
      if (date < earliestBookingDate) {
        const notice = parseServiceNotice(service.publishAt);
        const formattedOpen = formatDisplayDate(earliestBookingDate, "ar");
        const msg = notice.noticeHours > 0
          ? `لا يمكن حجز هذه الخدمة إلا بحجز مسبق قبل ${notice.labelAr} (أقرب موعد متاح: ${formattedOpen})`
          : `لا يمكن حجز موعد قبل ${formattedOpen}`;
        return NextResponse.json(
          { error: msg },
          { status: 400 }
        );
      }
    }

    // Validate that the appointment date hasn't already passed
    const saudiToday = getSaudiToday();
    if (date < saudiToday) {
      return NextResponse.json(
        { error: "لا يمكن حجز موعد في تاريخ سابق" },
        { status: 400 }
      );
    }

    // Parse each slot into start/end and validate past time
    interface SlotItem {
      time: string;
      bookingDate: string;
      endTime: string;
      startMinutes: number;
      endMinutes: number;
    }

    const parsedSlots: SlotItem[] = [];
    for (const t of effectiveTimes) {
      const slotMs = new Date(`${date}T${t}:00+03:00`).getTime();
      if (slotMs <= Date.now()) {
        return NextResponse.json(
          { error: `الموعد الساعة ${t} قد مضى بالفعل، يرجى اختيار موعد قادم` },
          { status: 400 }
        );
      }
      const [tH, tM] = t.split(":").map(Number);
      const sStart = tH * 60 + (tM || 0);
      const sEnd = sStart + singleDuration;
      const endH = Math.floor(sEnd / 60);
      const endM = sEnd % 60;
      parsedSlots.push({
        time: t,
        bookingDate: `${date}T${t}:00Z`,
        endTime: `${date}T${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}:00Z`,
        startMinutes: sStart,
        endMinutes: sEnd,
      });
    }

    // Check overlap between the requested slots themselves
    for (let i = 0; i < parsedSlots.length; i++) {
      for (let j = i + 1; j < parsedSlots.length; j++) {
        const s1 = parsedSlots[i];
        const s2 = parsedSlots[j];
        if (s1.startMinutes < s2.endMinutes && s2.startMinutes < s1.endMinutes) {
          return NextResponse.json(
            { error: `يوجد تداخل بين الموعدين المحددين (${s1.time} و ${s2.time}). كل موعد يحتاج إلى ${singleDuration} دقيقة منفصلة.` },
            { status: 400 }
          );
        }
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
      // Resilient client match: match by normalized phone suffix or platform_user_id
      const { data: existingClients } = await supabase
        .from("Client")
        .select("id, name, phone")
        .or(`phone.ilike.%${last9}%,platform_user_id.ilike.%${last9}%`)
        .order("createdAt", { ascending: false })
        .limit(1);

      const existingClient = existingClients?.[0];

      if (existingClient) {
        clientId = existingClient.id;
        // Update client phone to canonical format if it was unnormalized or dirty
        if (existingClient.phone !== phone) {
          await supabase.from("Client").update({ phone }).eq("id", existingClient.id);
        }
      } else {
        const { data: newClient } = await supabase
          .from("Client")
          .insert({
            name,
            phone,
            platform: (merged.channelType as string) || "website",
            auth_user_id: authUserId || null,
          })
          .select("id")
          .single();
        clientId = newClient?.id || null;
      }
    }

    // 2. Check if staff has a blocked date (emergency leave)
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

    // 3. Check for overlap against existing DB bookings for this staff on this date
    if (durationMode !== "queue" && staffId && parsedSlots.length > 0) {
      const { data: overlaps } = await supabase
        .from("Booking")
        .select("id, bookingDate, endTime, status, paymentExpiresAt")
        .eq("staff_id", staffId)
        .neq("status", "cancelled")
        .gte("bookingDate", `${date}T00:00:00`)
        .lt("bookingDate", `${date}T23:59:59`);

      if (overlaps && overlaps.length > 0) {
        const nowMs = Date.now();
        const expiredOverlapIds: string[] = [];

        for (const slot of parsedSlots) {
          const newStart = new Date(slot.bookingDate).getTime();
          const newEnd = new Date(slot.endTime).getTime();
          const hasConflict = overlaps.some((b) => {
            // Ignore expired waiting_payment bookings (released after 10 min)
            if (b.status === "waiting_payment" && b.paymentExpiresAt) {
              const expiresMs = new Date(b.paymentExpiresAt).getTime();
              if (expiresMs <= nowMs) {
                expiredOverlapIds.push(b.id);
                return false;
              }
            }

            const bStart = new Date(b.bookingDate).getTime();
            const bEnd = b.endTime
              ? new Date(b.endTime).getTime()
              : bStart + singleDuration * 60 * 1000;
            return newStart < bEnd && newEnd > bStart;
          });

          if (hasConflict) {
            return NextResponse.json(
              { error: `الموعد الساعة ${slot.time} محجوز بالفعل مع هذه الأخصائية. يرجى اختيار وقت آخر.` },
              { status: 409 }
            );
          }
        }

        // Clean up expired overlap bookings in DB in background
        if (expiredOverlapIds.length > 0) {
          supabase
            .from("Booking")
            .update({
              status: "cancelled",
              paymentExpiresAt: null,
              notes: "انتهت مهلة سداد العربون (10 دقائق)"
            })
            .in("id", expiredOverlapIds)
            .then(() => {});
        }
      }
    }

    // Determine status and payment expiry
    const hasDeposit = depositAmount > 0 && isPaymobConfigured();
    const initialStatus = hasDeposit ? "waiting_payment" : "pending";
    const paymentExpiresAt = hasDeposit
      ? new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes from now
      : null;

    // ─── MULTI-SLOT GROUP BOOKINGS (2+ slots) ───────────────────
    if (parsedSlots.length > 1) {
      const createdBookings: any[] = [];
      for (let i = 0; i < parsedSlots.length; i++) {
        const slot = parsedSlots[i];
        let bookingCode = generateBookingCode();
        for (let r = 0; r < 5; r++) {
          const { data: existing } = await supabase
            .from("Booking")
            .select("id")
            .eq("bookingCode", bookingCode)
            .single();
          if (!existing) break;
          bookingCode = generateBookingCode();
        }

        const formattedSummary = `${serviceSummary || service?.name || "خدمة"} (شخص ${i + 1})`;
        const formattedNotes = `[حجز جماعي - شخص ${i + 1} الساعة ${slot.time}] ${notes}`.trim();

        const { data: bRecord, error: bErr } = await supabase
          .from("Booking")
          .insert({
            client_id: clientId,
            serviceId,
            serviceSummary: formattedSummary,
            bookingDate: slot.bookingDate,
            endTime: slot.endTime,
            channelType: (merged.channelType as string) || "website",
            status: initialStatus,
            branchId: branchId || null,
            staff_id: staffId || null,
            depositAmount: unitDeposit,
            depositStatus: "unpaid",
            paymentMethod: paymentMethod || "cash",
            notes: formattedNotes,
            bookingCode,
            paymentExpiresAt,
          })
          .select("id, queueNumber, bookingCode, bookingDate, endTime")
          .single();

        if (bErr || !bRecord) {
          console.error("Group booking slot insertion error:", bErr);
          return NextResponse.json(
            { error: "فشل في تسجيل أحد المواعيد، يرجى المحاولة مرة أخرى." },
            { status: 500 }
          );
        }
        createdBookings.push(bRecord);
      }

      // Unified Paymob payment intention for the entire group
      let paymentUrl: string | null = null;
      if (hasDeposit && createdBookings.length > 0) {
        try {
          const origin = req.headers.get("origin") || "https://salonnoon.net";
          const n8nPaymentWebhook = process.env.N8N_PAYMENT_WEBHOOK_URL;
          const result = await createPaymentIntention({
            amount: Math.round(depositAmount * 100), // Total deposit in cents (halalas)
            reference: `BOOKING-${createdBookings[0].id}`,
            billingData: {
              first_name: name.split(" ")[0] || "NA",
              last_name: name.split(" ").slice(1).join(" ") || "NA",
              email: "booking@salonnoon.net",
              phone_number: phone,
            },
            ...(n8nPaymentWebhook ? { notificationUrl: n8nPaymentWebhook } : {}),
            redirectionUrl: `${origin}/booking/success?code=${createdBookings[0].bookingCode}`,
          });

          paymentUrl = result.checkoutUrl;

          // Store the same paymobIntentionId across ALL bookings in this group
          const createdIds = createdBookings.map((b) => b.id);
          await supabase
            .from("Booking")
            .update({ paymobIntentionId: result.intentionId })
            .in("id", createdIds);
        } catch (payErr) {
          console.error("Paymob group intention creation failed:", payErr);
          const createdIds = createdBookings.map((b) => b.id);
          await supabase
            .from("Booking")
            .update({ status: "cancelled", paymentExpiresAt: null })
            .in("id", createdIds);
          return NextResponse.json(
            { error: "تعذر إنشاء رابط الدفع. يرجى المحاولة مرة أخرى أو التواصل معنا." },
            { status: 500 }
          );
        }
      }

      return NextResponse.json({
        success: true,
        bookingId: createdBookings[0].id,
        bookingCode: createdBookings[0].bookingCode,
        bookingCodes: createdBookings.map((b) => b.bookingCode),
        queueNumber: null,
        paymentUrl,
        depositAmount,
        unitDeposit,
        personsCount: createdBookings.length,
        times: parsedSlots.map((s) => s.time),
        bookings: createdBookings,
      });
    }

    // ─── SINGLE BOOKING FLOW (1 slot or queue mode) ─────────────
    const primarySlot = parsedSlots[0];
    const bookingDate = primarySlot ? primarySlot.bookingDate : `${date}T00:00:00Z`;
    const endTime = primarySlot ? primarySlot.endTime : null;

    // For queue mode: calculate queue number
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

      if (service?.maxSlots && queueNumber > service.maxSlots) {
        return NextResponse.json(
          { error: "تم اكتمال عدد الحجوزات لهذا اليوم" },
          { status: 409 }
        );
      }
    }

    // Generate unique booking code
    let bookingCode = generateBookingCode();
    for (let i = 0; i < 5; i++) {
      const { data: existing } = await supabase
        .from("Booking")
        .select("id")
        .eq("bookingCode", bookingCode)
        .single();
      if (!existing) break;
      bookingCode = generateBookingCode();
    }

    const { data: booking, error } = await supabase
      .from("Booking")
      .insert({
        client_id: clientId,
        serviceId,
        serviceSummary: serviceSummary || service?.name || "",
        bookingDate,
        endTime: durationMode !== "queue" ? endTime : null,
        channelType: (merged.channelType as string) || "website",
        status: initialStatus,
        branchId: branchId || null,
        staff_id: staffId || null,
        depositAmount: depositAmount || 0,
        depositStatus: "unpaid",
        paymentMethod: paymentMethod || "cash",
        queueNumber,
        notes: notes || "",
        bookingCode,
        paymentExpiresAt,
      })
      .select("id, queueNumber, bookingCode, bookingDate")
      .single();

    if (error) {
      if (error.code === '23P01' || error.code === '23505') {
        return NextResponse.json(
          { error: "هذا الوقت محجوز بالفعل. يرجى اختيار وقت آخر." },
          { status: 409 }
        );
      }
      if (error.message?.includes('max_slots_exceeded')) {
        return NextResponse.json(
          { error: "تم اكتمال عدد الحجوزات لهذا اليوم" },
          { status: 409 }
        );
      }
      console.error("Booking creation error:", JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: "Failed to create booking" },
        { status: 500 }
      );
    }

    // If deposit required, create Paymob payment intention
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

        await supabase
          .from("Booking")
          .update({ paymobIntentionId: result.intentionId })
          .eq("id", booking.id);
      } catch (payErr) {
        console.error("Paymob intent error for booking:", payErr);
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
      unitDeposit: unitDeposit || 0,
      personsCount: 1,
    });
  } catch (err) {
    console.error("Booking API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
