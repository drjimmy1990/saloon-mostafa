"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { Home, MapPin, ArrowLeft } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  isAvailable: boolean;
  stock: number | null;
  availableAtHome?: boolean;
  availableAtSalon?: boolean;
}

interface Offer {
  discountType: string;
  discountValue: number;
  isActive: boolean;
  product_id: string;
}

interface Category {
  id: string;
  label: string;
  color: string;
}

function calculateDiscountedPrice(price: number, offer: Offer | undefined) {
  const safePrice = Number(price) || 0;
  if (!offer) return safePrice;
  if (offer.discountType === "percentage") {
    return safePrice * (1 - Number(offer.discountValue) / 100);
  }
  return Math.max(0, safePrice - Number(offer.discountValue));
}

export function ServicesClient({
  services,
  offers,
  categories,
}: {
  services: Product[];
  offers: Offer[];
  categories: Category[];
}) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredServices = activeCategory
    ? services.filter((s) => s.category === activeCategory)
    : services;

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

          {/* Category filter tabs */}
          {categories.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => setActiveCategory(null)}
                className={`inline-flex items-center px-5 py-2.5 rounded-full text-sm font-bold transition-all cursor-pointer border ${
                  activeCategory === null
                    ? "bg-terracotta text-white border-terracotta shadow-sm shadow-terracotta/20"
                    : "bg-white/60 text-gray-600 border-gray-200 hover:bg-terracotta/10 hover:border-terracotta/30"
                }`}
              >
                الكل
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`inline-flex items-center px-5 py-2.5 rounded-full text-sm font-bold transition-all cursor-pointer border ${
                    activeCategory === cat.id
                      ? "bg-terracotta text-white border-terracotta shadow-sm shadow-terracotta/20"
                      : "bg-white/60 text-gray-600 border-gray-200 hover:bg-terracotta/10 hover:border-terracotta/30"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Services grid */}
      <div className="container mx-auto max-w-7xl px-4 py-10 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-7">
          {filteredServices.map((service, i) => {
            const offer = offers.find((o) => o.product_id === service.id);
            const discountedPrice = calculateDiscountedPrice(service.price, offer);

            return (
              <div
                key={service.id}
                className="group card-premium animate-fade-in-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  {service.images?.[0] ? (
                    <Image
                      src={service.images[0]}
                      alt={service.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-sage-light">
                      <span className="text-5xl">💅</span>
                    </div>
                  )}

                  {/* Offer badge */}
                  {offer && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-red-500 text-white border-none shadow-lg font-bold text-xs px-3 py-1">
                        {offer.discountType === "percentage"
                          ? `خصم ${offer.discountValue}%`
                          : `خصم ${offer.discountValue} ر.س`}
                      </Badge>
                    </div>
                  )}

                  {/* Quick book overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end justify-center pb-5">
                    <Link
                      href={`/booking?service=${service.id}`}
                      className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-terracotta/90 backdrop-blur-sm rounded-xl shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-500"
                    >
                      احجزي الآن
                      <ArrowLeft className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* Info */}
                <div className="p-5 md:p-6 text-right">
                  <Link href={`/services/${service.id}`}>
                    <h3 className="font-bold text-lg text-dark mb-2 group-hover:text-terracotta transition-colors">
                      {service.name}
                    </h3>
                  </Link>

                  {service.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                      {service.description}
                    </p>
                  )}

                  {/* Location badges */}
                  <div className="flex items-center gap-2 mb-5">
                    {service.availableAtSalon !== false && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-sage bg-sage/8 px-3 py-1.5 rounded-full font-medium">
                        <MapPin className="w-3 h-3" />
                        في الصالون
                      </span>
                    )}
                    {service.availableAtHome && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-terracotta bg-terracotta/8 px-3 py-1.5 rounded-full font-medium">
                        <Home className="w-3 h-3" />
                        في المنزل
                      </span>
                    )}
                  </div>

                  {/* Price + CTA */}
                  <div className="flex items-center justify-between pt-4 border-t border-border/50" dir="rtl">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-terracotta tabular-nums">
                        {Number(discountedPrice ?? 0).toFixed(2)}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">ر.س</span>
                      {offer && (
                        <span className="text-sm text-muted-foreground line-through tabular-nums">
                          {Number(service.price ?? 0).toFixed(2)}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/booking?service=${service.id}`}
                      className="px-5 py-2.5 text-sm font-bold text-white rounded-xl gradient-terracotta shadow-sm shadow-terracotta/20 hover:shadow-terracotta/40 transition-all hover:scale-105 active:scale-100"
                    >
                      احجزي
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">✨</div>
            <p className="text-xl text-muted-foreground font-medium">
              {activeCategory ? "لا توجد خدمات في هذه الفئة" : "سيتم إضافة الخدمات قريباً"}
            </p>
            <p className="text-sm text-muted-foreground/60 mt-2">نعمل على تجهيز أفضل الخدمات لك</p>
          </div>
        )}
      </div>
    </div>
  );
}
