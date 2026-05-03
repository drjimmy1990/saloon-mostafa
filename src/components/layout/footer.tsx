import Link from "next/link";
import { Flower2, Phone, MapPin, Globe, ExternalLink } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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

export function Footer() {
  return (
    <footer className="bg-dark text-white/80">
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-terracotta flex items-center justify-center">
                <Flower2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                  صالون جاردينيا
                </h3>
                <p className="text-xs text-white/50">GARDENIA SALON</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-white/60">
              خدمات تجميل احترافية في الأردن. نقدم لك أفضل خدمات العناية
              بالشعر والبشرة والأظافر مع خبرة سنوات طويلة ومنتجات عالمية.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-terracotta transition-colors"
                aria-label="Instagram"
              >
                <Globe className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-terracotta transition-colors"
                aria-label="Facebook"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
              روابط سريعة
            </h4>
            <ul className="space-y-2">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-terracotta transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
              تواصلي معنا
            </h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-white/60">
                <Phone className="w-4 h-4 text-terracotta shrink-0" />
                <a
                  href={`tel:+${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "962786753791"}`}
                  className="hover:text-white transition-colors"
                  dir="ltr"
                >
                  +{process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "962786753791"}
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-white/60">
                <MapPin className="w-4 h-4 text-terracotta shrink-0 mt-0.5" />
                <span>عمّان، الأردن</span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-white/10" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} صالون جاردينيا. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-4">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
