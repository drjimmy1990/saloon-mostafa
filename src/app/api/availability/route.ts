import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import { parseServiceNotice, getEarliestBookingDate, formatDisplayDate, getSaudiToday } from "@/lib/booking-notice";

export const dynamic = "force-dynamic";

// GET /api/availability?staffId=xxx&serviceId=xxx&date=2026-05-10&excludeBookingId=yyy
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get("staffId");
    const serviceId = searchParams.get("serviceId");
    const date = searchParams.get("date"); // YYYY-MM-DD
    const excludeBookingId = searchParams.get("excludeBookingId");

    if (!staffId || !serviceId || !date) {
      return NextResponse.json(
        { error: "staffId, serviceId, and date are required" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // 1. Get service details (duration, mode, booking availability)
    const { data: service, error: svcErr } = await supabase
      .from("Product")
      .select("id, name, durationMinutes, durationMode, depositAmount, publishAt")
      .eq("id", serviceId)
      .single();

    if (svcErr || !service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // 1b. Check if requested date is in the past or before the booking availability start date / rolling notice
    const saudiToday = getSaudiToday();
    const earliestBookingDate = getEarliestBookingDate(service.publishAt);
    const minAllowedDate = earliestBookingDate > saudiToday ? earliestBookingDate : saudiToday;

    if (date < minAllowedDate) {
      const notice = parseServiceNotice(service.publishAt);
      const isPastDate = date < saudiToday;
      const formattedOpen = formatDisplayDate(minAllowedDate, "ar");
      const message = isPastDate
        ? "لا يمكن حجز موعد في تاريخ سابق"
        : (notice.noticeHours > 0
            ? `هذه الخدمة تتطلب حجزاً مسبقاً قبل ${notice.labelAr}. المواعيد المتاحة تبدأ من ${formattedOpen}`
            : `المواعيد تبدأ من ${formattedOpen}`);
      return NextResponse.json({
        mode: service.durationMode,
        slots: [],
        blocked: false,
        bookingNotYetOpen: true,
        availabilityStartDate: minAllowedDate,
        message,
      });
    }

    // If queue mode, check blocked date and return next queue number
    if (service.durationMode === "queue") {
      const { data: blocked } = await supabase
        .from("StaffBlockedDate")
        .select("id")
        .eq("staff_id", staffId)
        .eq("blockedDate", date)
        .limit(1);

      if (blocked && blocked.length > 0) {
        return NextResponse.json({
          mode: "queue",
          slots: [],
          blocked: true,
          message: "العاملة في إجازة في هذا اليوم",
        });
      }

      const { count } = await supabase
        .from("Booking")
        .select("id", { count: "exact", head: true })
        .eq("staff_id", staffId)
        .eq("serviceId", serviceId)
        .gte("bookingDate", `${date}T00:00:00`)
        .lt("bookingDate", `${date}T23:59:59`)
        .neq("status", "cancelled");

      return NextResponse.json({
        mode: "queue",
        nextQueueNumber: (count || 0) + 1,
        serviceDuration: service.durationMinutes,
        depositAmount: service.depositAmount || 0,
        blocked: false,
      });
    }

    // 2. Check if staff has a blocked date (emergency leave / holiday)
    const { data: blockedDate } = await supabase
      .from("StaffBlockedDate")
      .select("id, reason")
      .eq("staff_id", staffId)
      .eq("blockedDate", date)
      .limit(1);

    if (blockedDate && blockedDate.length > 0) {
      return NextResponse.json({
        mode: "time",
        slots: [],
        blocked: true,
        serviceDuration: service.durationMinutes,
        depositAmount: service.depositAmount || 0,
        message: "العاملة في إجازة في هذا اليوم",
      });
    }

    // 3. Get staff schedule for this day of week
    const dateObj = new Date(date + "T00:00:00");
    const dayOfWeek = dateObj.getDay(); // 0=Sunday, 6=Saturday

    const { data: schedule } = await supabase
      .from("StaffSchedule")
      .select("startTime, endTime, isOff")
      .eq("staff_id", staffId)
      .eq("dayOfWeek", dayOfWeek)
      .single();

    // Use schedule or default working hours if none set
    const effectiveSchedule = schedule && !schedule.isOff
      ? schedule
      : !schedule
        ? { startTime: "09:00", endTime: "21:00", isOff: false }
        : null;

    if (!effectiveSchedule || effectiveSchedule.isOff) {
      return NextResponse.json({
        mode: "time",
        slots: [],
        blocked: true,
        isOff: true,
        staffSchedule: schedule || null,
        serviceDuration: service.durationMinutes,
        depositAmount: service.depositAmount || 0,
        message: "العاملة في يوم عطلة (إجازة أسبوعية)",
      });
    }

    // 4. Get ALL confirmed/pending bookings for this staff on this date
    let bookingsQuery = supabase
      .from("Booking")
      .select("id, bookingDate, endTime, serviceId")
      .eq("staff_id", staffId)
      .neq("status", "cancelled");

    if (excludeBookingId) {
      bookingsQuery = bookingsQuery.neq("id", excludeBookingId);
    }

    const { data: bookings } = await bookingsQuery;

    // 5. Generate available time slots based on staff working hours
    const duration = service.durationMinutes || 30;
    const [startH, startM] = effectiveSchedule.startTime.split(":").map(Number);
    const [endH, endM] = effectiveSchedule.endTime.split(":").map(Number);
    let scheduleStart = startH * 60 + (startM || 0);
    let scheduleEnd = endH * 60 + (endM || 0);

    // Defensive normalization if start and end times were entered in reverse
    if (scheduleStart > scheduleEnd) {
      const temp = scheduleStart;
      scheduleStart = scheduleEnd;
      scheduleEnd = temp;
    }

    // Parse existing bookings into minute ranges — only for the requested date
    const bookedRanges: Array<{ start: number; end: number }> = [];
    if (bookings) {
      for (const b of bookings) {
        if (!b.bookingDate) continue;

        // Extract date part from bookingDate for comparison
        const bDateStr = b.bookingDate.substring(0, 10);
        if (bDateStr !== date) continue;

        // Parse time from booking
        const bDateObj = new Date(b.bookingDate);
        const bStart = bDateObj.getUTCHours() * 60 + bDateObj.getUTCMinutes();
        let bEnd: number;
        if (b.endTime) {
          const eDateObj = new Date(b.endTime);
          bEnd = eDateObj.getUTCHours() * 60 + eDateObj.getUTCMinutes();
        } else {
          bEnd = bStart + duration;
        }

        if (bEnd <= bStart) bEnd = bStart + duration;
        bookedRanges.push({ start: bStart, end: bEnd });
      }
    }

    // Generate slots at intervals matching service duration
    const interval = duration;
    const slots: Array<{ time: string; booked: boolean }> = [];

    // Check notice period and passed time for individual slot times
    const notice = parseServiceNotice(service.publishAt);
    const nowMs = Date.now();
    const minSlotTimeMs = nowMs + (notice.noticeHours * 3600 * 1000);

    for (let t = scheduleStart; t + duration <= scheduleEnd; t += interval) {
      const slotEnd = t + duration;

      // Check for overlap with any existing booking
      const hasOverlap = bookedRanges.some(
        (range) => t < range.end && slotEnd > range.start
      );

      const h = Math.floor(t / 60);
      const m = t % 60;
      const timeStr = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;

      // Accurate slot time in Saudi Arabia timezone (UTC+3)
      const slotMs = new Date(`${date}T${timeStr}:00+03:00`).getTime();
      const hasPassed = slotMs <= nowMs;
      const isBeforeNotice = slotMs < minSlotTimeMs;

      slots.push({
        time: timeStr,
        booked: hasOverlap || hasPassed || isBeforeNotice,
      });
    }

    return NextResponse.json({
      mode: "time",
      slots,
      staffSchedule: {
        startTime: effectiveSchedule.startTime,
        endTime: effectiveSchedule.endTime,
      },
      serviceDuration: duration,
      depositAmount: service.depositAmount || 0,
      blocked: false,
    });
  } catch (err) {
    console.error("Availability API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
