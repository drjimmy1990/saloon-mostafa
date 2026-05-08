import Link from "next/link";
import { Flower2, Phone, MapPin, Clock } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";

const footerLinks = [
  { label: "الخدمات", href: "/services" },
  { label: "المنتجات", href: "/products" },
  { label: "المعرض", href: "/gallery" },
  { label: "احجزي الآن", href: "/booking" },
  { label: "من نحن", href: "/about" },
  { label: "تواصلي معنا", href: "/contact" },
];

const legalLinks = [
  { label: "سياسة الخصوصية", href: "/privacy" },
  { label: "الشروط والأحكام", href: "/terms" },
];

export async function Footer() {
  const settings = await getSiteSettings();
  const phoneNumber = settings.salon_phone || "962786753791";
  const salonAddress = settings.salon_address || "الرياض، السعودية";
  const workingWeekdays = settings.working_hours_weekdays || "السبت - الخميس: 10:00 ص - 8:00 م";
  const workingFriday = settings.working_hours_friday || "الجمعة: مغلق";
  const instagramUrl = settings.instagram_url || "#";
  const facebookUrl = settings.facebook_url || "#";
  const tiktokUrl = settings.tiktok_url || "#";

  return (
    <footer className="bg-dark text-white/80 pb-20 md:pb-0">
      {/* Top accent line */}
      <div className="h-1 w-full gradient-terracotta" />

      <div className="container mx-auto max-w-7xl px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1 space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-xl gradient-terracotta flex items-center justify-center shadow-lg shadow-terracotta/20">
                <Flower2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                  صالون نون
                </h3>
                <p className="text-[10px] text-white/40 tracking-[0.2em] uppercase">SALOON NOON</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-white/50">
              خدمات تجميل احترافية في السعودية. نقدم لك أفضل خدمات العناية بالشعر والبشرة والأظافر.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-2">
              <a href={instagramUrl} target={instagramUrl !== "#" ? "_blank" : undefined} rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-terracotta hover:border-terracotta transition-all" aria-label="Instagram">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </a>
              <a href={facebookUrl} target={facebookUrl !== "#" ? "_blank" : undefined} rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-terracotta hover:border-terracotta transition-all" aria-label="Facebook">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a href={tiktokUrl} target={tiktokUrl !== "#" ? "_blank" : undefined} rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-terracotta hover:border-terracotta transition-all" aria-label="TikTok">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-terracotta" />
              روابط سريعة
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/50 hover:text-terracotta hover:translate-x-1 transition-all inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-terracotta" />
              تواصلي معنا
            </h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-sm text-white/50">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-terracotta" />
                </div>
                <a
                  href={`tel:+${phoneNumber}`}
                  className="hover:text-white transition-colors"
                  dir="ltr"
                >
                  +{phoneNumber}
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-white/50">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-terracotta" />
                </div>
                <span>{salonAddress}</span>
              </li>
            </ul>
          </div>

          {/* Working Hours */}
          <div>
            <h4 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-terracotta" />
              ساعات العمل
            </h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-white/50">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-terracotta" />
                </div>
                <p className="text-white/60">{workingWeekdays}</p>
              </li>
              <li className="flex items-center gap-3 text-sm text-white/50">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-white/30" />
                </div>
                <p className="text-white/60">{workingFriday}</p>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-white/8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/30">
              © {new Date().getFullYear()} صالون نون. جميع الحقوق محفوظة.
            </p>
            <div className="flex items-center gap-6">
              {legalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-xs text-white/30 hover:text-white/60 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
