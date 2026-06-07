import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase";
import { verifyHmac, parsePaymentReference } from "@/lib/paymob";

/**
 * POST /api/payment/webhook
 * 
 * Handles Paymob's Transaction Processed Callback (POST webhook).
 * 
 * Webhook POST body structure:
 * {
 *   type: "TRANSACTION",
 *   obj: { ...transaction fields... },
 *   hmac: "hex_string"
 * }
 * 
 * Routes successful payments to either:
 * - Order table (paymentStatus → 'paid') for ORDER-{id} references
 * - Booking table (depositStatus → 'paid') for BOOKING-{id} references
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // POST webhooks nest transaction data inside body.obj
    const transaction = body.obj;
    if (!transaction) {
      console.warn("Paymob webhook: missing obj in payload");
      return NextResponse.json(
        { error: "Invalid payload structure" },
        { status: 400 }
      );
    }

    // ─── Step 1: Verify HMAC signature ──────────────────────────
    const receivedHmac = body.hmac;
    if (!receivedHmac || !verifyHmac(transaction, receivedHmac)) {
      console.warn("Paymob webhook: HMAC verification failed", {
        transactionId: transaction.id,
        orderId: transaction.order?.id,
      });
      return NextResponse.json(
        { error: "Invalid HMAC signature" },
        { status: 403 }
      );
    }

    // ─── Step 2: Log for audit ──────────────────────────────────
    const merchantOrderId = transaction.order?.merchant_order_id as string;
    const paymobTxnId = transaction.id;
    const success = transaction.success === true || transaction.success === "true";

    console.log(`Paymob webhook received: txn=${paymobTxnId}, ref=${merchantOrderId}, success=${success}`);

    // ─── Step 3: Process successful payment ─────────────────────
    if (success && merchantOrderId) {
      const parsed = parsePaymentReference(merchantOrderId);
      if (!parsed) {
        console.warn(`Paymob webhook: unrecognized reference format: ${merchantOrderId}`);
        return NextResponse.json({ success: true });
      }

      const supabase = getServiceRoleClient();

      if (parsed.type === "order") {
        // ── Order Payment ───────────────────────────────────────
        // Idempotency: skip if already paid
        const { data: existing } = await supabase
          .from("Order")
          .select("paymentStatus")
          .eq("id", parsed.id)
          .single();

        if (existing?.paymentStatus === "paid") {
          console.log(`Order ${parsed.id} already marked as paid, skipping`);
          return NextResponse.json({ success: true });
        }

        const { error } = await supabase
          .from("Order")
          .update({ paymentStatus: "paid" })
          .eq("id", parsed.id);

        if (error) {
          console.error(`Failed to update Order ${parsed.id}:`, error);
          return NextResponse.json(
            { error: "Database update failed" },
            { status: 500 }
          );
        }

        console.log(`✅ Order ${parsed.id} marked as PAID (Paymob txn: ${paymobTxnId})`);
      } else if (parsed.type === "booking") {
        // ── Booking Deposit ─────────────────────────────────────
        // Idempotency: skip if already paid
        const { data: existing } = await supabase
          .from("Booking")
          .select("depositStatus")
          .eq("id", parsed.id)
          .single();

        if (existing?.depositStatus === "paid") {
          console.log(`Booking ${parsed.id} deposit already paid, skipping`);
          return NextResponse.json({ success: true });
        }

        const { error } = await supabase
          .from("Booking")
          .update({ depositStatus: "paid" })
          .eq("id", parsed.id);

        if (error) {
          console.error(`Failed to update Booking ${parsed.id}:`, error);
          return NextResponse.json(
            { error: "Database update failed" },
            { status: 500 }
          );
        }

        console.log(`✅ Booking ${parsed.id} deposit marked as PAID (Paymob txn: ${paymobTxnId})`);
      }
    } else if (!success) {
      console.log(`Paymob webhook: payment failed for ref=${merchantOrderId}, txn=${paymobTxnId}`);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Paymob webhook processing error:", err);
    return NextResponse.json(
      { error: "Webhook processing error" },
      { status: 500 }
    );
  }
}
