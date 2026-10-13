import { getServiceRoleClient } from "@/lib/supabase";
import { normalizePhone } from "@/lib/phone";

export const ARABIC_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

export const ENGLISH_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
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

export function formatEnglishAppointmentDate(
  dateInput: string | Date | null | undefined
): string {
  if (!dateInput) return "";
  let year = "";
  let month = 0;
  let day = 0;

  if (typeof dateInput === "string") {
    const dateMatch = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
      year = dateMatch[1];
      month = parseInt(dateMatch[2], 10);
      day = parseInt(dateMatch[3], 10);
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

  const monthName = ENGLISH_MONTHS[month - 1] || "";
  return `${day} ${monthName} ${year}`;
}

export function formatEnglishTime(
  timeInput?: string | null,
  dateInput?: string | Date | null
): string {
  let timeStr = timeInput ? String(timeInput).trim() : "";
  if (!timeStr && typeof dateInput === "string" && dateInput.includes("T")) {
    const timeMatch = dateInput.match(/T(\d{2}):(\d{2})/);
    if (timeMatch && timeMatch[1] !== "00") {
      timeStr = `${timeMatch[1]}:${timeMatch[2]}`;
    }
  }
  if (!timeStr) return "";
  const timeClean = timeStr.slice(0, 5);
  const [hRaw, mRaw] = timeClean.split(":");
  const h = parseInt(hRaw, 10);
  const m = mRaw || "00";
  if (isNaN(h)) return timeStr;
  const period = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${m} ${period}`;
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

    // 2. Fetch full booking details
    let booking = opts.booking;
    if (!booking) {
      const { data: fetched, error: fetchErr } = await supabase
        .from("Booking")
        .select("*")
        .eq("id", opts.bookingId)
        .maybeSingle();

      if (fetchErr || !fetched) {
        console.error("[BookingWebhook] Could not load booking for webhook:", fetchErr);
        return { success: false, error: "Booking not found" };
      }
      booking = fetched;
    }

    // 3. Resilient parallel fetch for related entities (avoids foreign key join issues)
    const [clientRes, serviceRes, staffRes, branchRes] = await Promise.all([
      booking.client_id
        ? supabase.from("Client").select("*").eq("id", booking.client_id).maybeSingle()
        : Promise.resolve({ data: null }),
      booking.serviceId
        ? supabase.from("Product").select("*").eq("id", booking.serviceId).maybeSingle()
        : Promise.resolve({ data: null }),
      booking.staff_id && booking.staff_id !== "none"
        ? supabase.from("Staff").select("id, name, phone").eq("id", booking.staff_id).maybeSingle()
        : Promise.resolve({ data: null }),
      booking.branchId
        ? supabase.from("Branch").select("id, name, nameAr").eq("id", booking.branchId).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const client = clientRes.data || booking.client || {};
    const service = serviceRes.data || booking.service || {};
    const staff = staffRes.data || booking.staff || {};
    const branch = branchRes.data || booking.branch || {};

    const customerName = (client.name || "عميلة صالون نون").trim();
    const rawPhone = client.phone || "";
    const cleanPhone = normalizePhone(rawPhone);
    const whatsappPhone = cleanPhone; // e.g. 9665XXXXXXXX
    const phoneWithPlus = cleanPhone ? `+${cleanPhone}` : "";

    const serviceName = (service.name || booking.serviceSummary || "خدمة صالون نون").trim();
    const staffName = (staff.name || "صالون نون").trim();

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

    const dateClean = typeof booking.bookingDate === "string" && booking.bookingDate.match(/^(\d{4}-\d{2}-\d{2})/)
      ? booking.bookingDate.match(/^(\d{4}-\d{2}-\d{2})/)![1]
      : (booking.bookingDate ? new Date(booking.bookingDate).toISOString().split('T')[0] : "");
    const timeClean = booking.bookingTime ? String(booking.bookingTime).slice(0, 5) : "";
    const dateFormattedEn = formatEnglishAppointmentDate(booking.bookingDate);
    const timeFormattedEn = formatEnglishTime(booking.bookingTime, booking.bookingDate);

    const template5Params = [
      customerName,
      serviceName,
      dateFormattedEn || dateClean,
      timeFormattedEn || timeClean || "10:00 AM",
      bookingCode,
    ];

    const template7Params = [
      customerName,
      serviceName,
      staffName,
      paidFormatted,
      remainingFormatted,
      appointmentFormatted,
      bookingCode,
    ];

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
        date_clean: dateClean,
        time_clean: timeClean,
        formatted_ar: appointmentFormatted,
        formatted_date_en: dateFormattedEn,
        formatted_time_en: timeFormattedEn,
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
      // 5-parameter template format (e.g. city_doctor_booking_confirmation)
      // {{1}} Name, {{2}} Service, {{3}} Date, {{4}} Time, {{5}} Booking Reference
      template_5_params: template5Params,
      // 7-parameter template format (e.g. noon_booking_confirmationv2)
      // {{1}} Name, {{2}} Service, {{3}} Specialist, {{4}} Paid, {{5}} Remaining, {{6}} Appointment, {{7}} Booking Code
      template_7_params: template7Params,
      // Exact 7 body parameters matching WhatsApp template "noon_booking_confirmationv2":
      parameters: {
        "1": customerName,
        "2": serviceName,
        "3": staffName,
        "4": paidFormatted,
        "5": remainingFormatted,
        "6": appointmentFormatted,
        "7": bookingCode,
      },
      parameters_array: template7Params,
      // Ready-to-send payload for Zernio API / Custom HTTP Request node
      zernio_city_doctor_payload: {
        accountId: "6a4a53109d9472faae8493e7",
        participantId: whatsappPhone,
        templateName: "city_doctor_booking_confirmation",
        templateLanguage: "en",
        templateParams: template5Params,
      },
      zernio_noon_booking_payload: {
        accountId: "6a4a53109d9472faae8493e7",
        participantId: whatsappPhone,
        templateName: "noon_booking_confirmationv2",
        templateLanguage: "ar",
        templateParams: template7Params,
      },
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

/**
 * Send a sample/test webhook payload to verify n8n connection
 */
export async function sendTestBookingWebhook(
  targetUrl: string
): Promise<{ success: boolean; status?: number; error?: string }> {
  try {
    const testPayload = {
      event: "booking_confirmed",
      source: "test",
      timestamp: new Date().toISOString(),
      booking_id: "test-booking-id-1234",
      booking_code: "CD109100",
      template_name: "noon_booking_confirmationv2",
      template_language: "ar",
      customer_phone: "966500000000",
      customer_name: "أحمد",
      customer: {
        id: "test-client-id",
        name: "أحمد",
        phone: "966500000000",
        whatsapp_phone: "966500000000",
        phone_with_plus: "+966500000000",
        raw_phone: "0500000000",
        email: "ahmed@example.com",
      },
      service: {
        id: "test-service-id",
        name: "مكياج",
        price: 255,
        duration_minutes: 45,
      },
      staff: {
        id: "test-staff-id",
        name: "هدى",
      },
      branch: {
        id: "test-branch-id",
        name: "فرع صالون نون الرئيسي",
      },
      appointment: {
        date: "2026-10-15T10:00:00Z",
        time: "10:00",
        formatted_ar: "15 أكتوبر 2026 الساعة 10:00 صباحًا",
        queue_number: null,
        slot_number: 1,
        location: "salon",
      },
      financial: {
        total_price: 255,
        paid_amount: 50,
        remaining_amount: 205,
        paid_formatted: "٥٠ ريال",
        remaining_formatted: "٢٠٥ ريال",
        payment_method: "cash",
        deposit_status: "paid",
      },
      parameters: {
        "1": "أحمد",
        "2": "مكياج",
        "3": "هدى",
        "4": "٥٠ ريال",
        "5": "٢٠٥ ريال",
        "6": "15 أكتوبر 2026 الساعة 10:00 صباحًا",
        "7": "CD109100",
      },
      parameters_array: [
        "أحمد",
        "مكياج",
        "هدى",
        "٥٠ ريال",
        "٢٠٥ ريال",
        "15 أكتوبر 2026 الساعة 10:00 صباحًا",
        "CD109100",
      ],
      whatsapp_payload: {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: "966500000000",
        type: "template",
        template: {
          name: "noon_booking_confirmationv2",
          language: { code: "ar" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: "أحمد" },
                { type: "text", text: "مكياج" },
                { type: "text", text: "هدى" },
                { type: "text", text: "٥٠ ريال" },
                { type: "text", text: "٢٠٥ ريال" },
                { type: "text", text: "15 أكتوبر 2026 الساعة 10:00 صباحًا" },
                { type: "text", text: "CD109100" },
              ],
            },
          ],
        },
      },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "SalonNoon-Booking-Webhook-Test/1.0",
      },
      body: JSON.stringify(testPayload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return { success: false, status: res.status, error: `HTTP ${res.status}` };
    }

    return { success: true, status: res.status };
  } catch (err: any) {
    return { success: false, error: err?.message || "Connection failed" };
  }
}
