"use client";

import Link from "next/link";
import { Flower2, Home, Scissors, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-cream relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-10 right-[10%] w-72 h-72 rounded-full bg-terracotta/5 blur-3xl animate-float" />
      <div className="absolute bottom-10 left-[5%] w-96 h-96 rounded-full bg-sage/5 blur-3xl animate-float" style={{ animationDelay: "1s" }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center px-6 max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="w-16 h-16 rounded-2xl gradient-terracotta flex items-center justify-center mx-auto mb-6 shadow-lg shadow-terracotta/20">
          <Flower2 className="w-8 h-8 text-white" />
        </div>

        {/* 404 Number */}
        <h1 className="text-8xl font-black gradient-text mb-2" style={{ fontFamily: "'Tajawal', sans-serif" }}>
          404
        </h1>

        <h2 className="text-2xl font-bold text-dark mb-3" style={{ fontFamily: "'Tajawal', sans-serif" }}>
          الصفحة غير موجودة
        </h2>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          عذراً، الصفحة اللي تبحثين عنها مش موجودة أو تم نقلها. لا تقلقي — دائماً تقدرين ترجعين للرئيسية!
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-bold text-white rounded-xl gradient-terracotta shadow-lg shadow-terracotta/20 hover:shadow-terracotta/40 transition-all hover:scale-105"
          >
            <Home className="w-4 h-4" />
            الصفحة الرئيسية
          </Link>
          <Link
            href="/services"
            className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-bold text-dark rounded-xl glass border border-border/60 hover:border-terracotta/30 hover:bg-white/80 transition-all hover:scale-105 shadow-sm"
          >
            <Scissors className="w-4 h-4" />
            تصفحي الخدمات
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
