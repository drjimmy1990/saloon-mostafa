import Link from "next/link";
import { MessageCircle } from "lucide-react";

export function CtaBanner() {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "962786753791";
  const message = encodeURIComponent("مرحباً، أريد حجز موعد في صالون جاردينيا 🌸");

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="relative overflow-hidden rounded-3xl gradient-terracotta p-8 md:p-14">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-white/5 translate-y-1/3 -translate-x-1/4" />

          <div className="relative z-10 text-center">
            <h2
              className="text-3xl md:text-4xl font-black text-white mb-4"
              style={{ fontFamily: "'Tajawal', sans-serif" }}
            >
              جاهزة تحجزي موعدك؟
            </h2>
            <p className="text-white/80 text-base md:text-lg mb-8 max-w-lg mx-auto">
              تواصلي معنا عبر الواتساب أو احجزي مباشرة من الموقع — فريقنا جاهز
              لخدمتك!
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/booking"
                className="inline-flex items-center gap-2 px-8 py-4 text-base font-bold text-terracotta bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-105"
              >
                احجزي أونلاين
              </Link>
              <a
                href={`https://wa.me/${whatsappNumber}?text=${message}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 text-base font-bold text-white rounded-2xl border-2 border-white/30 hover:bg-white/10 transition-all"
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
