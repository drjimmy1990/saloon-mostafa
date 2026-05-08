"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Flower2, RefreshCw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-cream relative overflow-hidden">
      <div className="absolute top-10 left-[10%] w-72 h-72 rounded-full bg-sage/5 blur-3xl animate-float" />

      <div className="text-center px-6 max-w-md relative z-10 animate-fade-in-up">
        {/* Logo */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sage to-sage/80 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-sage/20">
          <Flower2 className="w-8 h-8 text-white" />
        </div>

        <h1 className="text-2xl font-bold text-dark mb-3" style={{ fontFamily: "'Tajawal', sans-serif" }}>
          حدث خطأ غير متوقع
        </h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          نعتذر عن هذا الخطأ. حاولي مرة أخرى أو ارجعي للصفحة الرئيسية.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-bold text-white rounded-xl gradient-terracotta shadow-lg shadow-terracotta/20 hover:shadow-terracotta/40 transition-all hover:scale-105"
          >
            <RefreshCw className="w-4 h-4" />
            حاولي مرة أخرى
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-bold text-dark rounded-xl glass border border-border/60 hover:border-terracotta/30 hover:bg-white/80 transition-all hover:scale-105 shadow-sm"
          >
            <Home className="w-4 h-4" />
            الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
