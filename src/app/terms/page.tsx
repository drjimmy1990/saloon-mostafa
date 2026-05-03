import { getServiceRoleClient } from "@/lib/supabase";
import { Metadata } from "next";
import { SectionHeader } from "@/components/shared/section-header";

export const metadata: Metadata = {
  title: "الشروط والأحكام | صالون جاردينيا",
};

async function getPageContent(slug: string) {
  const supabase = getServiceRoleClient();
  const { data } = await supabase
    .from("CmsPage")
    .select("title, content")
    .eq("slug", slug)
    .single();
  return data;
}

export default async function TermsPage() {
  const page = await getPageContent("terms");

  return (
    <div className="min-h-screen bg-cream py-12 md:py-20">
      <div className="container mx-auto max-w-4xl px-4">
        <SectionHeader title={page?.title || "الشروط والأحكام"} />
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
