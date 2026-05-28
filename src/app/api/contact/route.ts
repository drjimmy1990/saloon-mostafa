import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// POST — Submit contact form (public, no auth required)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { name, phone, email, message, branchId } = body;

    if (!name || !phone || !message) {
      return NextResponse.json(
        { error: "الاسم ورقم الجوال والرسالة مطلوبة" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    const insertData: Record<string, unknown> = {
      name: name.trim(),
      phone: phone.trim(),
      email: (email || "").trim(),
      message: message.trim(),
      isRead: false,
    };

    if (branchId) {
      insertData.branchId = branchId;
    }

    const { data, error } = await supabase
      .from("ContactMessage")
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, id: data.id }, { status: 201 });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "حدث خطأ، حاولي مرة أخرى" },
      { status: 500 }
    );
  }
}
