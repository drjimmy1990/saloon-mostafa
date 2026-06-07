"use client";

import Link from "next/link";
import { Check, XCircle, Clock } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  
  // Paymob redirects with these query params after payment
  const paymobSuccess = searchParams.get("success");
  const merchantOrderId = searchParams.get("merchant_order_id");
  const orderCode = searchParams.get("code");

  // Determine payment status
  const isPaid = paymobSuccess === "true";
  const isFailed = paymobSuccess === "false";
  const isCashOrder = !paymobSuccess; // No paymob params = cash/cliq order

  if (isFailed) {
    return (
      <div className="min-h-screen bg-cream py-20">
        <div className="container mx-auto max-w-lg px-4 text-center">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6 animate-fade-in-up">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-dark mb-3" style={{ fontFamily: "'Tajawal', sans-serif" }}>
            لم يتم الدفع ❌
          </h1>
          <p className="text-muted-foreground mb-2">عذراً، لم تتم عملية الدفع بنجاح.</p>
          <p className="text-sm text-muted-foreground mb-6">تم حفظ طلبك وسنتواصل معك لإتمام الدفع.</p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/" className="px-6 py-3 text-sm font-bold text-terracotta rounded-xl border-2 border-terracotta/20 hover:bg-terracotta hover:text-white transition-all">
              الرئيسية
            </Link>
            <Link href="/products" className="px-6 py-3 text-sm font-bold text-white rounded-xl gradient-terracotta hover:shadow-lg transition-all">
              تسوّقي المزيد
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream py-20">
      <div className="container mx-auto max-w-lg px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6 animate-fade-in-up">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-dark mb-3" style={{ fontFamily: "'Tajawal', sans-serif" }}>
          تم تأكيد طلبك! 🎉
        </h1>
        {isPaid && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 inline-flex items-center gap-2">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-700 font-bold">تم الدفع بنجاح</span>
          </div>
        )}
        {isCashOrder && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 inline-flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <span className="text-sm text-amber-700 font-bold">الدفع عند الاستلام</span>
          </div>
        )}
        {orderCode && (
          <p className="text-muted-foreground mb-2">رقم الطلب: <strong dir="ltr">{orderCode}</strong></p>
        )}
        <p className="text-muted-foreground mb-6">شكراً لطلبك — سنتواصل معك قريباً لتأكيد التوصيل.</p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/" className="px-6 py-3 text-sm font-bold text-terracotta rounded-xl border-2 border-terracotta/20 hover:bg-terracotta hover:text-white transition-all">
            الرئيسية
          </Link>
          <Link href="/products" className="px-6 py-3 text-sm font-bold text-white rounded-xl gradient-terracotta hover:shadow-lg transition-all">
            تسوّقي المزيد
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sage-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
