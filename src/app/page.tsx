import { HeroSection } from "@/components/home/hero-section";
import { FeaturedServices } from "@/components/home/featured-services";
import { WhyUs } from "@/components/home/why-us";
import { CtaBanner } from "@/components/home/cta-banner";
import { GalleryPreview } from "@/components/home/gallery-preview";
import { AnimateInView } from "@/components/shared/animate-in-view";

export default function HomePage() {
  return (
    <>
      <HeroSection />
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
