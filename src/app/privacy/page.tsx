import { getSupabaseClient } from "@/lib/supabase";
import { Metadata } from "next";
import { SectionHeader } from "@/components/shared/section-header";

export const metadata: Metadata = {
  title: "سياسة الخصوصية | صالون جاردينيا",
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

export default async function PrivacyPage() {
  const page = await getPageContent("privacy");

  return (
    <div className="min-h-screen bg-cream py-12 md:py-20">
      <div className="container mx-auto max-w-4xl px-4">
        <SectionHeader title={page?.title || "سياسة الخصوصية"} />
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-border/50">
          {page?.content ? (
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          ) : (
            <p className="text-muted-foreground text-center">سيتم إضافة المحتوى قريباً.</p>
          )}
        </div>
      </div>
    </div>
  );
}
