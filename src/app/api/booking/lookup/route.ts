import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase";
import { getPhoneVariants, normalizePhone } from "@/lib/phone";

/**
 * GET /api/booking/lookup?phone=05XXXXXXXX
 * 
 * Lookup customer bookings by phone number.
 * Used by the WhatsApp bot tool: check_my_bookings
 * Uses multi-variant phone search so numbers with/without +, with 05 or 966,
 * or leading spaces will always match.
 * Returns active bookings (not cancelled) sorted by date descending.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawPhone = searchParams.get("phone");

    if (!rawPhone) {
      return NextResponse.json(
        { error: "phone parameter is required" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();
    const normalized = normalizePhone(rawPhone);
    const last9 = normalized.length >= 9 ? normalized.slice(-9) : normalized;

    // Find all clients matching this phone across any format (+966, 966, 05, spaces, whatsapp JID)
    const { data: clients, error: clientErr } = await supabase
      .from("Client")
      .select("id, name, phone, platform_user_id")
      .or(`phone.ilike.%${last9}%,platform_user_id.ilike.%${last9}%`);

    if (clientErr) {
      console.error("Error finding client by phone:", clientErr);
    }

    const allClients = clients || [];

    if (allClients.length === 0) {
      return NextResponse.json({
        found: false,
        message: "لا يوجد حجوزات لهذا الرقم",
        bookings: [],
      });
    }

    const clientIds = allClients.map((c) => c.id);
    const primaryClientName = allClients.find((c) => c.name?.trim())?.name?.trim() || "عميلتنا العزيزة";

    // Get active bookings for any of the matched client IDs
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
      .in("client_id", clientIds)
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
      customerName: primaryClientName,
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
