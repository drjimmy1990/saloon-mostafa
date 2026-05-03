import { getServiceRoleClient } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import { SectionHeader } from "@/components/shared/section-header";
import { ArrowLeft, ZoomIn } from "lucide-react";

interface GalleryItem {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
}

async function getGalleryItems(): Promise<GalleryItem[]> {
  const supabase = getServiceRoleClient();
  const { data } = await supabase
    .from("Gallery")
    .select("id, title, imageUrl, category")
    .order("createdAt", { ascending: false })
    .limit(6);
  return data || [];
}

export async function GalleryPreview() {
  const items = await getGalleryItems();

  if (items.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container mx-auto max-w-7xl px-4">
        <SectionHeader
          title="من أعمالنا"
          subtitle="لمحة عن إبداعاتنا وتجارب عملائنا"
        />

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
          {items.map((item, i) => (
            <div
              key={item.id}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-muted animate-fade-in-up cursor-pointer"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <Image
                src={item.imageUrl}
                alt={item.title || "Gallery"}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-end p-4">
                <ZoomIn className="w-8 h-8 text-white/80 mb-2 transform scale-75 group-hover:scale-100 transition-transform duration-500" />
                {item.title && (
                  <span className="text-white text-sm font-bold text-center line-clamp-1">{item.title}</span>
                )}
                {item.category && (
                  <span className="text-white/60 text-xs mt-0.5">{item.category}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* View all */}
        <div className="text-center mt-10">
          <Link
            href="/gallery"
            className="group inline-flex items-center gap-2 px-8 py-3.5 text-sm font-bold text-terracotta rounded-xl border-2 border-terracotta/20 hover:bg-terracotta hover:text-white hover:border-terracotta transition-all duration-300"
          >
            عرض المعرض كاملاً
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
