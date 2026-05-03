import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden gradient-hero min-h-[85vh] flex items-center">
      {/* Decorative shapes */}
      <div className="absolute top-20 right-10 w-64 h-64 rounded-full bg-terracotta/5 blur-3xl" />
      <div className="absolute bottom-20 left-10 w-80 h-80 rounded-full bg-sage/5 blur-3xl" />
      <div className="absolute top-40 left-1/3 w-40 h-40 rounded-full bg-sand/10 blur-2xl" />

      <div className="container mx-auto max-w-7xl px-4 py-20 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-terracotta/10 text-terracotta text-sm font-medium mb-6 animate-fade-in-up">
            <Sparkles className="w-4 h-4" />
            <span>خدمات تجميل احترافية</span>
          </div>

          {/* Heading */}
          <h1
            className="text-4xl md:text-6xl lg:text-7xl font-black text-dark leading-tight mb-6 animate-fade-in-up"
            style={{ fontFamily: "'Tajawal', sans-serif", animationDelay: "100ms" }}
          >
            مرحباً بك في{" "}
            <span className="text-terracotta relative">
              صالون جاردينيا
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 200 8"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 5.5C40 2 80 1 100 3C120 5 160 6.5 199 2"
                  stroke="#d9703e"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  opacity="0.4"
                />
              </svg>
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed animate-fade-in-up"
            style={{ animationDelay: "200ms" }}
          >
            خدمات تجميل احترافية في الأردن — تصفيف الشعر، العناية بالبشرة،
            الأظافر، والمكياج. احجزي موعدك أو تسوّقي منتجاتنا أونلاين.
          </p>

          {/* CTAs */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up"
            style={{ animationDelay: "300ms" }}
          >
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 px-8 py-4 text-lg font-bold text-white rounded-2xl gradient-terracotta shadow-xl hover:shadow-terracotta/30 transition-all hover:scale-105"
            >
              احجزي الآن
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-8 py-4 text-lg font-bold text-dark rounded-2xl bg-white shadow-lg border border-border hover:border-terracotta/30 transition-all hover:scale-105"
            >
              تسوّقي المنتجات
            </Link>
          </div>

          {/* Trust indicators */}
          <div
            className="flex items-center justify-center gap-8 mt-12 animate-fade-in-up"
            style={{ animationDelay: "400ms" }}
          >
            {[
              { number: "10+", label: "سنوات خبرة" },
              { number: "500+", label: "عميلة سعيدة" },
              { number: "50+", label: "خدمة متنوعة" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-black text-terracotta tabular-nums">
                  {stat.number}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
