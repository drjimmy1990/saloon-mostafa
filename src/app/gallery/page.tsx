import { getServiceRoleClient } from "@/lib/supabase";
import { Metadata } from "next";
import { SectionHeader } from "@/components/shared/section-header";
import { GalleryClient } from "./gallery-client";

export const revalidate = 300; // ISR: revalidate every 5 minutes

export const metadata: Metadata = {
  title: "المعرض | صالون نون",
  description: "شاهدي أحدث أعمالنا في تصفيف الشعر والمكياج والأظافر — صالون نون",
};

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

        <GalleryClient items={items} categories={categories} />
      </div>
    </div>
  );
}
