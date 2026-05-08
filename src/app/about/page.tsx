import { getServiceRoleClient } from "@/lib/supabase";
import { Metadata } from "next";
import { SectionHeader } from "@/components/shared/section-header";
import { Heart, Award, Users, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "من نحن | صالون نون",
  description: "تعرفي على صالون نون — قصتنا، رؤيتنا، وفريقنا المتميز في عالم التجميل.",
};

async function getAboutContent() {
  const supabase = getServiceRoleClient();
  const { data } = await supabase
    .from("CmsPage")
    .select("title, content")
    .eq("slug", "about")
    .single();
  return data;
}

const highlights = [
  { icon: Clock, label: "سنوات خبرة", value: "10+", color: "bg-terracotta/10 text-terracotta" },
  { icon: Users, label: "عميلة سعيدة", value: "500+", color: "bg-sage/10 text-sage-700" },
  { icon: Award, label: "خبيرة تجميل", value: "15+", color: "bg-sand/15 text-sand-800" },
  { icon: Heart, label: "خدمة متنوعة", value: "50+", color: "bg-terracotta/10 text-terracotta-600" },
];

export default async function AboutPage() {
  const page = await getAboutContent();

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-bl from-sage/10 via-cream to-terracotta-light/10 py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-[15%] w-64 h-64 rounded-full bg-sage/5 blur-3xl" />
          <div className="absolute bottom-10 right-[10%] w-80 h-80 rounded-full bg-terracotta/5 blur-3xl" />
        </div>
        <div className="container mx-auto max-w-4xl px-4 relative z-10">
          <SectionHeader
            title="من نحن"
            subtitle="قصة شغف وإبداع في عالم الجمال"
            gradient
          />
        </div>
      </div>

      {/* Stats Highlights */}
      <div className="container mx-auto max-w-4xl px-4 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {highlights.map((item) => (
            <div
              key={item.label}
              className="bg-white rounded-2xl p-4 md:p-5 text-center shadow-sm border border-border/40 hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center mx-auto mb-2.5`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-black text-dark mb-0.5" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                {item.value}
              </div>
              <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-4xl px-4 py-12 md:py-16">
        {page?.content ? (
          <div className="bg-white rounded-2xl p-6 md:p-10 shadow-sm border border-border/40">
            <div
              className="prose prose-lg max-w-none prose-headings:text-dark prose-headings:font-black prose-headings:font-[Tajawal,sans-serif] prose-p:text-muted-foreground prose-p:leading-relaxed prose-a:text-terracotta prose-a:no-underline hover:prose-a:underline prose-strong:text-dark prose-ul:text-muted-foreground"
              dir="rtl"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-xl">سيتم إضافة المحتوى قريباً ✨</p>
          </div>
        )}
      </div>
    </div>
  );
}
