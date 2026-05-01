import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET — List all offers with product name
export async function GET() {
  const { data, error } = await supabase
    .from("Offer")
    .select(`*, product:Product(id, name, price)`)
    .order("createdAt", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST — Create a new offer
export async function POST(req: NextRequest) {
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
