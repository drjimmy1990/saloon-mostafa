import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase";

// GET /api/staff-by-service?serviceId=xxx&branchId=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const serviceId = searchParams.get("serviceId");
    const branchId = searchParams.get("branchId");

    if (!serviceId) {
      return NextResponse.json(
        { error: "serviceId is required" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // Get staff members assigned to this service via StaffService junction
    let query = supabase
      .from("StaffService")
      .select("staff_id, Staff(id, name, nameAr, phone, avatar, role, isActive, branchId)")
      .eq("product_id", serviceId);

    const { data, error } = await query;

    if (error) throw error;

    // Extract staff and filter by branch + active status
    let staffList = (data || [])
      .map((d: any) => d.Staff)
      .filter((s: any) => s && s.isActive);

    if (branchId) {
      staffList = staffList.filter((s: any) => s.branchId === branchId);
    }

    return NextResponse.json(staffList);
  } catch (err) {
    console.error("StaffByService API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
