import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET — List all contact messages with pagination
export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getServiceRoleClient();
  const searchParams = req.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const filter = searchParams.get("filter") || "all"; // all | unread | read
  const offset = (page - 1) * limit;

  let query = supabase
    .from("ContactMessage")
    .select("*, Branch:branchId(id, name, nameAr)", { count: "exact" })
    .order("createdAt", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filter === "unread") {
    query = query.eq("isRead", false);
  } else if (filter === "read") {
    query = query.eq("isRead", true);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%,message.ilike.%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get unread count
  const { count: unreadCount } = await supabase
    .from("ContactMessage")
    .select("*", { count: "exact", head: true })
    .eq("isRead", false);

  return NextResponse.json({
    data: data || [],
    total: count || 0,
    unread: unreadCount || 0,
    page,
    limit,
  });
}
