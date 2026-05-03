import Link from "next/link";
import { X } from "lucide-react";

export default function FailurePage() {
  return (
    <div className="min-h-screen bg-cream py-20">
      <div className="container mx-auto max-w-lg px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6 animate-fade-in-up">
          <X className="w-10 h-10 text-red-600" />
        </div>
        <h1 className="text-3xl font-bold text-dark mb-3" style={{ fontFamily: "'Tajawal', sans-serif" }}>فشل الدفع 😔</h1>
        <p className="text-muted-foreground mb-6">لم يتم إتمام عملية الدفع. يمكنك المحاولة مرة أخرى أو اختيار طريقة دفع مختلفة.</p>
        <Link href="/checkout" className="px-6 py-3 text-sm font-bold text-white rounded-xl gradient-terracotta hover:shadow-lg transition-all">حاولي مرة أخرى</Link>
      </div>
    </div>
  );
}
