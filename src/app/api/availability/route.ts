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

    // 2. Get staff schedule for this day of week
    const dateObj = new Date(date + "T00:00:00");
    const dayOfWeek = dateObj.getDay(); // 0=Sunday, 6=Saturday

    const { data: schedule } = await supabase
      .from("StaffSchedule")
      .select("startTime, endTime, isOff")
      .eq("staff_id", staffId)
      .eq("dayOfWeek", dayOfWeek)
      .single();

    if (!schedule || schedule.isOff) {
      return NextResponse.json({
        mode: "time",
        slots: [],
        staffSchedule: schedule || null,
        serviceDuration: service.durationMinutes,
        depositAmount: service.depositAmount || 0,
        message: "Staff is off on this day",
      });
    }

    // 3. Get all confirmed/pending bookings for this staff on this date
    const { data: bookings } = await supabase
      .from("Booking")
      .select("bookingDate, endTime")
      .eq("staff_id", staffId)
      .gte("bookingDate", `${date}T00:00:00`)
      .lt("bookingDate", `${date}T23:59:59`)
      .neq("status", "cancelled");

    // 4. Generate available time slots
    const duration = service.durationMinutes || 30;
    const [startH, startM] = schedule.startTime.split(":").map(Number);
    const [endH, endM] = schedule.endTime.split(":").map(Number);
    const scheduleStart = startH * 60 + (startM || 0);
    const scheduleEnd = endH * 60 + (endM || 0);

    // Parse existing bookings into minute ranges
    const bookedRanges: Array<{ start: number; end: number }> = [];
    if (bookings) {
      for (const b of bookings) {
        if (!b.bookingDate) continue;
        const bDate = new Date(b.bookingDate);
        const bStart = bDate.getHours() * 60 + bDate.getMinutes();
        let bEnd: number;
        if (b.endTime) {
          const eDate = new Date(b.endTime);
          bEnd = eDate.getHours() * 60 + eDate.getMinutes();
        } else {
          bEnd = bStart + duration; // fallback
        }
        bookedRanges.push({ start: bStart, end: bEnd });
      }
    }

    // Generate 15-minute interval slots
    const slots: string[] = [];
    for (let t = scheduleStart; t + duration <= scheduleEnd; t += 15) {
      const slotEnd = t + duration;

      // Check for overlap with any existing booking
      const hasOverlap = bookedRanges.some(
        (range) => t < range.end && slotEnd > range.start
      );

      if (!hasOverlap) {
        const h = Math.floor(t / 60);
        const m = t % 60;
        slots.push(
          `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
        );
      }
    }

    return NextResponse.json({
      mode: "time",
      slots,
      staffSchedule: {
        startTime: schedule.startTime,
        endTime: schedule.endTime,
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
