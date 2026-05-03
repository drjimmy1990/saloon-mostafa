"use client";

import Link from "next/link";
import { Sparkles, ArrowLeft, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

function CountUp({ target, suffix = "" }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const duration = 2000;
    const step = Math.ceil(target / (duration / 30));
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(current);
      }
    }, 30);
    return () => clearInterval(timer);
  }, [target]);
  return <>{count}{suffix}</>;
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden min-h-[90vh] md:min-h-[85vh] flex items-center gradient-mesh">
      {/* Animated decorative blobs */}
      <div className="absolute top-10 right-[10%] w-72 h-72 rounded-full bg-terracotta/8 blur-3xl animate-float" />
      <div className="absolute bottom-10 left-[5%] w-96 h-96 rounded-full bg-sage/8 blur-3xl animate-float" style={{ animationDelay: "1s" }} />
      <div className="absolute top-1/2 left-1/2 w-60 h-60 rounded-full bg-sand/10 blur-3xl animate-float" style={{ animationDelay: "2s" }} />

      <div className="container mx-auto max-w-7xl px-4 py-16 md:py-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-center lg:text-right"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass border border-terracotta/15 text-terracotta text-sm font-medium mb-8"
            >
              <Sparkles className="w-4 h-4" />
              <span>خدمات تجميل احترافية في الأردن</span>
            </motion.div>

            {/* Heading */}
            <h1
              className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-dark leading-[1.15] mb-6"
              style={{ fontFamily: "'Tajawal', sans-serif" }}
            >
              مرحباً بك في{" "}
              <span className="gradient-text relative inline-block">
                صالون جاردينيا
                <svg
                  className="absolute -bottom-1 left-0 w-full"
                  viewBox="0 0 200 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1 5.5C40 2 80 1 100 3C120 5 160 6.5 199 2"
                    stroke="#d9703e"
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity="0.3"
                  />
                </svg>
              </span>
            </h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              خدمات تجميل احترافية — تصفيف الشعر، العناية بالبشرة، الأظافر، والمكياج. احجزي موعدك أو تسوّقي منتجاتنا أونلاين.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <Link
                href="/booking"
                className="group inline-flex items-center gap-3 px-8 py-4 text-lg font-bold text-white rounded-2xl gradient-terracotta shadow-xl shadow-terracotta/20 hover:shadow-terracotta/40 transition-all hover:scale-105 active:scale-100"
              >
                احجزي الآن
                <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-8 py-4 text-lg font-bold text-dark rounded-2xl glass border border-border/60 hover:border-terracotta/30 hover:bg-white/80 transition-all hover:scale-105 active:scale-100 shadow-sm"
              >
                تسوّقي المنتجات
              </Link>
            </motion.div>
          </motion.div>

          {/* Decorative Image Grid */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="hidden lg:grid grid-cols-2 gap-4"
          >
            {/* Stats Cards instead of images (since we don't have hero images) */}
            <div className="space-y-4">
              <div className="glass rounded-2xl p-6 card-hover border border-white/60">
                <div className="w-12 h-12 rounded-xl bg-terracotta/10 flex items-center justify-center mb-3">
                  <Sparkles className="w-6 h-6 text-terracotta" />
                </div>
                <div className="text-3xl font-black text-terracotta tabular-nums mb-1">
                  <CountUp target={50} suffix="+" />
                </div>
                <p className="text-sm text-muted-foreground">خدمة متنوعة</p>
              </div>
              <div className="glass rounded-2xl p-6 card-hover border border-white/60 animate-float" style={{ animationDelay: "0.5s" }}>
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm font-medium text-dark">&quot;أفضل صالون في الأردن&quot;</p>
                <p className="text-xs text-muted-foreground mt-1">— عميلة سعيدة</p>
              </div>
            </div>
            <div className="space-y-4 pt-8">
              <div className="glass rounded-2xl p-6 card-hover border border-white/60 animate-float" style={{ animationDelay: "1s" }}>
                <div className="w-12 h-12 rounded-xl bg-sage/10 flex items-center justify-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-sage"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div className="text-3xl font-black text-sage tabular-nums mb-1">
                  <CountUp target={500} suffix="+" />
                </div>
                <p className="text-sm text-muted-foreground">عميلة سعيدة</p>
              </div>
              <div className="glass rounded-2xl p-6 card-hover border border-white/60">
                <div className="w-12 h-12 rounded-xl bg-sand/10 flex items-center justify-center mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-sand"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                </div>
                <div className="text-3xl font-black text-sand tabular-nums mb-1">
                  <CountUp target={10} suffix="+" />
                </div>
                <p className="text-sm text-muted-foreground">سنوات خبرة</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Mobile Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex lg:hidden items-center justify-center gap-6 mt-12"
        >
          {[
            { number: 10, suffix: "+", label: "سنوات خبرة", color: "text-terracotta" },
            { number: 500, suffix: "+", label: "عميلة سعيدة", color: "text-sage" },
            { number: 50, suffix: "+", label: "خدمة متنوعة", color: "text-sand" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className={`text-2xl font-black tabular-nums ${stat.color}`}>
                <CountUp target={stat.number} suffix={stat.suffix} />
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
