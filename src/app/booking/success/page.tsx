"use client";

import Link from "next/link";
import { Check, XCircle, CreditCard } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function BookingSuccessContent() {
  const searchParams = useSearchParams();
  
  // Paymob redirects with these query params after deposit payment
  const paymobSuccess = searchParams.get("success");
  const isFailed = paymobSuccess === "false";
  const isPaid = paymobSuccess === "true";

  if (isFailed) {
    return (
      <div className="min-h-screen bg-cream py-20" dir="rtl">
        <div className="container mx-auto max-w-lg px-4 text-center">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6 animate-fade-in-up">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-dark mb-3" style={{ fontFamily: "'Tajawal', sans-serif" }}>
            لم يتم دفع العربون ❌
          </h1>
          <p className="text-muted-foreground mb-2">عذراً، لم تتم عملية دفع العربون بنجاح.</p>
          <p className="text-sm text-muted-foreground mb-6">
            تم حفظ حجزك وسنتواصل معك لإتمام دفع العربون.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/" className="px-6 py-3 text-sm font-bold text-terracotta rounded-xl border-2 border-terracotta/20 hover:bg-terracotta hover:text-white transition-all font-arabic">
              الرئيسية
            </Link>
            <Link href="/booking" className="px-6 py-3 text-sm font-bold text-white rounded-xl gradient-terracotta hover:shadow-lg transition-all font-arabic">
              حجز جديد
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream py-20" dir="rtl">
      <div className="container mx-auto max-w-lg px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6 animate-fade-in-up">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-dark mb-3" style={{ fontFamily: "'Tajawal', sans-serif" }}>
          تم تأكيد حجزك! 🎉
        </h1>
        {isPaid && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 inline-flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-700 font-bold font-arabic">تم دفع العربون بنجاح ✓</span>
          </div>
        )}
        <p className="text-muted-foreground mb-2 font-arabic">شكراً لحجزك — سنتواصل معك قريباً لتأكيد الموعد.</p>
        <p className="text-sm text-muted-foreground mb-6 font-arabic">
          يمكنك مراجعة تفاصيل حجزك من حسابك الشخصي.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/" className="px-6 py-3 text-sm font-bold text-terracotta rounded-xl border-2 border-terracotta/20 hover:bg-terracotta hover:text-white transition-all font-arabic">
            الرئيسية
          </Link>
          <Link href="/services" className="px-6 py-3 text-sm font-bold text-white rounded-xl gradient-terracotta hover:shadow-lg transition-all font-arabic">
            تصفّحي الخدمات
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sage-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <BookingSuccessContent />
    </Suspense>
  );
}
