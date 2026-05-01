import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET — List all orders with pagination
export async function GET(req: NextRequest) {
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20");
  const status = req.nextUrl.searchParams.get("status");
  const search = req.nextUrl.searchParams.get("search");

  let query = supabase
    .from("Order")
    .select("*", { count: "exact" })
    .order("createdAt", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (search) {
    query = query.or(`orderCode.ilike.%${search}%,customerName.ilike.%${search}%,customerPhone.ilike.%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, total: count || 0, page, limit });
}

// POST — Create a new order
export async function POST(req: NextRequest) {
  const body = await req.json();

  const { data, error } = await supabase
    .from("Order")
    .insert({
      client_id: body.client_id || null,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerAddress: body.customerAddress || "",
      items: body.items || [],
      subtotal: body.subtotal || 0,
      deliveryFee: body.deliveryFee || 0,
      total: body.total || 0,
      paymentMethod: body.paymentMethod || "cash",
      paymentStatus: body.paymentStatus || "unpaid",
      notes: body.notes || "",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Decrement stock for each item
  if (body.items && Array.isArray(body.items)) {
    for (const item of body.items) {
      if (item.productId) {
        try {
          // Decrement stock directly via update
          const { data: product } = await supabase
            .from("Product")
            .select("stock")
            .eq("id", item.productId)
            .single();

          if (product && product.stock !== null) {
            await supabase
              .from("Product")
              .update({ stock: Math.max(0, product.stock - (item.qty || 1)) })
              .eq("id", item.productId);
          }
        } catch {
          // ignore stock errors
        }
      }
    }
  }

  return NextResponse.json(data, { status: 201 });
}

// PUT — Update order status
export async function PUT(req: NextRequest) {
  const body = await req.json();

  if (!body.id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (body.status !== undefined) updates.status = body.status;
  if (body.paymentStatus !== undefined) updates.paymentStatus = body.paymentStatus;
  if (body.notes !== undefined) updates.notes = body.notes;

  const { data, error } = await supabase
    .from("Order")
    .update(updates)
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE — Delete an order
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { error } = await supabase.from("Order").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
