import { getSupabaseClient } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { Home, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "الخدمات | صالون جاردينيا",
  description: "تصفحي جميع خدمات التجميل المتاحة في صالون جاردينيا — تصفيف الشعر، المكياج، الأظافر، والعناية بالبشرة.",
};

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

async function getServices() {
  const supabase = getSupabaseClient();

  const [{ data: products }, { data: offers }, { data: categories }] = await Promise.all([
    supabase
      .from("Product")
      .select("*")
      .eq("isAvailable", true)
      .eq("type", "service")
      .order("sortOrder", { ascending: true }),
    supabase
      .from("Offer")
      .select("product_id, discountType, discountValue, isActive")
      .eq("isActive", true),
    supabase.from("Category").select("id, label, color").eq("type", "service").order("createdAt", { ascending: true }),
  ]);

  return {
    services: (products || []) as Product[],
    offers: (offers || []) as Offer[],
    categories: (categories || []) as Category[],
  };
}

function calculateDiscountedPrice(price: number, offer: Offer | undefined) {
  if (!offer) return price;
  if (offer.discountType === "percentage") {
    return price * (1 - offer.discountValue / 100);
  }
  return Math.max(0, price - offer.discountValue);
}

export default async function ServicesPage() {
  const { services, offers, categories } = await getServices();

  return (
    <div className="min-h-screen bg-cream py-12 md:py-20">
      <div className="container mx-auto max-w-7xl px-4">
        <SectionHeader
          title="خدماتنا"
          subtitle="اختاري الخدمة المناسبة لك واحجزي موعدك"
        />

        {/* Category filter tabs */}
        {categories.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            <Badge
              variant="secondary"
              className="px-4 py-2 cursor-pointer bg-terracotta text-white border-none text-sm"
            >
              الكل
            </Badge>
            {categories.map((cat) => (
              <Badge
                key={cat.id}
                variant="outline"
                className="px-4 py-2 cursor-pointer hover:bg-terracotta/10 text-sm"
              >
                {cat.label}
              </Badge>
            ))}
          </div>
        )}

        {/* Services grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => {
            const offer = offers.find((o) => o.product_id === service.id);
            const discountedPrice = calculateDiscountedPrice(service.price, offer);

            return (
              <div
                key={service.id}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-border/50 card-hover animate-fade-in-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {/* Image */}
                <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                  {service.images?.[0] ? (
                    <Image
                      src={service.images[0]}
                      alt={service.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-sage-light">
                      <span className="text-4xl">💅</span>
                    </div>
                  )}

                  {/* Offer badge */}
                  {offer && (
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-red-500 text-white border-none shadow-lg font-bold">
                        {offer.discountType === "percentage"
                          ? `خصم ${offer.discountValue}%`
                          : `خصم ${offer.discountValue} د.أ`}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-5">
                  <h3 className="font-bold text-lg text-dark mb-2 group-hover:text-terracotta transition-colors">
                    {service.name}
                  </h3>

                  {service.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {service.description}
                    </p>
                  )}

                  {/* Location badges */}
                  <div className="flex items-center gap-2 mb-4">
                    {service.availableAtSalon !== false && (
                      <span className="inline-flex items-center gap-1 text-xs text-sage bg-sage/10 px-2 py-1 rounded-full">
                        <MapPin className="w-3 h-3" />
                        في الصالون
                      </span>
                    )}
                    {service.availableAtHome && (
                      <span className="inline-flex items-center gap-1 text-xs text-terracotta bg-terracotta/10 px-2 py-1 rounded-full">
                        <Home className="w-3 h-3" />
                        في المنزل
                      </span>
                    )}
                  </div>

                  {/* Price + CTA */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-terracotta tabular-nums">
                        {discountedPrice.toFixed(2)}
                      </span>
                      <span className="text-xs text-muted-foreground">د.أ</span>
                      {offer && (
                        <span className="text-sm text-muted-foreground line-through tabular-nums">
                          {service.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/booking?service=${service.id}`}
                      className="px-4 py-2 text-sm font-bold text-white rounded-xl gradient-terracotta hover:shadow-lg transition-all hover:scale-105"
                    >
                      احجزي
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {services.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-xl">سيتم إضافة الخدمات قريباً ✨</p>
          </div>
        )}
      </div>
    </div>
  );
}
