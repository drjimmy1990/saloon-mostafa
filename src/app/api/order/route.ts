import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerName, customerPhone, customerAddress, items, deliveryFee, paymentMethod, notes, authUserId } = body;
    if (!customerName || !customerPhone || !items?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const supabase = getServiceRoleClient();

    // SECURITY: Recompute prices server-side — never trust client totals
    const productIds = items.map((i: { id: string }) => i.id);
    const { data: products, error: prodErr } = await supabase
      .from("Product")
      .select("id, price")
      .in("id", productIds);

    if (prodErr || !products || products.length === 0) {
      return NextResponse.json({ error: "Invalid products" }, { status: 400 });
    }

    let computedSubtotal = 0;
    for (const item of items) {
      const dbProduct = products.find((p: { id: string }) => p.id === item.id);
      if (!dbProduct) {
        return NextResponse.json({ error: `Product ${item.id} not found` }, { status: 400 });
      }
      computedSubtotal += Number(dbProduct.price) * (Number(item.quantity) || 1);
    }
    const safeDeliveryFee = Number(deliveryFee) || 0;
    const computedTotal = computedSubtotal + safeDeliveryFee;

    let clientId: string | null = null;

    // Prefer auth_user_id lookup for logged-in customers
    if (authUserId) {
      const { data: authClient } = await supabase.from("Client").select("id").eq("auth_user_id", authUserId).single();
      if (authClient) clientId = authClient.id;
    }

    if (!clientId) {
      const { data: existing } = await supabase.from("Client").select("id").eq("phone", customerPhone).single();
      if (existing) { clientId = existing.id; }
      else {
        const { data: nc } = await supabase.from("Client").insert({ name: customerName, phone: customerPhone, platform: "website", auth_user_id: authUserId || null }).select("id").single();
        clientId = nc?.id || null;
      }
    }
    const { data: order, error } = await supabase.from("Order").insert({
      client_id: clientId, customerName, customerPhone, customerAddress: customerAddress || "",
      items, subtotal: computedSubtotal, deliveryFee: safeDeliveryFee, total: computedTotal,
      paymentMethod: paymentMethod || "cash", paymentStatus: "unpaid", status: "pending", notes: notes || "",
    }).select("id, orderCode").single();
    if (error) return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    return NextResponse.json({ success: true, orderId: order?.id, orderCode: order?.orderCode });
  } catch (err) {
    console.error("Order API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
