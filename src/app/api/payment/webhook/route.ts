import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const hmacSecret = process.env.PAYMOB_HMAC_SECRET;
    if (!hmacSecret) return NextResponse.json({ error: "HMAC not configured" }, { status: 503 });
    // Verify HMAC
    const concatenated = [
      body.amount_cents, body.created_at, body.currency, body.error_occured,
      body.has_parent_transaction, body.id, body.integration_id, body.is_3d_secure,
      body.is_auth, body.is_capture, body.is_refunded, body.is_standalone_payment,
      body.is_voided, body.order?.id, body.owner, body.pending,
      body.source_data?.pan, body.source_data?.sub_type, body.source_data?.type, body.success,
    ].join("");
    const hash = crypto.createHmac("sha512", hmacSecret).update(concatenated).digest("hex");
    if (hash !== body.hmac) return NextResponse.json({ error: "Invalid HMAC" }, { status: 403 });
    // Update order payment status
    if (body.success === true || body.success === "true") {
      const supabase = getServiceRoleClient();
      const merchantOrderId = body.order?.merchant_order_id;
      if (merchantOrderId) {
        await supabase.from("Order").update({ paymentStatus: "paid" }).eq("id", merchantOrderId);
      }
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Paymob webhook error:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
