import { HeroSection } from "@/components/home/hero-section";
import { FeaturedServices } from "@/components/home/featured-services";
import { WhyUs } from "@/components/home/why-us";
import { CtaBanner } from "@/components/home/cta-banner";
import { GalleryPreview } from "@/components/home/gallery-preview";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturedServices />
      <WhyUs />
      <GalleryPreview />
      <CtaBanner />
    </>
  );
}
