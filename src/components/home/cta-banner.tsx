import Link from "next/link";
import { MessageCircle, Sparkles } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";

export async function CtaBanner() {
  const settings = await getSiteSettings();
  const whatsappNumber = settings.whatsapp_number || "962786753791";
  const message = encodeURIComponent("مرحباً، أريد حجز موعد في صالون جاردينيا 🌸");

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="relative overflow-hidden rounded-3xl gradient-terracotta animate-gradient p-10 md:p-16">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4 blur-sm" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white/5 translate-y-1/3 -translate-x-1/4 blur-sm" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/3 blur-3xl" />

          {/* Floating sparkles */}
          <Sparkles className="absolute top-8 right-12 w-6 h-6 text-white/15 animate-float" />
          <Sparkles className="absolute bottom-12 left-16 w-5 h-5 text-white/10 animate-float" style={{ animationDelay: "1s" }} />

          <div className="relative z-10 text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/90 text-sm font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              حجز فوري
            </div>
            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-5 leading-tight"
              style={{ fontFamily: "'Tajawal', sans-serif" }}
            >
              جاهزة تحجزي موعدك؟
            </h2>
            <p className="text-white/75 text-base md:text-lg mb-10 max-w-lg mx-auto leading-relaxed">
              تواصلي معنا عبر الواتساب أو احجزي مباشرة من الموقع — فريقنا جاهز لخدمتك!
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/booking"
                className="inline-flex items-center gap-2 px-8 py-4 text-base font-bold text-terracotta bg-white rounded-2xl shadow-xl shadow-black/10 hover:shadow-2xl hover:scale-105 active:scale-100 transition-all"
              >
                احجزي أونلاين
              </Link>
              <a
                href={`https://wa.me/${whatsappNumber}?text=${message}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 text-base font-bold text-white rounded-2xl border-2 border-white/25 hover:bg-white/10 backdrop-blur-sm transition-all hover:scale-105 active:scale-100"
              >
                <MessageCircle className="w-5 h-5" />
                تواصلي واتساب
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
