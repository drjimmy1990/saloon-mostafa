/**
 * Utilities for service booking notice (lead time / rolling advance booking period)
 * 
 * Storage pattern in PostgreSQL `Product.publishAt` (TIMESTAMPTZ):
 * - null: Available immediately (0 notice / same day)
 * - Year < 2000 (Epoch offset): Rolling minimum notice in hours
 *     - 1970-01-02T00:00:00.000Z = 24 hours notice (1 day)
 *     - 1970-01-03T00:00:00.000Z = 48 hours notice (2 days)
 *     - 1970-01-04T00:00:00.000Z = 72 hours notice (3 days)
 *     - 1970-01-08T00:00:00.000Z = 168 hours notice (7 days / 1 week)
 * - Year >= 2020: Absolute calendar launch date (if future date)
 */

export interface ServiceNoticeInfo {
  noticeHours: number;
  noticeDays: number;
  isRolling: boolean;
  absoluteStartDate: string | null;
  labelAr: string;
  labelEn: string;
}

/**
 * Returns today's date in Saudi Arabia timezone (YYYY-MM-DD)
 */
export function getSaudiToday(): string {
  try {
    return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Riyadh" });
  } catch {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }
}

/**
 * Add days to a YYYY-MM-DD date string without timezone drift
 */
export function addDaysToDateString(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days, 12, 0, 0));
  return date.toISOString().split("T")[0];
}

/**
 * Format date string into Arabic or English display
 */
export function formatDisplayDate(dateStr: string, locale: "ar" | "en" = "ar"): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return date.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Parses `publishAt` column value into notice specifications
 */
export function parseServiceNotice(publishAt?: string | null): ServiceNoticeInfo {
  if (!publishAt) {
    return {
      noticeHours: 0,
      noticeDays: 0,
      isRolling: false,
      absoluteStartDate: null,
      labelAr: "متاح الآن (نفس اليوم)",
      labelEn: "Available Now",
    };
  }

  const d = new Date(publishAt);
  if (isNaN(d.getTime())) {
    return {
      noticeHours: 0,
      noticeDays: 0,
      isRolling: false,
      absoluteStartDate: null,
      labelAr: "متاح الآن (نفس اليوم)",
      labelEn: "Available Now",
    };
  }

  const year = d.getUTCFullYear();

  // Epoch-based rolling notice
  if (year < 2000) {
    const ms = d.getTime();
    const hours = Math.max(0, Math.round(ms / (3600 * 1000)));
    const days = Math.round(hours / 24);

    let labelAr = `${days} أيام`;
    if (days === 0) labelAr = "متاح الآن (نفس اليوم)";
    else if (days === 1) labelAr = "بدءاً من الغد (يوم)";
    else if (days === 2) labelAr = "بعد يومين";
    else if (days === 3) labelAr = "بعد 3 أيام";
    else if (days === 7) labelAr = "بعد أسبوع (7 أيام)";
    else if (days > 0) labelAr = `بعد ${days} أيام`;

    const labelEn = days === 0 ? "Available Now" : days === 1 ? "Next Day (1 day)" : `After ${days} days`;

    return {
      noticeHours: hours,
      noticeDays: days,
      isRolling: true,
      absoluteStartDate: null,
      labelAr,
      labelEn,
    };
  }

  // Future absolute date
  const abs = d.toLocaleDateString("sv-SE", { timeZone: "Asia/Riyadh" });
  const today = getSaudiToday();

  // If the date is already in the past, it was a legacy timestamp from older code;
  // default it gracefully to 24h notice (1 day) if within 14 days, or 0 if older
  if (abs < today) {
    return {
      noticeHours: 24,
      noticeDays: 1,
      isRolling: true,
      absoluteStartDate: null,
      labelAr: "بدءاً من الغد (يوم)",
      labelEn: "Next Day (1 day)",
    };
  }

  return {
    noticeHours: 0,
    noticeDays: 0,
    isRolling: false,
    absoluteStartDate: abs,
    labelAr: `يبدأ ${abs}`,
    labelEn: `Opens ${abs}`,
  };
}

/**
 * Encodes notice hours into standard ISO timestamp string for storage in `Product.publishAt`
 */
