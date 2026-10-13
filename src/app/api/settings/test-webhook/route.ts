import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { sendTestBookingWebhook } from "@/lib/booking-webhook";

// POST /api/settings/test-webhook
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const webhookUrl = body.webhookUrl?.trim();

    if (!webhookUrl || !/^https?:\/\//i.test(webhookUrl)) {
      return NextResponse.json(
        { error: "يرجى إدخال رابط ويب هوك صحيح يبدأ بـ https://" },
        { status: 400 }
      );
    }

    const result = await sendTestBookingWebhook(webhookUrl);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "تم إرسال إشعار تجريبي إلى الويب هوك بنجاح واستلام استجابة 200 OK من الخادم",
        status: result.status,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: `تعذر الاتصال بالويب هوك: ${result.error || "خطأ غير معروف"}`,
          status: result.status,
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Test webhook error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إرسال الإشعار التجريبي" },
      { status: 500 }
    );
  }
}
