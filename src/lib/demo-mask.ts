/**
 * Utility functions for masking sensitive data when logged in as Demo Mode (`userRole === 'demo'`)
 */

/**
 * Starred phone number formatting: e.g. "+20 10•••• 5678"
 */
export function maskPhone(phone?: string | null, isDemo?: boolean): string {
  if (!phone) return "—";
  if (!isDemo) return phone;
  const str = phone.trim();
  if (str.length <= 5) return "••••••";
  const start = str.slice(0, 4);
  const end = str.slice(-3);
  return `${start} •••• ${end}`;
}

/**
 * Starred customer name formatting: e.g. "Mus••• Ahm•••"
 */
export function maskName(name?: string | null, isDemo?: boolean): string {
  if (!name) return "—";
  if (!isDemo) return name;
  const parts = name.trim().split(" ");
  if (parts.length === 1) {
    return parts[0].length > 2 ? parts[0].slice(0, 2) + "••••" : "••••";
  }
  return parts.map(p => (p.length > 2 ? p.slice(0, 2) + "•••" : p[0] + "•")).join(" ");
}

/**
 * Starred customer ID / platform_user_id: e.g. "123••••78"
 */
export function maskId(id?: string | null, isDemo?: boolean): string {
  if (!id) return "—";
  if (!isDemo) return id;
  const str = id.trim();
  if (str.length <= 4) return "••••";
  return `${str.slice(0, 3)}••••${str.slice(-2)}`;
}

/**
 * Starred message preview & text content: e.g. "م•••د أ•••د"
 */
export function maskText(text?: string | null, isDemo?: boolean): string {
  if (!text) return "";
  if (!isDemo) return text;
  return text.replace(/[\w\u0600-\u06FF]+/g, (w) => (w.length > 2 ? w[0] + "•••" + w[w.length - 1] : "•••"));
}
