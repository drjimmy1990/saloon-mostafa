import { getSupabaseClient } from "@/lib/supabase";
import Image from "next/image";
import { Metadata } from "next";
import { SectionHeader } from "@/components/shared/section-header";

export const metadata: Metadata = {
  title: "المعرض | صالون جاردينيا",
  description: "شاهدي أحدث أعمالنا في تصفيف الشعر والمكياج والأظافر — صالون جاردينيا",
};

interface GalleryItem {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
}

async function getGalleryItems(): Promise<GalleryItem[]> {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from("Gallery")
    .select("*")
    .order("sortOrder", { ascending: true });
  return data || [];
}

export default async function GalleryPage() {
  const items = await getGalleryItems();

  // Extract unique categories
  const categories = Array.from(new Set(items.map((i) => i.category).filter(Boolean)));

  return (
    <div className="min-h-screen bg-cream py-12 md:py-20">
      <div className="container mx-auto max-w-7xl px-4">
        <SectionHeader
          title="معرض أعمالنا"
          subtitle="لمحة عن إبداعاتنا في عالم التجميل"
        />

        {/* Category tabs */}
        {categories.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            <span className="px-4 py-2 text-sm font-medium bg-terracotta text-white rounded-full cursor-pointer">
              الكل
            </span>
            {categories.map((cat) => (
              <span
                key={cat}
                className="px-4 py-2 text-sm font-medium text-muted-foreground bg-white border rounded-full cursor-pointer hover:bg-terracotta/10 transition-colors"
              >
                {cat}
              </span>
            ))}
          </div>
        )}

        {items.length > 0 ? (
          <div className="masonry-grid">
            {items.map((item, i) => (
              <div
                key={item.id}
                className="group relative rounded-2xl overflow-hidden shadow-sm card-hover animate-fade-in-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="relative aspect-[3/4]">
                  <Image
                    src={item.imageUrl}
                    alt={item.title || "عمل من أعمال جاردينيا"}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 50vw, 33vw"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.title && <p className="text-sm font-bold">{item.title}</p>}
                    {item.category && (
                      <p className="text-xs text-white/70 mt-0.5">{item.category}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-xl">سيتم إضافة أعمالنا قريباً ✨</p>
          </div>
        )}
      </div>
    </div>
  );
}
