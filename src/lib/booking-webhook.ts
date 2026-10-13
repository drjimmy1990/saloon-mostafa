import { getServiceRoleClient } from "@/lib/supabase";
import { normalizePhone } from "@/lib/phone";

export const ARABIC_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

/**
 * Format date & time into friendly Arabic appointment string
 * e.g. "15 أكتوبر 2026 الساعة 10:00 صباحًا"
 */
export function formatArabicAppointmentDate(
  dateInput: string | Date | null | undefined,
  timeInput?: string | null
): string {
  if (!dateInput) return "";

  let year = "";
  let month = 0;
  let day = 0;
  let timeStr = timeInput ? String(timeInput).trim() : "";

  if (typeof dateInput === "string") {
    const dateMatch = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
      year = dateMatch[1];
      month = parseInt(dateMatch[2], 10);
      day = parseInt(dateMatch[3], 10);
    }
    // If time was not explicitly passed, inspect ISO string
    if (!timeStr && dateInput.includes("T")) {
      const timeMatch = dateInput.match(/T(\d{2}):(\d{2})/);
      if (timeMatch && timeMatch[1] !== "00") {
        timeStr = `${timeMatch[1]}:${timeMatch[2]}`;
      }
    }
  }

  if (!year || !month || !day) {
    const d = new Date(dateInput);
    if (!isNaN(d.getTime())) {
      year = String(d.getUTCFullYear());
      month = d.getUTCMonth() + 1;
      day = d.getUTCDate();
    } else {
      return String(dateInput);
    }
  }

  const monthName = ARABIC_MONTHS[month - 1] || "";

  let formattedTime = "";
  if (timeStr && timeStr !== "00:00") {
    const timeClean = timeStr.slice(0, 5); // "HH:MM"
    const [hRaw, mRaw] = timeClean.split(":");
    const h = parseInt(hRaw, 10);
    const m = mRaw || "00";
    if (!isNaN(h)) {
      const isPm = h >= 12;
      const period = isPm ? "مساءً" : "صباحًا";
      const displayH = h % 12 === 0 ? 12 : h % 12;
      formattedTime = `${displayH}:${m} ${period}`;
    }
  }

  if (formattedTime) {
    return `${day} ${monthName} ${year} الساعة ${formattedTime}`;
  }

  return `${day} ${monthName} ${year}`;
}

export interface BookingWebhookOptions {
  bookingId: string;
  source: "manual" | "website" | "website_paymob";
  // Pre-loaded booking object (optional)
  booking?: any;
}

/**
 * Dispatch booking confirmation webhook to configured n8n endpoint.
 * Non-blocking, fails gracefully with informative logging.
 */
