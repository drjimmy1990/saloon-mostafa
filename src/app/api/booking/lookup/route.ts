import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase";

/**
 * GET /api/booking/lookup?phone=05XXXXXXXX
 * 
 * Lookup customer bookings by phone number.
 * Used by the WhatsApp bot tool: check_my_bookings
 * Returns active bookings (not cancelled) sorted by date descending.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");

    if (!phone) {
      return NextResponse.json(
        { error: "phone parameter is required" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // Find client by phone
    const { data: client } = await supabase
      .from("Client")
      .select("id, name, phone")
      .eq("phone", phone)
      .single();

    if (!client) {
      return NextResponse.json({
        found: false,
        message: "لا يوجد حجوزات لهذا الرقم",
        bookings: [],
      });
    }

    // Get active bookings for this client
    const { data: bookings, error } = await supabase
      .from("Booking")
      .select(`
        id,
        bookingCode,
        serviceSummary,
        bookingDate,
        endTime,
        status,
        depositStatus,
        depositAmount,
        queueNumber,
        staff:staff_id (id, name),
        branchId
      `)
      .eq("client_id", client.id)
      .neq("status", "cancelled")
      .order("bookingDate", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Booking lookup error:", error);
      return NextResponse.json(
        { error: "Failed to lookup bookings" },
        { status: 500 }
      );
    }

    // Format bookings for the bot
    const formattedBookings = (bookings || []).map((b) => {
      const dateStr = b.bookingDate ? b.bookingDate.substring(0, 10) : "";
      let timeStr = "";
      if (b.bookingDate) {
        const d = new Date(b.bookingDate);
        const h = d.getUTCHours();
        const m = d.getUTCMinutes();
        if (h > 0 || m > 0) {
          timeStr = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
        }
      }

      const statusLabels: Record<string, string> = {
        pending: "قيد الانتظار",
        waiting_payment: "بانتظار الدفع",
        confirmed: "مؤكد",
        completed: "مكتمل",
      };

      return {
        bookingCode: b.bookingCode || "N/A",
        service: b.serviceSummary || "",
        date: dateStr,
        time: timeStr,
        status: b.status,
        statusAr: statusLabels[b.status] || b.status,
        staffName: (b.staff as { name?: string })?.name || "",
        depositAmount: b.depositAmount || 0,
        depositStatus: b.depositStatus || "unpaid",
        queueNumber: b.queueNumber || null,
      };
    });

    return NextResponse.json({
      found: true,
      customerName: client.name,
      bookings: formattedBookings,
    });
  } catch (err) {
    console.error("Booking lookup error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
