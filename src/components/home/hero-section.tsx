"use client";

import Link from "next/link";
import Image from "next/image";
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
  const [images, setImages] = useState({
    hero_image_1: "/images/hero/hero_salon_1.png",
    hero_image_2: "/images/hero/hero_salon_2.png",
    hero_image_3: "/images/hero/hero_salon_3.png",
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setImages({
          hero_image_1: data.hero_image_1 || "/images/hero/hero_salon_1.png",
          hero_image_2: data.hero_image_2 || "/images/hero/hero_salon_2.png",
          hero_image_3: data.hero_image_3 || "/images/hero/hero_salon_3.png",
        });
      })
      .catch((err) => console.error("Failed to load settings in HeroSection:", err));
  }, []);

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
            {/* Heading */}
            <h1 className="mb-6">
              <span
                className="gradient-text relative inline-block text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.15]"
                style={{ fontFamily: "var(--font-ibm-plex-sans-arabic), sans-serif" }}
              >
                صالون نون
                  <svg
                    className="absolute -bottom-1 left-0 w-full"
                    viewBox="0 0 200 8"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1 5.5C40 2 80 1 100 3C120 5 160 6.5 199 2"
                      stroke="var(--terracotta)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      opacity="0.3"
                    />
                  </svg>
              </span>
              <span
                className="gradient-gold block mt-2 text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-normal py-2 leading-none"
                style={{ fontFamily: "var(--font-monsieur), var(--font-alex-brush), cursive", direction: "ltr" }}
              >
                Salon Noon
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
                className="group inline-flex items-center gap-3 px-8 py-4 text-lg font-bold text-black rounded-2xl gradient-terracotta shadow-xl shadow-black/10 hover:shadow-black/20 transition-all hover:scale-105 active:scale-100"
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

           {/* Mobile Hero Image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="lg:hidden relative mx-auto max-w-sm w-full"
          >
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-white/60">
              <Image src={images.hero_image_2} alt="صالون نون — خدمات تجميل احترافية" fill sizes="(max-width: 1024px) 90vw, 0" priority className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <div className="text-white text-[10px] font-bold bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full">
                  +500 تقييم ممتاز
                </div>
              </div>
            </div>
          </motion.div>

          {/* Desktop Decorative Image Grid */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="hidden lg:grid grid-cols-2 gap-4"
          >
            <div className="space-y-4">
              <div className="relative h-64 rounded-2xl overflow-hidden shadow-xl card-hover border border-white/60">
                <Image src={images.hero_image_1} alt="صالون نون" fill sizes="(max-width: 1024px) 100vw, 50vw" priority className="object-cover" />
              </div>
              <div className="relative h-48 rounded-2xl overflow-hidden shadow-xl card-hover border border-white/60 animate-float" style={{ animationDelay: "0.5s" }}>
                <Image src={images.hero_image_3} alt="مكياج احترافي" fill sizes="(max-width: 1024px) 100vw, 50vw" priority className="object-cover" />
              </div>
            </div>
            <div className="space-y-4 pt-12">
              <div className="relative h-80 rounded-2xl overflow-hidden shadow-xl card-hover border border-white/60 animate-float" style={{ animationDelay: "1s" }}>
                <Image src={images.hero_image_2} alt="تصفيف شعر" fill sizes="(max-width: 1024px) 100vw, 50vw" priority className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                   <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <div className="text-white text-xs font-bold bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full">
                    +500 تقييم ممتاز
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Desktop Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="hidden lg:flex items-center justify-center gap-12 mt-14"
        >
          {[
            { number: 10, suffix: "+", label: "سنوات خبرة", color: "text-terracotta" },
            { number: 500, suffix: "+", label: "عميلة سعيدة", color: "text-sage" },
            { number: 50, suffix: "+", label: "خدمة متنوعة", color: "text-sand" },
            { number: 15, suffix: "+", label: "خبيرة تجميل", color: "text-terracotta-600" },
          ].map((stat) => (
            <div key={stat.label} className="text-center group">
              <div className={`text-3xl font-black tabular-nums ${stat.color} group-hover:scale-110 transition-transform`}>
                <CountUp target={stat.number} suffix={stat.suffix} />
              </div>
              <div className="text-xs text-muted-foreground mt-1 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

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