export function formatServiceNoticeTimestamp(noticeHours: number): string | null {
  if (!noticeHours || noticeHours <= 0) return null;
  return new Date(noticeHours * 3600 * 1000).toISOString();
}

/**
 * Calculates the earliest allowed booking date string (YYYY-MM-DD) for a service
 */
export function getEarliestBookingDate(publishAt?: string | null): string {
  const saudiToday = getSaudiToday();
  const notice = parseServiceNotice(publishAt);

  if (notice.absoluteStartDate) {
    return notice.absoluteStartDate > saudiToday ? notice.absoluteStartDate : saudiToday;
  }

  if (notice.noticeHours > 0) {
    const daysToAdd = notice.noticeDays > 0 ? notice.noticeDays : Math.ceil(notice.noticeHours / 24);
    return addDaysToDateString(saudiToday, daysToAdd);
  }

  return saudiToday;
}

/**
 * Presets for rolling maximum advance booking window (in days)
 */
export const BOOKING_WINDOW_PRESETS = [
  { days: null, labelAr: "مفتوح (بدون حد أقصى)", labelEn: "Unlimited" },
  { days: 30, labelAr: "شهر (30 يوماً)", labelEn: "1 Month (30 days)" },
  { days: 60, labelAr: "شهران (60 يوماً)", labelEn: "2 Months (60 days)" },
  { days: 90, labelAr: "3 أشهر (90 يوماً)", labelEn: "3 Months (90 days)" },
  { days: 120, labelAr: "4 أشهر (120 يوماً)", labelEn: "4 Months (120 days)" },
] as const;

/**
 * Parses/extracts bookingWindowDays (rolling future horizon in days) from product.
 * Supports both dedicated column `bookingWindowDays` and resilient fallback metadata in `notes`.
 */
export function parseProductBookingWindow(product?: { bookingWindowDays?: number | null; notes?: string | null } | null): number | null {
  if (!product) return null;
  if (typeof product.bookingWindowDays === "number" && product.bookingWindowDays > 0) {
    return product.bookingWindowDays;
  }
  if (product.notes) {
    const match = product.notes.match(/\[bookingWindowDays:(\d+)\]/i);
    if (match && match[1]) {
      const val = parseInt(match[1], 10);
      if (val > 0) return val;
    }
  }
  return null;
}

/**
 * Calculates the maximum allowed booking date (YYYY-MM-DD) for a service based on rolling window.
 * Returns null if unlimited.
 */
export function getLatestBookingDate(bookingWindowDays?: number | null): string | null {
  if (!bookingWindowDays || bookingWindowDays <= 0) return null;
  const saudiToday = getSaudiToday();
  return addDaysToDateString(saudiToday, bookingWindowDays);
}

/**
 * Human-readable Arabic and English label for a booking window duration.
 */
export function formatBookingWindowLabel(days: number | null, locale: "ar" | "en" = "ar"): string {
  if (!days || days <= 0) {
    return locale === "ar" ? "مفتوح (بدون حد أقصى)" : "Unlimited";
  }
  if (days === 30) return locale === "ar" ? "شهر (30 يوماً)" : "1 Month (30 days)";
  if (days === 60) return locale === "ar" ? "شهران (60 يوماً)" : "2 Months (60 days)";
  if (days === 90) return locale === "ar" ? "3 أشهر (90 يوماً)" : "3 Months (90 days)";
  if (days === 120) return locale === "ar" ? "4 أشهر (120 يوماً)" : "4 Months (120 days)";
  return locale === "ar" ? `${days} يوماً` : `${days} days`;
}

/**
 * Clean and update product notes to inject or strip `[bookingWindowDays:X]` metadata.
 */
export function formatProductNotesWithWindow(originalNotes: string | null | undefined, windowDays: number | null): string {
  const clean = (originalNotes || "").replace(/\s*\[bookingWindowDays:\d+\]/gi, "").trim();
  if (windowDays && windowDays > 0) {
    return clean ? `${clean} [bookingWindowDays:${windowDays}]` : `[bookingWindowDays:${windowDays}]`;
  }
  return clean;
}

