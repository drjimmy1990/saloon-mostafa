import { getServiceRoleClient } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  isAvailable: boolean;
}

async function getFeaturedServices(): Promise<Product[]> {
  const supabase = getServiceRoleClient();
  const { data } = await supabase
    .from("Product")
    .select("id, name, price, images, isAvailable")
    .eq("isAvailable", true)
    .eq("type", "service")
    .order("sortOrder", { ascending: true })
    .limit(8);
  return data || [];
}

export async function FeaturedServices() {
  const services = await getFeaturedServices();

  if (services.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-24 bg-white relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-terracotta/3 blur-3xl -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-sage/3 blur-3xl translate-y-1/2" />

      <div className="container mx-auto max-w-7xl px-4 relative z-10">
        <SectionHeader
          title="خدماتنا المميزة"
          subtitle="اكتشفي مجموعة واسعة من خدمات التجميل الاحترافية"
        />

        {/* Mobile: horizontal scroll / Desktop: grid */}
        <div className="flex md:grid md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 overflow-x-auto md:overflow-visible scrollbar-hide snap-x-mandatory pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
          {services.map((service, i) => (
            <Link
              key={service.id}
              href={`/services/${service.id}`}
              className="group card-premium flex-shrink-0 w-[72vw] sm:w-[45vw] md:w-auto snap-center"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                {service.images?.[0] ? (
                  <Image
                    src={service.images[0]}
                    alt={service.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    sizes="(max-width: 768px) 72vw, (max-width: 1024px) 33vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-sage-light">
                    <span className="text-4xl">✨</span>
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end p-4">
                  <span className="text-white text-sm font-bold flex items-center gap-1">
                    احجزي الآن
                    <ArrowLeft className="w-4 h-4" />
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-bold text-sm md:text-base text-dark line-clamp-1 group-hover:text-terracotta transition-colors">
                  {service.name}
                </h3>
                <div className="flex items-center justify-between mt-2.5">
                  <Badge
                    variant="secondary"
                    className="bg-terracotta/8 text-terracotta border-none text-xs tabular-nums font-bold"
                  >
                    {Number(service.price ?? 0).toFixed(2)} ر.س
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    ابتداءً من
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* View all */}
        <div className="text-center mt-10">
          <Link
            href="/services"
            className="group inline-flex items-center gap-2 px-8 py-3.5 text-sm font-bold text-terracotta rounded-xl border-2 border-terracotta/20 hover:bg-terracotta hover:text-white hover:border-terracotta transition-all duration-300"
          >
            عرض جميع الخدمات
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
