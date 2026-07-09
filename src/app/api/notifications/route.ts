import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (guard instanceof NextResponse) return guard;

  try {
    const body = await req.json();
    const { type, title, body: notifBody, client_id } = body;

    if (!title) {
      return NextResponse.json({ error: "title required" }, { status: 400 });
    }

    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from("Notification")
      .insert({
        type: type || "customer_service",
        title,
        body: notifBody || "",
        client_id: client_id || null,
        isRead: false,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Notifications creation error:", message);
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}