import type { Metadata } from "next";
import { Tajawal, Cairo, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BottomNav } from "@/components/layout/bottom-nav";
import { WhatsAppFloat } from "@/components/shared/whatsapp-float";
import { Toaster } from "@/components/ui/sonner";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700", "800"],
  variable: "--font-tajawal",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-cairo",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "صالون نون | خدمات تجميل احترافية في السعودية",
  description:
    "احجزي خدمات التجميل من تصفيف الشعر والأظافر والمكياج. توصيل للمنزل. صالون نون — السعودية",
  openGraph: {
    title: "صالون نون",
    description:
      "خدمات تجميل احترافية — حجز أونلاين، منتجات تجميل، توصيل للمنزل",
    locale: "ar_SA",
    type: "website",
  },
};

export const revalidate = 60; // Revalidate layout (footer settings) every 60 seconds
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "BeautySalon",
  name: "صالون نون",
  alternateName: "Salon Noon",
  description: "صالون تجميل احترافي في السعودية — خدمات تصفيف الشعر، المكياج، الأظافر، والعناية بالبشرة",
  url: "https://gardenia-salon.com",
  telephone: "+966786753791",
  address: {
    "@type": "PostalAddress",
    addressCountry: "SA",
  },
  priceRange: "$$",
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    opens: "09:00",
    closes: "22:00",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} ${cairo.variable} ${playfair.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col font-sans">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <BottomNav />
        <WhatsAppFloat />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
