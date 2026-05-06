import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase";

// GET /api/terms?slug=booking-conditions|terms
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug") || "booking-conditions";

    const supabase = getServiceRoleClient();

    const { data, error } = await supabase
      .from("CmsPage")
      .select("title, content")
      .eq("slug", slug)
      .single();

    if (error || !data) {
      return NextResponse.json({ title: "", content: "" });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Terms API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
