import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET — List all branches
export async function GET(req: NextRequest) {
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

  // If active=true, only return branches that have at least one active/available service
  if (active === "true" && data && data.length > 0) {
    const { data: activeProducts, error: prodErr } = await supabase
      .from("Product")
      .select("branchId")
      .eq("isAvailable", true)
      .eq("type", "service")
      .or("publishAt.is.null,publishAt.lte." + new Date().toISOString());

    if (!prodErr && activeProducts) {
      const activeBranchIds = new Set(
        activeProducts.map((p) => p.branchId).filter(Boolean)
      );
      const filteredBranches = data.filter((b) => activeBranchIds.has(b.id));
      return NextResponse.json(filteredBranches);
    }
  }

  return NextResponse.json(data);
}

// POST — Create new branch
export async function POST(req: NextRequest) {
  const body = await req.json();

  const { data, error } = await supabase
    .from("Branch")
    .insert({
      name: body.name,
      nameAr: body.nameAr || "",
      address: body.address || "",
      phone: body.phone || "",
      isActive: body.isActive ?? true,
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
