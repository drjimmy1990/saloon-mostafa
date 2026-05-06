import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase";

// GET /api/services-with-staff?branchId=xxx
// Returns services grouped by category, each with assigned staff
export async function GET(req: NextRequest) {
  try {
    const branchId = req.nextUrl.searchParams.get("branchId");
    const supabase = getServiceRoleClient();

    // 1. Get all available services for this branch
    let svcQuery = supabase
      .from("Product")
      .select("id, name, price, images, category, durationMinutes, durationMode, depositAmount, branchId")
      .eq("isAvailable", true)
      .eq("type", "service")
      .or("publishAt.is.null,publishAt.lte." + new Date().toISOString())
      .order("sortOrder", { ascending: true });

    if (branchId) {
      svcQuery = svcQuery.eq("branchId", branchId);
    }

    const { data: services, error: svcErr } = await svcQuery;
    if (svcErr) {
      console.error("Services query error:", svcErr);
      throw svcErr;
    }

    if (!services || services.length === 0) {
      return NextResponse.json([]);
    }

    // 2. Get all staff assignments — separate query to avoid join issues
    const serviceIds = services.map((s) => s.id);
    const { data: assignments, error: assignErr } = await supabase
      .from("StaffService")
      .select("product_id, staff_id")
      .in("product_id", serviceIds);

    if (assignErr) {
      console.error("StaffService query error:", assignErr);
      throw assignErr;
    }

    // 3. Get unique staff IDs and fetch staff details
    const staffIds = [...new Set((assignments || []).map((a) => a.staff_id))];
    let staffMap: Record<string, any> = {};

    if (staffIds.length > 0) {
      let staffQuery = supabase
        .from("Staff")
        .select("id, name, nameAr, avatar, role, isActive, branchId")
        .in("id", staffIds)
        .eq("isActive", true);

      if (branchId) {
        staffQuery = staffQuery.eq("branchId", branchId);
      }

      const { data: staffData, error: staffErr } = await staffQuery;
      if (staffErr) {
        console.error("Staff query error:", staffErr);
        throw staffErr;
      }

      for (const s of staffData || []) {
        staffMap[s.id] = {
          id: s.id,
          name: s.name,
          nameAr: s.nameAr,
          avatar: s.avatar,
          role: s.role,
        };
      }
    }

    // 4. Build product -> staff[] map
    const productStaffMap: Record<string, any[]> = {};
    for (const a of assignments || []) {
      const staff = staffMap[a.staff_id];
      if (!staff) continue;
      if (!productStaffMap[a.product_id]) productStaffMap[a.product_id] = [];
      productStaffMap[a.product_id].push(staff);
    }

    // 5. Fetch category labels + images (category field stores UUID)
    const categoryIds = [...new Set(services.map(s => s.category).filter(Boolean))];
    const catInfoMap: Record<string, { label: string; image: string }> = {};
    if (categoryIds.length > 0) {
      const { data: catData } = await supabase
        .from("Category")
        .select("id, label, image")
        .in("id", categoryIds);
      for (const c of catData || []) {
        catInfoMap[c.id] = { label: c.label, image: c.image || "" };
      }
    }

    // 6. Group services by category
    const categoryMap: Record<string, { label: string; image: string; services: any[] }> = {};
    for (const svc of services) {
      const catId = svc.category || "uncategorized";
      const catInfo = catInfoMap[catId] || { label: "عام", image: "" };
      if (!categoryMap[catId]) categoryMap[catId] = { label: catInfo.label, image: catInfo.image, services: [] };
      categoryMap[catId].services.push({
        ...svc,
        staff: productStaffMap[svc.id] || [],
      });
    }

    // 7. Convert to array — use category image, fallback to first service image
    const result = Object.entries(categoryMap).map(([catId, { label, image, services: svcs }]) => ({
      category: label,
      categoryId: catId,
      image: image || svcs[0]?.images?.[0] || null,
      services: svcs,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("ServicesWithStaff API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
