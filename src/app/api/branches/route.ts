import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

// GET — List all branches
export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getServiceRoleClient();
  const active = req.nextUrl.searchParams.get("active");

  let query = supabase
    .from("Branch")
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

// POST — Create new branch
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getServiceRoleClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from("Branch")
    .insert({
      name: body.name,
      nameAr: body.nameAr || "",
      address: body.address || "",
      phone: body.phone || "",
      isActive: body.isActive ?? true,
      whatsapp: body.whatsapp || "",
      email: body.email || "",
      instagramUrl: body.instagramUrl || "",
      facebookUrl: body.facebookUrl || "",
      googleMapsUrl: body.googleMapsUrl || "",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// PUT — Update branch
export async function PUT(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getServiceRoleClient();
  const body = await req.json();

  if (!body.id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("Branch")
    .update({
      name: body.name,
      nameAr: body.nameAr,
      address: body.address,
      phone: body.phone,
      isActive: body.isActive,
      whatsapp: body.whatsapp,
      email: body.email,
      instagramUrl: body.instagramUrl,
      facebookUrl: body.facebookUrl,
      googleMapsUrl: body.googleMapsUrl,
    })
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE — Delete branch
export async function DELETE(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getServiceRoleClient();
  const id = req.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { error } = await supabase.from("Branch").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
