import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase";
import { createClient } from "@/utils/supabase/server";

// GET /api/account — get customer's bookings and orders
export async function GET(req: NextRequest) {
  try {
    // Verify auth from session cookie — never trust client-supplied ID
    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const authUserId = user.id;
    const supabase = getServiceRoleClient();

    // 1. Find client by auth_user_id
    const { data: client } = await supabase
      .from("Client")
      .select("id, name, phone, email, address")
      .eq("auth_user_id", authUserId)
      .single();

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // 2. Get bookings
    const { data: bookings } = await supabase
      .from("Booking")
      .select("id, serviceSummary, bookingDate, status, createdAt")
      .eq("client_id", client.id)
      .order("createdAt", { ascending: false })
      .limit(20);

    // 3. Get orders
    const { data: orders } = await supabase
      .from("Order")
      .select("id, orderCode, items, total, status, paymentStatus, createdAt")
      .eq("client_id", client.id)
      .order("createdAt", { ascending: false })
      .limit(20);

    return NextResponse.json({
      client,
      bookings: bookings || [],
      orders: orders || [],
    });
  } catch (err) {
    console.error("Account API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/account — update customer profile
export async function PUT(req: NextRequest) {
  try {
    // Verify auth from session cookie
    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const authUserId = user.id;
    const body = await req.json();
    const { name, phone, address } = body;

    const supabase = getServiceRoleClient();

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;

    const { data, error } = await supabase
      .from("Client")
      .update(updateData)
      .eq("auth_user_id", authUserId)
      .select("id, name, phone, email, address")
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    return NextResponse.json({ client: data });
  } catch (err) {
    console.error("Account update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