export async function dispatchBookingWebhook(
  opts: BookingWebhookOptions
): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
  try {
    const supabase = getServiceRoleClient();

    // 1. Read webhook URL from SystemSetting
    const { data: settingRow } = await supabase
      .from("SystemSetting")
      .select("value")
      .eq("key", "booking_webhook_url")
      .maybeSingle();

    const webhookUrl = settingRow?.value?.trim();
    if (!webhookUrl) {
      console.log("[BookingWebhook] No booking_webhook_url configured, skipping webhook.");
      return { success: true, skipped: true };
    }

    // 2. Fetch full booking details with relations
    let booking = opts.booking;
    if (!booking) {
      const { data: fetched, error: fetchErr } = await supabase
        .from("Booking")
        .select(`
          *,
          client:Client(*),
          service:Product(*),
          staff:Staff!Booking_staff_id_fkey(id, name, nameAr),
          branch:Branch(id, name, nameAr)
        `)
        .eq("id", opts.bookingId)
        .maybeSingle();

      if (fetchErr || !fetched) {
        console.error("[BookingWebhook] Could not load booking for webhook:", fetchErr);
        return { success: false, error: "Booking not found" };
      }
      booking = fetched;
    }

    const client = booking.client || {};
    const service = booking.service || {};
    const staff = booking.staff || {};
    const branch = booking.branch || {};

    const customerName = (client.name || "عميلة صالون نون").trim();
    const rawPhone = client.phone || "";
    const cleanPhone = normalizePhone(rawPhone);
    const whatsappPhone = cleanPhone; // e.g. 9665XXXXXXXX
    const phoneWithPlus = cleanPhone ? `+${cleanPhone}` : "";

    const serviceName = (service.name || booking.serviceSummary || "خدمة صالون نون").trim();
    const staffName = (staff.name || staff.nameAr || "صالون نون").trim();

    const servicePrice = Number(service.price) || 0;
    let paidAmount = 0;
    if (booking.depositStatus === "paid") {
      paidAmount = Number(booking.depositAmount) || 0;
    } else if (booking.paymentMethod === "paid" || booking.paymentMethod === "online") {
      paidAmount = Number(booking.depositAmount) || servicePrice;
    } else if (booking.depositAmount && Number(booking.depositAmount) > 0 && booking.depositStatus !== "unpaid") {
      paidAmount = Number(booking.depositAmount);
    }
    const remainingAmount = Math.max(0, servicePrice - paidAmount);

    const paidFormatted = `${paidAmount} ريال`;
    const remainingFormatted = `${remainingAmount} ريال`;

    const appointmentFormatted = formatArabicAppointmentDate(
      booking.bookingDate,
      booking.bookingTime
    );

    const bookingCode = booking.bookingCode || `NOON-${String(booking.id || "").slice(0, 4) || "0000"}`;

    // Webhook Payload structured for n8n & WhatsApp Cloud API Template
    const payload = {
      event: "booking_confirmed",
      source: opts.source,
      timestamp: new Date().toISOString(),
      booking_id: booking.id,
      booking_code: bookingCode,
      template_name: "noon_booking_confirmationv2",
      template_language: "ar",
      customer_phone: whatsappPhone,
      customer_name: customerName,
      customer: {
        id: client.id || null,
        name: customerName,
        phone: cleanPhone,
        whatsapp_phone: whatsappPhone,
        phone_with_plus: phoneWithPlus,
        raw_phone: rawPhone,
        email: client.email || "",
      },
      service: {
        id: service.id || booking.serviceId || null,
        name: serviceName,
        price: servicePrice,
        duration_minutes: service.durationMinutes || null,
      },
      staff: {
        id: staff.id || booking.staff_id || null,
        name: staffName,
      },
      branch: {
        id: branch.id || booking.branchId || null,
        name: branch.nameAr || branch.name || "",
      },
      appointment: {
        date: booking.bookingDate,
        time: booking.bookingTime || null,
        formatted_ar: appointmentFormatted,
        queue_number: booking.queueNumber || null,
        slot_number: booking.slotNumber || null,
        location: booking.location || "salon",
      },
      financial: {
        total_price: servicePrice,
        paid_amount: paidAmount,
        remaining_amount: remainingAmount,
        paid_formatted: paidFormatted,
        remaining_formatted: remainingFormatted,
        payment_method: booking.paymentMethod || "cash",
        deposit_status: booking.depositStatus || "unpaid",
      },
      // Exact 7 body parameters matching WhatsApp template "noon_booking_confirmationv2":
      // {{1}} Customer Name
      // {{2}} Service Name
      // {{3}} Specialist Name
      // {{4}} Paid Amount (e.g. ٥٠ ريال / 50 ريال)
      // {{5}} Remaining Amount (e.g. ٢٠٥ ريال / 205 ريال)
      // {{6}} Appointment Date & Time (e.g. 15 أكتوبر 2026 الساعة 10:00 صباحًا)
      // {{7}} Booking Code (e.g. CD109100 / NOON-4821)
      parameters: {
        "1": customerName,
        "2": serviceName,
        "3": staffName,
        "4": paidFormatted,
        "5": remainingFormatted,
        "6": appointmentFormatted,
        "7": bookingCode,
      },
      parameters_array: [
        customerName,
        serviceName,
        staffName,
        paidFormatted,
        remainingFormatted,
        appointmentFormatted,
        bookingCode,
      ],
      // Ready-to-send Meta WhatsApp Cloud API body for n8n HTTP Request node
      whatsapp_payload: {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: whatsappPhone,
        type: "template",
        template: {
          name: "noon_booking_confirmationv2",
          language: { code: "ar" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: customerName },
                { type: "text", text: serviceName },
                { type: "text", text: staffName },
                { type: "text", text: paidFormatted },
                { type: "text", text: remainingFormatted },
                { type: "text", text: appointmentFormatted },
                { type: "text", text: bookingCode },
              ],
            },
          ],
        },
      },
      raw_booking: booking,
    };

    console.log(`[BookingWebhook] Sending booking webhook to ${webhookUrl} for booking ${booking.id}...`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "SalonNoon-Booking-Webhook/1.0",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[BookingWebhook] Endpoint returned HTTP ${response.status}`);
      return { success: false, error: `HTTP ${response.status}` };
    }

    console.log(`[BookingWebhook] Webhook successfully delivered to ${webhookUrl}`);
    return { success: true };
  } catch (err: any) {
    console.error("[BookingWebhook] Failed to dispatch webhook:", err?.message || err);
    return { success: false, error: err?.message || "Webhook delivery failed" };
  }
}
