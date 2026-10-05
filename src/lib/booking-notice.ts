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
  // default it gracefully to 24h notice (1 day)
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
