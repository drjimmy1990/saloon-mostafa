import { NextRequest, NextResponse } from "next/server";
import {
  createPaymentIntention,
  isPaymobConfigured,
  type PaymobBillingData,
} from "@/lib/paymob";
import { getServiceRoleClient } from "@/lib/supabase";

/**
 * POST /api/payment/intent
 * 
 * Creates a Paymob Payment Intention and returns the Unified Checkout URL.
 * Supports both Order payments and Booking deposit payments.
 * 
 * SECURITY: Amount is ALWAYS loaded from DB — never from client.
 * 
 * Request body:
 * {
 *   type: "order" | "booking"
 *   id: string (Order ID or Booking ID)
 *   billingData: { first_name, last_name, email, phone_number }
 * }
 */
export async function POST(req: NextRequest) {
  try {
    if (!isPaymobConfigured()) {
      return NextResponse.json(
        { error: "Paymob is not configured" },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { type, id, billingData } = body as {
      type: "order" | "booking";
      id: string;
      billingData?: PaymobBillingData;
    };

    if (!type || !id) {
      return NextResponse.json(
        { error: "Missing required fields: type, id" },
        { status: 400 }
      );
    }

    // SECURITY: Load amount from DB — never trust client
    const supabase = getServiceRoleClient();
    let amount: number;

    if (type === "order") {
      const { data: order, error } = await supabase
        .from("Order")
        .select("total")
        .eq("id", id)
        .single();
      if (error || !order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      amount = Math.round(Number(order.total) * 100); // Convert to cents
    } else {
      const { data: booking, error } = await supabase
        .from("Booking")
        .select("depositAmount")
        .eq("id", id)
        .single();
      if (error || !booking) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }
      amount = Math.round(Number(booking.depositAmount) * 100); // Convert to cents
    }

    if (amount <= 0) {
      return NextResponse.json({ error: "No amount due" }, { status: 400 });
    }

    // Build reference prefix for webhook routing
    const reference = type === "booking" ? `BOOKING-${id}` : `ORDER-${id}`;

    // Build redirect URLs based on payment type
    const origin = req.headers.get("origin") || req.headers.get("referer")?.replace(/\/[^/]*$/, "") || "";
    const redirectionUrl =
      type === "booking"
        ? `${origin}/booking/success`
        : `${origin}/checkout/success`;
    const notificationUrl = `${origin}/api/payment/webhook`;

    const result = await createPaymentIntention({
      amount,
      reference,
      billingData: billingData || {
        first_name: "NA",
        last_name: "NA",
        email: "na@na.com",
        phone_number: "NA",
      },
      notificationUrl,
      redirectionUrl,
    });

    return NextResponse.json({
      checkoutUrl: result.checkoutUrl,
      intentionId: result.intentionId,
      paymobOrderId: result.orderId,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("Paymob intent error:", errMsg, err);
    return NextResponse.json(
      { error: `Failed to create payment intent: ${errMsg}` },
      { status: 500 }
    );
  }
}
