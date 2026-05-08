import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

// GET — List all staff
export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const active = req.nextUrl.searchParams.get("active");
  const supabase = getServiceRoleClient();

  let query = supabase
    .from("Staff")
    .select("*, Branch(id, name, nameAr)")
    .order("createdAt", { ascending: false });

  if (active === "true") {
    query = query.eq("isActive", true);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Staff GET error:", error.message, error.details, error.hint);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST — Create new staff member
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const supabase = getServiceRoleClient();

  const { data, error } = await supabase
    .from("Staff")
    .insert({
      name: body.name,
      phone: body.phone || "",
      role: body.role || "stylist",
      avatar: body.avatar || "",
      isActive: body.isActive ?? true,
      services: body.services || [],
      branchId: body.branchId || null,
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
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (!body.id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("Staff")
    .update({
      name: body.name,
      phone: body.phone,
      role: body.role,
      avatar: body.avatar,
      isActive: body.isActive,
      services: body.services,
      branchId: body.branchId || null,
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
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const supabase = getServiceRoleClient();
  const { error } = await supabase.from("Staff").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
