import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase";

// GET /api/availability?staffId=xxx&serviceId=xxx&date=2026-05-10
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get("staffId");
    const serviceId = searchParams.get("serviceId");
    const date = searchParams.get("date"); // YYYY-MM-DD

    if (!staffId || !serviceId || !date) {
      return NextResponse.json(
        { error: "staffId, serviceId, and date are required" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // 1. Get service details (duration, mode)
    const { data: service, error: svcErr } = await supabase
      .from("Product")
      .select("id, name, durationMinutes, durationMode, depositAmount")
      .eq("id", serviceId)
      .single();

    if (svcErr || !service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // If queue mode, just return the next queue number
    if (service.durationMode === "queue") {
      // Check blocked dates for queue mode too
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
      });
    }

    // 2. Check if staff has a blocked date (emergency leave)
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
        staffSchedule: schedule || null,
        serviceDuration: service.durationMinutes,
        depositAmount: service.depositAmount || 0,
        message: "Staff is off on this day",
      });
    }

    // 3. Get ALL confirmed/pending bookings for this staff on this date
    //    Use text-based date comparison to avoid timezone issues
    const { data: bookings } = await supabase
      .from("Booking")
      .select("bookingDate, endTime, serviceId")
      .eq("staff_id", staffId)
      .neq("status", "cancelled");

    // 4. Generate available time slots
    const duration = service.durationMinutes || 30;
    const [startH, startM] = effectiveSchedule.startTime.split(":").map(Number);
    const [endH, endM] = effectiveSchedule.endTime.split(":").map(Number);
    const scheduleStart = startH * 60 + (startM || 0);
    const scheduleEnd = endH * 60 + (endM || 0);

    // Parse existing bookings into minute ranges — only for the requested date
    const bookedRanges: Array<{ start: number; end: number }> = [];
    if (bookings) {
      for (const b of bookings) {
        if (!b.bookingDate) continue;

        // Extract the date part from bookingDate for comparison
        const bDateStr = b.bookingDate.substring(0, 10); // "YYYY-MM-DD"
        if (bDateStr !== date) continue; // Skip bookings on other dates

        // Parse the time from the booking
        const bDateObj = new Date(b.bookingDate);
        const bStart = bDateObj.getUTCHours() * 60 + bDateObj.getUTCMinutes();
        let bEnd: number;
        if (b.endTime) {
          const eDateObj = new Date(b.endTime);
          bEnd = eDateObj.getUTCHours() * 60 + eDateObj.getUTCMinutes();
        } else {
          bEnd = bStart + duration; // fallback
        }

        // Handle edge case where end time is 0 (midnight wrap) 
        if (bEnd <= bStart) bEnd = bStart + duration;

        bookedRanges.push({ start: bStart, end: bEnd });
      }
    }

    console.log(`[availability] date=${date} staff=${staffId} bookedRanges:`, bookedRanges);

    // Generate slots at intervals matching service duration
    const interval = duration;
    const slots: Array<{ time: string; booked: boolean }> = [];
    for (let t = scheduleStart; t + duration <= scheduleEnd; t += interval) {
      const slotEnd = t + duration;

      // Check for overlap with any existing booking
      const hasOverlap = bookedRanges.some(
        (range) => t < range.end && slotEnd > range.start
      );

      const h = Math.floor(t / 60);
      const m = t % 60;
      slots.push({
        time: `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`,
        booked: hasOverlap,
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
    });
  } catch (err) {
    console.error("Availability API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
