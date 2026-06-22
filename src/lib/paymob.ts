import crypto from "crypto";

// ─── Environment ────────────────────────────────────────────────
const PAYMOB_SECRET_KEY = process.env.PAYMOB_SECRET_KEY || "";
const PAYMOB_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYMOB_PUBLIC_KEY || "";
// Supports multiple IDs comma-separated (e.g. "12345,67890" for card + Apple Pay)
const PAYMOB_INTEGRATION_IDS = (process.env.PAYMOB_INTEGRATION_ID || "")
  .split(",")
  .map(id => id.trim())
  .filter(Boolean);
const PAYMOB_HMAC_SECRET = process.env.PAYMOB_HMAC_SECRET || "";
const PAYMOB_BASE_URL = process.env.PAYMOB_BASE_URL || "https://ksa.paymob.com";
const PAYMOB_CURRENCY = process.env.PAYMOB_CURRENCY || "SAR";

// ─── Types ──────────────────────────────────────────────────────
export interface PaymobBillingData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
}

export interface CreateIntentionParams {
  /** Amount in cents (e.g. 5000 = 50.00 SAR) */
  amount: number;
  /** Your internal reference ID (e.g. "ORDER-uuid" or "BOOKING-uuid") */
  reference: string;
  billingData: PaymobBillingData;
  /** Override the default webhook URL */
  notificationUrl?: string;
  /** Override the default redirect URL */
  redirectionUrl?: string;
}

export interface IntentionResponse {
  /** Paymob intention ID */
  intentionId: string;
  /** Paymob order ID */
  orderId: number;
  /** Client secret for Unified Checkout */
  clientSecret: string;
  /** Full Unified Checkout URL ready for redirect */
  checkoutUrl: string;
}

// ─── Configuration Check ────────────────────────────────────────
export function isPaymobConfigured(): boolean {
  return !!(PAYMOB_SECRET_KEY && PAYMOB_PUBLIC_KEY && PAYMOB_INTEGRATION_IDS.length > 0 && PAYMOB_HMAC_SECRET);
}

// ─── Create Payment Intention ───────────────────────────────────
export async function createPaymentIntention(
  params: CreateIntentionParams
): Promise<IntentionResponse> {
  const { amount, reference, billingData, notificationUrl, redirectionUrl } = params;

  if (!isPaymobConfigured()) {
    throw new Error("Paymob is not configured. Check environment variables.");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: Record<string, any> = {
    amount,
    currency: PAYMOB_CURRENCY,
    payment_methods: PAYMOB_INTEGRATION_IDS.map(id => parseInt(id, 10)),
    billing_data: {
      first_name: (billingData.first_name || "NA").slice(0, 50),
      last_name: (billingData.last_name || "NA").slice(0, 50),
      email: billingData.email || "na@na.com",
      phone_number: (billingData.phone_number || "NA").replace(/[\s\-()]/g, "").slice(0, 15),
    },
    special_reference: reference,
    redirection_url: redirectionUrl || "",
  };

  if (notificationUrl) {
    body.notification_url = notificationUrl;
  }

  const res = await fetch(`${PAYMOB_BASE_URL}/v1/intention/`, {
    method: "POST",
    headers: {
      Authorization: `Token ${PAYMOB_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Paymob intention creation failed:", res.status, errorText);
    throw new Error(`Paymob API error ${res.status}: ${errorText}`);
  }

  const data = await res.json();

  const clientSecret = data.client_secret;
  const checkoutUrl = `${PAYMOB_BASE_URL}/unifiedcheckout/?publicKey=${PAYMOB_PUBLIC_KEY}&clientSecret=${clientSecret}`;

  return {
    intentionId: data.id || "",
    orderId: data.order_id || 0,
    clientSecret,
    checkoutUrl,
  };
}

// ─── Build Checkout URL from existing client secret ─────────────
export function buildCheckoutUrl(clientSecret: string): string {
  return `${PAYMOB_BASE_URL}/unifiedcheckout/?publicKey=${PAYMOB_PUBLIC_KEY}&clientSecret=${clientSecret}`;
}

// ─── HMAC SHA-512 Verification ──────────────────────────────────
/**
 * Verifies the HMAC signature of a Paymob webhook POST callback.
 * 
 * The webhook POST body has this structure:
 * {
 *   type: "TRANSACTION",
 *   obj: { ...transaction fields... },
 *   hmac: "hex_string"
 * }
 * 
 * The HMAC is calculated by concatenating 20 specific fields from `obj`
 * in a strict order, then computing SHA-512 HMAC with the HMAC secret.
 */
export function verifyHmac(
  transaction: Record<string, unknown>,
  receivedHmac: string
): boolean {
  if (!PAYMOB_HMAC_SECRET) {
    console.error("PAYMOB_HMAC_SECRET is not configured");
    return false;
  }

  const order = transaction.order as Record<string, unknown> | undefined;
  const sourceData = transaction.source_data as Record<string, unknown> | undefined;

  // Concatenate fields in the exact order specified by Paymob docs
  const concatenated = [
    transaction.amount_cents,
    transaction.created_at,
    transaction.currency,
    transaction.error_occured,
    transaction.has_parent_transaction,
    transaction.id,
    transaction.integration_id,
    transaction.is_3d_secure,
    transaction.is_auth,
    transaction.is_capture,
    transaction.is_refunded,
    transaction.is_standalone_payment,
    transaction.is_voided,
    order?.id,
    transaction.owner,
    transaction.pending,
    sourceData?.pan,
    sourceData?.sub_type,
    sourceData?.type,
    transaction.success,
  ].join("");

  const calculatedHmac = crypto
    .createHmac("sha512", PAYMOB_HMAC_SECRET)
    .update(concatenated)
    .digest("hex");

  return calculatedHmac === receivedHmac;
}

// ─── Parse Reference ────────────────────────────────────────────
/**
 * Parses the special_reference / merchant_order_id to determine payment type.
 * Returns { type: "order" | "booking", id: string } or null.
 */
export function parsePaymentReference(reference: string): { type: "order" | "booking"; id: string } | null {
  if (!reference) return null;

  if (reference.startsWith("ORDER-")) {
    return { type: "order", id: reference.slice(6) };
  }
  if (reference.startsWith("BOOKING-")) {
    return { type: "booking", id: reference.slice(8) };
  }

  // Fallback: treat as order ID (backward compatibility with old system)
  return { type: "order", id: reference };
}
