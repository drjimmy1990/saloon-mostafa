import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    const apiKey = process.env.PAYMOB_API_KEY;
    const integrationId = process.env.PAYMOB_INTEGRATION_ID;
    const iframeId = process.env.PAYMOB_IFRAME_ID;
    if (!apiKey || !integrationId || !iframeId) {
      return NextResponse.json({ error: "Paymob not configured" }, { status: 503 });
    }
    // Step 1: Auth
    const authRes = await fetch("https://jordan.paymob.com/api/auth/tokens", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey }),
    });
    const { token } = await authRes.json();
    // Step 2: Register order
    const orderRes = await fetch("https://jordan.paymob.com/api/ecommerce/orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auth_token: token, delivery_needed: "false", amount_cents: "0", merchant_order_id: orderId, items: [] }),
    });
    const orderData = await orderRes.json();
    // Step 3: Payment key
    const keyRes = await fetch("https://jordan.paymob.com/api/acceptance/payment_keys", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: token, amount_cents: "0", expiration: 3600, order_id: orderData.id,
        billing_data: { first_name: "NA", last_name: "NA", email: "NA", phone_number: "NA", apartment: "NA", floor: "NA", street: "NA", building: "NA", shipping_method: "NA", postal_code: "NA", city: "NA", country: "JO", state: "NA" },
        currency: "JOD", integration_id: parseInt(integrationId),
      }),
    });
    const { token: paymentKey } = await keyRes.json();
    return NextResponse.json({ iframeUrl: `https://jordan.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentKey}` });
  } catch (err) {
    console.error("Paymob intent error:", err);
    return NextResponse.json({ error: "Payment failed" }, { status: 500 });
  }
}
