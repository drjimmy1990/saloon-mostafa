import { getServiceRoleClient } from "@/lib/supabase";
import { Metadata } from "next";
import { SectionHeader } from "@/components/shared/section-header";
import { Phone, MapPin, MessageCircle, Mail, ExternalLink } from "lucide-react";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "فروعنا | صالون نون",
  description: "تعرفي على فروع صالون نون — العناوين، أرقام الهواتف، وروابط التواصل الاجتماعي.",
};

interface Branch {
  id: string;
  name: string;
  nameAr: string;
  address: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  googleMapsUrl?: string;
  isActive: boolean;
}

/** Convert a regular Google Maps URL to an embeddable one */
function toEmbedUrl(url: string): string {
  if (!url || !url.trim()) return "";
  const trimmed = url.trim();
  
  // Already an embed URL
  if (trimmed.includes("/embed") || trimmed.includes("output=embed")) {
    return trimmed;
  }

  // Regular Google Maps URL — extract the query and build embed URL
  try {
    const parsed = new URL(trimmed);
    const query = parsed.searchParams.get("q") || parsed.searchParams.get("query") || "";
    
    if (query) {
      return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
    }

    // Place URL like /maps/place/...
    if (trimmed.includes("/place/")) {
      const placeMatch = trimmed.match(/\/place\/([^/]+)/);
      if (placeMatch) {
        return `https://www.google.com/maps?q=${encodeURIComponent(decodeURIComponent(placeMatch[1]))}&output=embed`;
      }
    }

    // Fallback — just append output=embed
    const separator = trimmed.includes("?") ? "&" : "?";
    return `${trimmed}${separator}output=embed`;
  } catch {
    return "";
  }
}

/** Check if a string has actual content (not empty/whitespace) */
function hasValue(val?: string | null): val is string {
  return !!val && val.trim().length > 0;
}

async function getActiveBranches(): Promise<Branch[]> {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("Branch")
    .select("*")
    .eq("isActive", true)
    .order("createdAt", { ascending: true });

  if (error) {
    console.error("Failed to fetch branches:", error);
    return [];
  }
  return data || [];
}

export default async function BranchesPage() {
  const branches = await getActiveBranches();

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero Section */}
      <div className="relative py-16 md:py-24 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-b from-terracotta/5 via-transparent to-transparent" />
        <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-terracotta/5 blur-3xl" />
        <div className="absolute bottom-10 right-10 w-72 h-72 rounded-full bg-sage/5 blur-3xl" />

        <div className="container mx-auto max-w-6xl px-4 relative z-10">
          <SectionHeader
            title="فروعنا"
            subtitle="تعرّفي على فروع صالون نون واختاري الأقرب إليك"
          />

          {/* Branches Grid */}
          {branches.length === 0 ? (
            <div className="text-center py-16">
              <MapPin className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground text-lg">لا توجد فروع متاحة حالياً</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {branches.map((branch) => {
                const embedUrl = toEmbedUrl(branch.googleMapsUrl || "");
                const hasWhatsapp = hasValue(branch.whatsapp);
                const hasEmail = hasValue(branch.email);
                const hasInstagram = hasValue(branch.instagramUrl);
                const hasFacebook = hasValue(branch.facebookUrl);
                const hasSocial = hasInstagram || hasFacebook;

                return (
                  <div
                    key={branch.id}
                    className="bg-white rounded-3xl overflow-hidden shadow-lg shadow-black/5 border border-border/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                  >
                    {/* Map embed */}
                    {embedUrl && (
                      <div className="relative h-[220px] overflow-hidden">
                        <iframe
                          src={embedUrl}
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          title={`موقع ${branch.nameAr || branch.name}`}
                          className="grayscale-[30%] group-hover:grayscale-0 transition-all duration-500"
                        />
                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent" />
                      </div>
                    )}

                    {/* Branch info */}
                    <div className="p-6 space-y-4">
                      {/* Branch name */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-terracotta/10 flex items-center justify-center shrink-0">
                          <MapPin className="w-5 h-5 text-terracotta" />
                        </div>
                        <div>
                          <h3
                            className="text-lg font-black text-dark leading-tight"
                            style={{ fontFamily: "'Tajawal', sans-serif" }}
                          >
                            {branch.nameAr || branch.name}
                          </h3>
                          {hasValue(branch.address) && (
                            <p className="text-xs text-muted-foreground mt-0.5">{branch.address}</p>
                          )}
                        </div>
                      </div>

                      {/* Contact details */}
                      <div className="grid grid-cols-1 gap-2.5">
                        {/* Phone */}
                        {hasValue(branch.phone) && (
                          <a
                            href={`tel:+${branch.phone}`}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-cream/60 hover:bg-terracotta/8 transition-colors group/link"
                          >
                            <div className="w-8 h-8 rounded-lg bg-terracotta/10 flex items-center justify-center shrink-0 group-hover/link:bg-terracotta/20 transition-colors">
                              <Phone className="w-4 h-4 text-terracotta" />
                            </div>
                            <span className="text-sm text-foreground/70 group-hover/link:text-terracotta transition-colors" dir="ltr">
                              +{branch.phone}
                            </span>
                          </a>
                        )}

                        {/* WhatsApp */}
                        {hasWhatsapp && (
                          <a
                            href={`https://wa.me/${branch.whatsapp}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-cream/60 hover:bg-green-50 transition-colors group/link"
                          >
                            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0 group-hover/link:bg-green-200 transition-colors">
                              <MessageCircle className="w-4 h-4 text-green-600" />
                            </div>
                            <span className="text-sm text-foreground/70 group-hover/link:text-green-600 transition-colors">
                              واتساب
                            </span>
                            <ExternalLink className="w-3 h-3 text-muted-foreground/30 mr-auto" />
                          </a>
                        )}

                        {/* Email */}
                        {hasEmail && (
                          <a
                            href={`mailto:${branch.email}`}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-cream/60 hover:bg-blue-50 transition-colors group/link"
                          >
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 group-hover/link:bg-blue-200 transition-colors">
                              <Mail className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="text-sm text-foreground/70 group-hover/link:text-blue-600 transition-colors truncate">
                              {branch.email}
                            </span>
                          </a>
                        )}
                      </div>

                      {/* Social media */}
                      {hasSocial && (
                        <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                          <span className="text-xs text-muted-foreground/60">تابعينا:</span>
                          {hasInstagram && (
                            <a
                              href={branch.instagramUrl!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white hover:scale-110 transition-transform shadow-sm"
                              aria-label="Instagram"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                              </svg>
                            </a>
                          )}
                          {hasFacebook && (
                            <a
                              href={branch.facebookUrl!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white hover:scale-110 transition-transform shadow-sm"
                              aria-label="Facebook"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                              </svg>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Contact Form Section */}
      <ContactForm />
    </div>
  );
}
