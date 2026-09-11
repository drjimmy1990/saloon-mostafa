import { getServiceRoleClient } from "@/lib/supabase";
import { HeroSection } from "@/components/home/hero-section";
import { FeaturedServices } from "@/components/home/featured-services";
import { WhyUs } from "@/components/home/why-us";
import { CtaBanner } from "@/components/home/cta-banner";
import { GalleryPreview } from "@/components/home/gallery-preview";
import { AnimateInView } from "@/components/shared/animate-in-view";

export const revalidate = 300; // ISR: revalidate every 5 minutes

async function getHeroImages() {
  try {
    const supabase = getServiceRoleClient();
    const { data } = await supabase
      .from("SystemSetting")
      .select("key, value")
      .in("key", ["hero_image_1", "hero_image_2", "hero_image_3"]);

    const settings: Record<string, string> = {};
    for (const row of data || []) {
      settings[row.key] = row.value;
    }

    return {
      hero_image_1: settings.hero_image_1 || "/images/hero/hero_salon_1.png",
      hero_image_2: settings.hero_image_2 || "/images/hero/hero_salon_2.png",
      hero_image_3: settings.hero_image_3 || "/images/hero/hero_salon_3.png",
    };
  } catch (error) {
    console.error("Failed to load hero images on server:", error);
    return {
      hero_image_1: "/images/hero/hero_salon_1.png",
      hero_image_2: "/images/hero/hero_salon_2.png",
      hero_image_3: "/images/hero/hero_salon_3.png",
    };
  }
}

export default async function HomePage() {
  const heroImages = await getHeroImages();

  return (
    <>
      <HeroSection initialImages={heroImages} />
      <AnimateInView>
        <FeaturedServices />
      </AnimateInView>
      <AnimateInView delay={0.1}>
        <WhyUs />
      </AnimateInView>
      <AnimateInView delay={0.1}>
        <GalleryPreview />
      </AnimateInView>
      <AnimateInView>
        <CtaBanner />
      </AnimateInView>
    </>
  );
}

