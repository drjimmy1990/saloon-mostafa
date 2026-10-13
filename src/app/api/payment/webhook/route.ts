import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase";
import { verifyHmac, parsePaymentReference } from "@/lib/paymob";
import { dispatchBookingWebhook } from "@/lib/booking-webhook";

/**
 * POST /api/payment/webhook
 * 
 * Handles Paymob's Transaction Processed Callback (POST webhook).
 * This handles WEBSITE payments only (orders + direct website bookings).
 * Bot booking payments are handled by the n8n payment webhook workflow.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Direct webhook dispatch support (e.g. triggered by n8n saloon-payment after DB confirmation)
    if (body.bookingId && !body.obj && !body.body?.obj) {
      const bookingId = String(body.bookingId).trim();
      const source = body.source || "website_paymob";
      const result = await dispatchBookingWebhook({ bookingId, source });
      return NextResponse.json({ success: result.success, webhookResult: result });
    }

    // POST webhooks nest transaction data inside body.obj (or body.body.obj if forwarded from n8n)
    const payloadRoot = body.obj ? body : (body.body || body);
    const transaction = payloadRoot.obj;
    if (!transaction) {
      console.warn("Paymob webhook: missing obj in payload");
      return NextResponse.json(
        { error: "Invalid payload structure" },
        { status: 400 }
      );
    }

    // ─── Step 1: Verify HMAC signature ──────────────────────────
    // Paymob sends hmac in the URL query string (?hmac=...), or in body.hmac / body.query.hmac
    const receivedHmac =
      req.nextUrl.searchParams.get("hmac") ||
      payloadRoot.hmac ||
      body.hmac ||
      body.query?.hmac;
    if (!receivedHmac || !verifyHmac(transaction, receivedHmac)) {
      console.warn("Paymob webhook: HMAC verification failed", {
        transactionId: transaction.id,
        orderId: transaction.order?.id,
        hasHmac: Boolean(receivedHmac),
      });
      return NextResponse.json(
        { error: "Invalid HMAC signature" },
        { status: 403 }
      );
    }

    // ─── Step 2: Log for audit ──────────────────────────────────
    const merchantOrderId = (
      transaction.order?.merchant_order_id ||
      transaction.special_reference ||
      transaction.payment_key_claims?.extra?.merchant_order_id ||
      ""
    ) as string;
    const paymobTxnId = transaction.id;
    const success = transaction.success === true || transaction.success === "true";
    const amountCents = Number(transaction.amount_cents || 0);
    const paidAmountSar = Math.round(amountCents / 100);

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
        // ── Booking Deposit (website flow & group bookings) ───────
        const { data: existing } = await supabase
          .from("Booking")
          .select("id, depositStatus, status, paymobIntentionId, depositAmount")
          .eq("id", parsed.id)
          .single();

        const alreadyPaid = existing?.depositStatus === "paid" && existing?.status === "confirmed";

        if (!alreadyPaid) {
          // If part of a group booking sharing the same paymobIntentionId, confirm ALL of them
          const updateFields: Record<string, any> = {
            depositStatus: "paid",
            status: "confirmed",
            paymentMethod: "online",
            paymobTxnId: String(paymobTxnId),
          };
          if (!existing?.depositAmount && paidAmountSar > 0) {
            updateFields.depositAmount = paidAmountSar;
          }

          let updateQuery = supabase
            .from("Booking")
            .update(updateFields);

          if (existing?.paymobIntentionId) {
            updateQuery = updateQuery.eq("paymobIntentionId", existing.paymobIntentionId);
          } else {
            updateQuery = updateQuery.eq("id", parsed.id);
          }

          const { error } = await updateQuery;

          if (error) {
            console.error(`Failed to update Booking(s) for ${parsed.id}:`, error);
            return NextResponse.json(
              { error: "Database update failed" },
              { status: 500 }
            );
          }

          console.log(`✅ Booking(s) marked as PAID & CONFIRMED (Paymob txn: ${paymobTxnId})`);
        } else if (!body.forceWebhook) {
          console.log(`Booking ${parsed.id} deposit already paid, skipping DB update`);
          return NextResponse.json({ success: true });
        }

        // Dispatch booking webhook(s) to n8n (awaited so serverless runtime completes delivery)
        try {
          if (existing?.paymobIntentionId) {
            const { data: groupBookings } = await supabase
              .from("Booking")
              .select("id")
              .eq("paymobIntentionId", existing.paymobIntentionId);

            if (groupBookings && groupBookings.length > 0) {
              for (const gb of groupBookings) {
                await dispatchBookingWebhook({ bookingId: gb.id, source: "website_paymob" })
                  .catch((e: any) => console.error("[Paymob Webhook] Webhook error:", e));
              }
            } else {
              await dispatchBookingWebhook({ bookingId: parsed.id, source: "website_paymob" })
                .catch((e: any) => console.error("[Paymob Webhook] Webhook error:", e));
            }
          } else {
            await dispatchBookingWebhook({ bookingId: parsed.id, source: "website_paymob" })
              .catch((e: any) => console.error("[Paymob Webhook] Webhook error:", e));
          }
        } catch (webhookDispatchErr) {
          console.error("[Paymob Webhook] Error initiating webhook dispatch:", webhookDispatchErr);
        }
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
