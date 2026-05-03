import { getServiceRoleClient } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import { SectionHeader } from "@/components/shared/section-header";

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
    .order("sortOrder", { ascending: true })
    .limit(6);
  return data || [];
}

export async function GalleryPreview() {
  const items = await getGalleryItems();

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto max-w-7xl px-4">
        <SectionHeader
          title="من أعمالنا"
          subtitle="شاهدي أحدث أعمالنا في عالم التجميل والعناية"
        />

        {items.length > 0 ? (
          <div className="masonry-grid">
            {items.map((item, i) => (
              <div
                key={item.id}
                className="group relative rounded-2xl overflow-hidden shadow-sm card-hover animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="relative aspect-[3/4]">
                  <Image
                    src={item.imageUrl}
                    alt={item.title || "عمل من أعمال جاردينيا"}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  {item.title && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-sm font-medium">{item.title}</p>
                      {item.category && (
                        <p className="text-xs text-white/70 mt-0.5">{item.category}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">سيتم إضافة أعمالنا قريباً ✨</p>
          </div>
        )}

        <div className="text-center mt-10">
          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-terracotta rounded-xl border-2 border-terracotta/20 hover:bg-terracotta hover:text-white transition-all"
          >
            شاهدي المزيد
          </Link>
        </div>
      </div>
    </section>
  );
}
