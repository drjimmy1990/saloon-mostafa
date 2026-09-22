/**
 * Phone Number Normalization & Validation Utility
 * Standardizes phone numbers across Salon Noon ecosystem (Website, CRM, Bot, Database).
 */

/**
 * Normalizes a phone number to standard canonical format:
 * - Digits only (removes +, spaces, dashes, parentheses, non-digit chars)
 * - Saudi numbers (05..., 5..., 009665..., +9665...) normalized to 9665XXXXXXXX (12 digits)
 * - Removes accidental double-prefix like 96605XXXXXXXX -> 9665XXXXXXXX
 * - International numbers: digits only without 00 prefix
 */
export function normalizePhone(raw: string | null | undefined): string {
  if (!raw) return "";

  // Strip all non-digit characters
  let cleaned = String(raw).replace(/\D/g, "");
  if (!cleaned) return "";

  // Handle international '00' prefix
  if (cleaned.startsWith("00")) {
    cleaned = cleaned.slice(2);
  }

  // Saudi Mobile Normalizations:
  // 1. 05XXXXXXXX (10 digits) -> 9665XXXXXXXX
  if (cleaned.startsWith("05") && cleaned.length === 10) {
    return "966" + cleaned.slice(1);
  }

  // 2. 5XXXXXXXX (9 digits) -> 9665XXXXXXXX
  if (cleaned.startsWith("5") && cleaned.length === 9) {
    return "966" + cleaned;
  }

  // 3. 96605XXXXXXXX (13 digits: typed 966 + 05...) -> 9665XXXXXXXX
  if (cleaned.startsWith("96605") && cleaned.length === 13) {
    return "966" + cleaned.slice(5);
  }

  // 4. 9665XXXXXXXX (12 digits) -> already canonical
  if (cleaned.startsWith("9665") && cleaned.length === 12) {
    return cleaned;
  }

  return cleaned;
}

/**
 * Returns all possible historical and common format variants of a phone number.
 * Used in database lookup queries so that searches match regardless of how
 * the phone was originally stored in the database.
 */
export function getPhoneVariants(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const normalized = normalizePhone(raw);
  if (!normalized) return [];

  const variants = new Set<string>();
  variants.add(normalized); // 9665XXXXXXXX
  variants.add("+" + normalized); // +9665XXXXXXXX

  if (normalized.startsWith("9665") && normalized.length === 12) {
    const local10 = "0" + normalized.slice(3); // 05XXXXXXXX
    const local9 = normalized.slice(3);        // 5XXXXXXXX
    variants.add(local10);
    variants.add("+" + local10);
    variants.add(local9);
    // Include variations with leading/trailing spaces for legacy dirty records
    variants.add(" " + local10);
    variants.add("  " + local10);
    variants.add(local10 + " ");
    variants.add(" " + normalized);
    variants.add("  " + normalized);
  }

  return Array.from(variants);
}

/**
 * Formats a phone number for elegant display in user interfaces.
 * Saudi numbers: 05XXXXXXXX
 * International numbers: +XXXXXXXXXXX
 */
export function formatPhoneForDisplay(raw: string | null | undefined): string {
  const norm = normalizePhone(raw);
  if (!norm) return "";
  if (norm.startsWith("9665") && norm.length === 12) {
    return "0" + norm.slice(3);
  }
  return "+" + norm;
}

/**
 * Validates whether an input represents a valid Saudi or international mobile number.
 */
export function isValidPhone(raw: string | null | undefined): boolean {
  const norm = normalizePhone(raw);
  if (!norm) return false;
  // Saudi mobile: 9665 followed by 8 digits = 12 digits
  if (/^9665\d{8}$/.test(norm)) return true;
  // International: between 8 and 15 digits
  return norm.length >= 8 && norm.length <= 15;
}
