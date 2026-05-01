import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET — List all staff
export async function GET(req: NextRequest) {
  const active = req.nextUrl.searchParams.get("active");

  let query = supabase
    .from("Staff")
    .select("*")
    .order("createdAt", { ascending: false });

  if (active === "true") {
    query = query.eq("isActive", true);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST — Create new staff member
export async function POST(req: NextRequest) {
  const body = await req.json();

  const { data, error } = await supabase
    .from("Staff")
    .insert({
      name: body.name,
      phone: body.phone || "",
      role: body.role || "stylist",
      avatar: body.avatar || "",
      isActive: body.isActive ?? true,
      services: body.services || [],
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// PUT — Update staff member
export async function PUT(req: NextRequest) {
  const body = await req.json();

  if (!body.id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("Staff")
    .update({
      name: body.name,
      phone: body.phone,
      role: body.role,
      avatar: body.avatar,
      isActive: body.isActive,
      services: body.services,
    })
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE — Delete staff member
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { error } = await supabase.from("Staff").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
