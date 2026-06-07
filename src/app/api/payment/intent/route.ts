import { NextRequest, NextResponse } from "next/server";
import {
  createPaymentIntention,
  isPaymobConfigured,
  type PaymobBillingData,
} from "@/lib/paymob";

/**
 * POST /api/payment/intent
 * 
 * Creates a Paymob Payment Intention and returns the Unified Checkout URL.
 * Supports both Order payments and Booking deposit payments.
 * 
 * Request body:
 * {
 *   type: "order" | "booking"
 *   id: string (Order ID or Booking ID)
 *   amount: number (amount in cents, e.g. 5000 = 50.00 SAR)
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
    const { type, id, amount, billingData } = body as {
      type: "order" | "booking";
      id: string;
      amount: number;
      billingData?: PaymobBillingData;
    };

    if (!type || !id || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Missing required fields: type, id, amount" },
        { status: 400 }
      );
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
    console.error("Paymob intent error:", err);
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    );
  }
}
