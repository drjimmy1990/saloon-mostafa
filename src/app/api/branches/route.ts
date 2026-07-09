import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET — List all branches
export async function GET(req: NextRequest) {
  const active = req.nextUrl.searchParams.get("active");

  let query = supabase
    .from("Branch")
    .select("id,name,nameAr,address,isActive,createdAt")
    .order("createdAt", { ascending: false });

  if (active === "true") {
    query = query.eq("isActive", true);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Branches fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch branches" }, { status: 500 });
  }

  // If active=true, only return branches that have at least one active/available service
  if (active === "true" && data && data.length > 0) {
    const { data: activeProducts, error: prodErr } = await supabase
      .from("Product")
      .select("branchId")
      .eq("isAvailable", true)
      .eq("type", "service");

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
  const guard = await requireAdmin(req);
  if (guard instanceof NextResponse) return guard;

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
    console.error("Branch create error:", error);
    return NextResponse.json({ error: "Failed to create branch" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// PUT — Update branch
export async function PUT(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard instanceof NextResponse) return guard;

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
    console.error("Branch update error:", error);
    return NextResponse.json({ error: "Failed to update branch" }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE — Delete branch
export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard instanceof NextResponse) return guard;

  const id = req.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { error } = await supabase.from("Branch").delete().eq("id", id);

  if (error) {
    console.error("Branch delete error:", error);
    return NextResponse.json({ error: "Failed to delete branch" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
