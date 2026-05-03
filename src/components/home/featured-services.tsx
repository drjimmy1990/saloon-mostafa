import { getSupabaseClient } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  isAvailable: boolean;
}

async function getFeaturedServices(): Promise<Product[]> {
  const supabase = getSupabaseClient();
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
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto max-w-7xl px-4">
        <SectionHeader
          title="خدماتنا المميزة"
          subtitle="اكتشفي مجموعة واسعة من خدمات التجميل الاحترافية"
        />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {services.map((service, i) => (
            <Link
              key={service.id}
              href={`/services/${service.id}`}
              className="group card-hover rounded-2xl overflow-hidden bg-white border border-border/50 shadow-sm animate-fade-in-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                {service.images?.[0] ? (
                  <Image
                    src={service.images[0]}
                    alt={service.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-sage-light">
                    <span className="text-3xl">✨</span>
                  </div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Info */}
              <div className="p-3 md:p-4">
                <h3 className="font-bold text-sm md:text-base text-dark line-clamp-1 group-hover:text-terracotta transition-colors">
                  {service.name}
                </h3>
                <div className="flex items-center justify-between mt-2">
                  <Badge
                    variant="secondary"
                    className="bg-terracotta/10 text-terracotta border-none text-xs tabular-nums"
                  >
                    {service.price.toFixed(2)} د.أ
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
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-terracotta rounded-xl border-2 border-terracotta/20 hover:bg-terracotta hover:text-white transition-all"
          >
            عرض جميع الخدمات
          </Link>
        </div>
      </div>
    </section>
  );
}
