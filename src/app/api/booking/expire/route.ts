import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase";

/**
 * GET /api/booking/expire
 * 
 * Cron-triggered endpoint to handle booking expirations:
 * 1. waiting_payment bookings past paymentExpiresAt → revert to "pending" (release slot)
 * 2. pending bookings older than 24 hours → set to "cancelled"
 * 
 * Should be called every 2 minutes by a cron job (n8n or external).
 * 
 * Optional: Pass ?key=SECRET for basic auth protection.
 */
export async function GET(req: NextRequest) {
  try {
    // Optional simple auth
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    const expectedKey = process.env.CRON_SECRET || "";
    if (expectedKey && key !== expectedKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getServiceRoleClient();
    const now = new Date().toISOString();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // ─── 1. Expire waiting_payment bookings (10-min hold expired) ───
    // Cancel them (not "pending") so the slot is fully released and
    // the unpaid booking doesn't show up as an active booking.
    const { data: expiredPayments, error: err1 } = await supabase
      .from("Booking")
      .update({ status: "cancelled", paymentExpiresAt: null })
      .eq("status", "waiting_payment")
      .lt("paymentExpiresAt", now)
      .select("id, bookingCode");

    if (err1) {
      console.error("Failed to expire waiting_payment bookings:", err1);
    }

    const expiredPaymentCount = expiredPayments?.length || 0;
    if (expiredPaymentCount > 0) {
      console.log(
        `⏰ Cancelled ${expiredPaymentCount} unpaid waiting_payment bookings:`,
        expiredPayments?.map((b) => b.bookingCode).join(", ")
      );
    }

    // ─── 2. Cancel pending bookings older than 24 hours ─────────────
    const { data: cancelledBookings, error: err2 } = await supabase
      .from("Booking")
      .update({ status: "cancelled" })
      .eq("status", "pending")
      .lt("createdAt", twentyFourHoursAgo)
      .select("id, bookingCode");

    if (err2) {
      console.error("Failed to cancel old pending bookings:", err2);
    }

    const cancelledCount = cancelledBookings?.length || 0;
    if (cancelledCount > 0) {
      console.log(
        `🗑️ Cancelled ${cancelledCount} pending bookings (24h expired):`,
        cancelledBookings?.map((b) => b.bookingCode).join(", ")
      );
    }

    return NextResponse.json({
      success: true,
      expiredPayments: expiredPaymentCount,
      cancelledPending: cancelledCount,
      processedAt: now,
    });
  } catch (err) {
    console.error("Booking expire cron error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
