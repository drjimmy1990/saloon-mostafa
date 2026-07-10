import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase";

// The cart (src/lib/cart-store.ts) sends items as { productId, name, price, qty }.
// Older callers may send { id, quantity }. Accept both; the server is authoritative
// for price, quantity validation, stock, delivery fee, and totals (H2).
type IncomingItem = {
  id?: string;
  productId?: string;
  quantity?: number;
  qty?: number;
  name?: string;
  price?: number;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerName, customerPhone, customerAddress, items, paymentMethod, notes, authUserId } = body;
    if (!customerName || !customerPhone || !items?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const supabase = getServiceRoleClient();

    // SECURITY (H2): Recompute prices server-side — never trust client totals.
    // Normalize both field shapes the client may send (productId/qty or id/quantity).
    const norm: { id: string; quantity: number; name: string }[] = [];
    for (const i of items as IncomingItem[]) {
      const id = i.id ?? i.productId;
      if (!id) {
        return NextResponse.json({ error: "Missing product id in items" }, { status: 400 });
      }
      norm.push({ id, quantity: Number(i.quantity ?? i.qty ?? 1), name: i.name ?? "" });
    }

    const productIds = norm.map((n) => n.id);
    const { data: products, error: prodErr } = await supabase
      .from("Product")
      .select("id, price, stock")
      .in("id", productIds);

    if (prodErr || !products || products.length === 0) {
      return NextResponse.json({ error: "Invalid products" }, { status: 400 });
    }

    // Build server-authoritative items + subtotal. Preserve the { productId, name, price, qty }
    // shape so downstream consumers (e.g. CRM stock decrement in saloon-mostafa) keep working.
    let computedSubtotal = 0;
    const sanitizedItems: { productId: string; name: string; price: number; qty: number }[] = [];
    for (const n of norm) {
      const dbProduct = products.find((p: { id: string }) => p.id === n.id);
      if (!dbProduct) {
        return NextResponse.json({ error: `Product ${n.id} not found` }, { status: 400 });
      }
      const q = n.quantity;
      if (!Number.isFinite(q) || !Number.isInteger(q) || q <= 0) {
        return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
      }
      const stock = dbProduct.stock == null ? null : Number(dbProduct.stock);
      if (stock != null && !Number.isNaN(stock) && q > stock) {
        return NextResponse.json(
          { error: `Quantity exceeds available stock for product ${n.id}` },
          { status: 400 }
        );
      }
      const unitPrice = Number(dbProduct.price);
      computedSubtotal += unitPrice * q;
      sanitizedItems.push({ productId: n.id, name: n.name, price: unitPrice, qty: q });
    }

    // Server-authoritative delivery fee from SystemSetting (H2: don't trust client deliveryFee).
    const { data: feeRow } = await supabase
      .from("SystemSetting")
      .select("value")
      .eq("key", "delivery_fee")
      .single();
    const safeDeliveryFee = feeRow?.value != null ? Number(feeRow.value) || 0 : 0;
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
      items: sanitizedItems, subtotal: computedSubtotal, deliveryFee: safeDeliveryFee, total: computedTotal,
      paymentMethod: paymentMethod || "cash", paymentStatus: "unpaid", status: "pending", notes: notes || "",
    }).select("id, orderCode").single();
    if (error) return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    return NextResponse.json({ success: true, orderId: order?.id, orderCode: order?.orderCode });
  } catch (err) {
    console.error("Order API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}