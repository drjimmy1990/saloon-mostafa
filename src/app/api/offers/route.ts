import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

// GET — List all offers with product name, optionally filtered by channel
export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const channel = req.nextUrl.searchParams.get('channel');
  const supabase = getServiceRoleClient();

  let query = supabase
    .from("Offer")
    .select(`*, product:Product(id, name, price)`)
    .order("createdAt", { ascending: false });

  if (channel === 'bot') {
    query = query.in('channel', ['bot', 'both']);
  } else if (channel === 'website') {
    query = query.in('channel', ['website', 'both']);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST — Create a new offer
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getServiceRoleClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from("Offer")
    .insert({
      product_id: body.product_id,
      discountType: body.discountType,
      discountValue: body.discountValue,
      startDate: body.startDate || null,
      endDate: body.endDate || null,
      isActive: body.isActive ?? true,
      channel: body.channel || 'website',
    })
    .select(`*, product:Product(id, name, price)`)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// PUT — Update an offer
export async function PUT(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getServiceRoleClient();
  const body = await req.json();

  if (!body.id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("Offer")
    .update({
      product_id: body.product_id,
      discountType: body.discountType,
      discountValue: body.discountValue,
      startDate: body.startDate || null,
      endDate: body.endDate || null,
      isActive: body.isActive,
      channel: body.channel,
    })
    .eq("id", body.id)
    .select(`*, product:Product(id, name, price)`)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE — Delete an offer
export async function DELETE(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getServiceRoleClient();
  const id = req.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { error } = await supabase.from("Offer").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
