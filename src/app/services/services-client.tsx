"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { SectionHeader } from "@/components/shared/section-header";
import { Grid3X3 } from "lucide-react";

interface Category {
  id: string;
  label: string;
  color: string;
  image?: string | null;
}

export function ServicesClient({
  categories,
  serviceCounts,
}: {
  categories: Category[];
  serviceCounts: Record<string, number>;
}) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero banner */}
      <div className="relative bg-gradient-to-bl from-sage/10 via-cream to-terracotta-light/30 py-16 md:py-24">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 right-[15%] w-64 h-64 rounded-full bg-terracotta/5 blur-3xl" />
          <div className="absolute bottom-10 left-[10%] w-80 h-80 rounded-full bg-sage/5 blur-3xl" />
        </div>
        <div className="container mx-auto max-w-7xl px-4 relative z-10">
          <SectionHeader
            title="خدماتنا"
            subtitle="اختاري الخدمة المناسبة لك واحجزي موعدك بسهولة"
            gradient
          />
        </div>
      </div>

      {/* Category Cards Grid */}
      <div className="container mx-auto max-w-5xl px-4 py-10 md:py-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
          {categories.map((cat, i) => {
            const count = serviceCounts[cat.id] || 0;
            return (
              <button
                key={cat.id}
                onClick={() => router.push("/booking")}
                className="group card-premium text-right animate-fade-in-up cursor-pointer"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-sage-50">
                  {cat.image ? (
                    <Image
                      src={cat.image}
                      alt={cat.label}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-sage-light">
                      <Grid3X3 className="w-12 h-12 text-sage-300" />
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end justify-center pb-5">
                    <span className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-black bg-[#D3D3D3] rounded-xl shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                      احجزي الآن
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 md:p-5 text-center">
                  <h3 className="font-bold text-lg text-dark mb-1 group-hover:text-terracotta transition-colors">
                    {cat.label}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {count} خدمة
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">✨</div>
            <p className="text-xl text-muted-foreground font-medium">
              سيتم إضافة الخدمات قريباً
            </p>
            <p className="text-sm text-muted-foreground/60 mt-2">نعمل على تجهيز أفضل الخدمات لك</p>
          </div>
        )}
      </div>
    </div>
  );
}
