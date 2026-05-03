import Link from "next/link";
import { Check } from "lucide-react";

export default function SuccessPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  return (
    <div className="min-h-screen bg-cream py-20">
      <div className="container mx-auto max-w-lg px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6 animate-fade-in-up">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-dark mb-3" style={{ fontFamily: "'Tajawal', sans-serif" }}>
          تم تأكيد طلبك! 🎉
        </h1>
        <p className="text-muted-foreground mb-6">شكراً لطلبك — سنتواصل معك قريباً لتأكيد التوصيل.</p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/" className="px-6 py-3 text-sm font-bold text-terracotta rounded-xl border-2 border-terracotta/20 hover:bg-terracotta hover:text-white transition-all">الرئيسية</Link>
          <Link href="/products" className="px-6 py-3 text-sm font-bold text-white rounded-xl gradient-terracotta hover:shadow-lg transition-all">تسوّقي المزيد</Link>
        </div>
      </div>
    </div>
  );
}
