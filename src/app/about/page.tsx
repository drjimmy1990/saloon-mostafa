import { getSupabaseClient } from "@/lib/supabase";
import { Metadata } from "next";
import { SectionHeader } from "@/components/shared/section-header";

export const metadata: Metadata = {
  title: "من نحن | صالون جاردينيا",
  description: "تعرّفي على صالون جاردينيا — خبرة سنوات في مجال التجميل والعناية بالجمال في الأردن.",
};

async function getPageContent(slug: string) {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from("CmsPage")
    .select("title, content")
    .eq("slug", slug)
    .single();
  return data;
}

export default async function AboutPage() {
  const page = await getPageContent("about");

  return (
    <div className="min-h-screen bg-cream py-12 md:py-20">
      <div className="container mx-auto max-w-4xl px-4">
        <SectionHeader title={page?.title || "من نحن"} />

        {page?.content ? (
          <div
            className="prose prose-lg max-w-none bg-white rounded-2xl p-8 shadow-sm border border-border/50"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        ) : (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-border/50 text-center">
            <p className="text-lg text-muted-foreground leading-relaxed">
              صالون جاردينيا — وجهتك الأولى للجمال والعناية في الأردن. 
              نقدم لك خدمات احترافية بأيدي خبيرات متميزات مع استخدام أفضل المنتجات العالمية.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
