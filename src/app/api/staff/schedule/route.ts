import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

// GET — Get schedule for a staff member (7 days)
export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getServiceRoleClient();
  const staffId = req.nextUrl.searchParams.get("staff_id");

  if (!staffId) {
    return NextResponse.json({ error: "Missing staff_id" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("StaffSchedule")
    .select("*")
    .eq("staff_id", staffId)
    .order("dayOfWeek", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// PUT — Batch upsert schedule (array of 7 day entries)
export async function PUT(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getServiceRoleClient();
  const body = await req.json();

  if (!body.staff_id || !body.schedule || !Array.isArray(body.schedule)) {
    return NextResponse.json(
      { error: "Missing staff_id or schedule array" },
      { status: 400 }
    );
  }

  const entries = body.schedule.map(
    (s: { dayOfWeek: number; startTime: string; endTime: string; isOff: boolean }) => ({
      staff_id: body.staff_id,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime || "09:00",
      endTime: s.endTime || "18:00",
      isOff: s.isOff ?? false,
    })
  );

  const { data, error } = await supabase
    .from("StaffSchedule")
    .upsert(entries, { onConflict: "staff_id,dayOfWeek" })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
