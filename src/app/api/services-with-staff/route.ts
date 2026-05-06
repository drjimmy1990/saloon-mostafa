import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase";

// GET /api/services-with-staff?branchId=xxx
// Returns services grouped by category, each with assigned staff
export async function GET(req: NextRequest) {
  try {
    const branchId = req.nextUrl.searchParams.get("branchId");
    const supabase = getServiceRoleClient();

    // 1. Get all available services for this branch
    let query = supabase
      .from("Product")
      .select("id, name, price, images, category, durationMinutes, durationMode, depositAmount, branchId")
      .eq("isAvailable", true)
      .eq("type", "service")
      .or("publishAt.is.null,publishAt.lte." + new Date().toISOString())
      .order("sortOrder", { ascending: true });

    if (branchId) {
      query = query.eq("branchId", branchId);
    }

    const { data: services, error: svcErr } = await query;
    if (svcErr) throw svcErr;

    if (!services || services.length === 0) {
      return NextResponse.json([]);
    }

    // 2. Get all staff assignments for these services
    const serviceIds = services.map((s) => s.id);
    const { data: assignments, error: assignErr } = await supabase
      .from("StaffService")
      .select("product_id, staff_id, Staff(id, name, nameAr, avatar, role, isActive, branchId)")
      .in("product_id", serviceIds);

    if (assignErr) throw assignErr;

    // 3. Build a map: productId -> staff[]
    const staffMap: Record<string, any[]> = {};
    for (const a of assignments || []) {
      const staff = (a as any).Staff;
      if (!staff || !staff.isActive) continue;
      if (branchId && staff.branchId !== branchId) continue;

      if (!staffMap[a.product_id]) staffMap[a.product_id] = [];
      staffMap[a.product_id].push({
        id: staff.id,
        name: staff.name,
        nameAr: staff.nameAr,
        avatar: staff.avatar,
        role: staff.role,
      });
    }

    // 4. Group services by category
    const categoryMap: Record<string, any[]> = {};
    for (const svc of services) {
      const cat = svc.category || "عام";
      if (!categoryMap[cat]) categoryMap[cat] = [];
      categoryMap[cat].push({
        ...svc,
        staff: staffMap[svc.id] || [],
      });
    }

    // 5. Convert to array
    const result = Object.entries(categoryMap).map(([category, services]) => ({
      category,
      image: services[0]?.images?.[0] || null,
      services,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("ServicesWithStaff API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
