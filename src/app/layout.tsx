import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BottomNav } from "@/components/layout/bottom-nav";
import { WhatsAppFloat } from "@/components/shared/whatsapp-float";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "صالون جاردينيا | خدمات تجميل احترافية في الأردن",
  description:
    "احجزي خدمات التجميل من تصفيف الشعر والأظافر والمكياج. توصيل للمنزل. صالون جاردينيا — الأردن",
  openGraph: {
    title: "صالون جاردينيا",
    description:
      "خدمات تجميل احترافية — حجز أونلاين، منتجات تجميل، توصيل للمنزل",
    locale: "ar_JO",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen flex flex-col">
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
