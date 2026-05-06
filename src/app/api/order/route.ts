import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerName, customerPhone, customerAddress, items, subtotal, deliveryFee, total, paymentMethod, notes, authUserId } = body;
    if (!customerName || !customerPhone || !items?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const supabase = getServiceRoleClient();
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
      items, subtotal: subtotal || 0, deliveryFee: deliveryFee || 0, total: total || 0,
      paymentMethod: paymentMethod || "cash", paymentStatus: "unpaid", status: "pending", notes: notes || "",
    }).select("id, orderCode").single();
    if (error) return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    return NextResponse.json({ success: true, orderId: order?.id, orderCode: order?.orderCode });
  } catch (err) {
    console.error("Order API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
