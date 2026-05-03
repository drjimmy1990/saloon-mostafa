import { getSupabaseClient } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MapPin, Home, ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

interface Props { params: Promise<{ id: string }> }

async function getService(id: string) {
  const supabase = getSupabaseClient();
  const [{ data: service }, { data: offers }] = await Promise.all([
    supabase.from("Product").select("*").eq("id", id).single(),
    supabase.from("Offer").select("*").eq("product_id", id).eq("isActive", true),
  ]);
  return { service, offer: offers?.[0] };
}

export default async function ServiceDetailPage({ params }: Props) {
  const { id } = await params;
  const { service, offer } = await getService(id);
  if (!service) notFound();

  const discountedPrice = offer
    ? offer.discountType === "percentage" ? service.price * (1 - offer.discountValue / 100) : Math.max(0, service.price - offer.discountValue)
    : service.price;

  return (
    <div className="min-h-screen bg-cream py-12 md:py-20">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Images */}
          <div className="space-y-3">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
              {service.images?.[0] ? (
                <Image src={service.images[0]} alt={service.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" priority />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><span className="text-6xl">💅</span></div>
              )}
              {offer && (
                <div className="absolute top-4 left-4">
                  <Badge className="bg-red-500 text-white border-none shadow-lg text-sm font-bold">
                    {offer.discountType === "percentage" ? `خصم ${offer.discountValue}%` : `خصم ${offer.discountValue} د.أ`}
                  </Badge>
                </div>
              )}
            </div>
            {service.images?.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {service.images.slice(1, 5).map((img: string, i: number) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                    <Image src={img} alt="" fill className="object-cover" sizes="100px" />
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-dark mb-2" style={{ fontFamily: "'Tajawal', sans-serif" }}>{service.name}</h1>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-terracotta tabular-nums">{discountedPrice.toFixed(2)}</span>
                <span className="text-sm text-muted-foreground">د.أ</span>
                {offer && <span className="text-lg text-muted-foreground line-through tabular-nums">{service.price.toFixed(2)}</span>}
              </div>
            </div>
            {service.description && <p className="text-muted-foreground leading-relaxed">{service.description}</p>}
            <div className="flex items-center gap-3">
              {service.availableAtSalon !== false && (
                <span className="inline-flex items-center gap-1.5 text-sm text-sage bg-sage/10 px-3 py-1.5 rounded-full"><MapPin className="w-4 h-4" /> في الصالون</span>
              )}
              {service.availableAtHome && (
                <span className="inline-flex items-center gap-1.5 text-sm text-terracotta bg-terracotta/10 px-3 py-1.5 rounded-full"><Home className="w-4 h-4" /> في المنزل</span>
              )}
            </div>
            <Link href={`/booking?service=${service.id}`} className="inline-flex items-center gap-2 px-8 py-4 text-lg font-bold text-white rounded-2xl gradient-terracotta shadow-xl hover:shadow-terracotta/30 transition-all hover:scale-105">
              احجزي هذه الخدمة <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
