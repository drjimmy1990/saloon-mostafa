"use client";

import { useCartStore, CartItem } from "@/lib/cart-store";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const getTotal = useCartStore((s) => s.getTotal);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-cream py-20">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-40 mx-auto" />
            <div className="h-4 bg-muted rounded w-60 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-cream py-20">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-dark mb-3" style={{ fontFamily: "'Tajawal', sans-serif" }}>
            سلة التسوق فارغة
          </h1>
          <p className="text-muted-foreground mb-8">لم تضيفي أي منتجات بعد. تصفّحي منتجاتنا وأضيفي ما يعجبك!</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white rounded-xl gradient-terracotta hover:shadow-lg transition-all"
          >
            تصفّحي المنتجات
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream py-12 md:py-20">
      <div className="container mx-auto max-w-3xl px-4">
        <h1 className="text-3xl font-bold text-dark mb-8" style={{ fontFamily: "'Tajawal', sans-serif" }}>
          سلة التسوق
        </h1>

        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-border/50"
            >
              {/* Image */}
              <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">🧴</div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-dark line-clamp-1">{item.name}</h3>
                <p className="text-sm text-terracotta font-bold tabular-nums mt-1">
                  {item.price.toFixed(2)} د.أ
                </p>

                {/* Qty controls */}
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => updateQty(item.productId, item.qty - 1)}
                    className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-terracotta/10 transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-bold tabular-nums w-6 text-center">{item.qty}</span>
                  <button
                    onClick={() => updateQty(item.productId, item.qty + 1)}
                    className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-terracotta/10 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Total + Remove */}
              <div className="flex flex-col items-end gap-2">
                <span className="text-base font-black text-dark tabular-nums">
                  {(item.price * item.qty).toFixed(2)} د.أ
                </span>
                <button
                  onClick={() => removeItem(item.productId)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm border border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground">المجموع الفرعي</span>
            <span className="font-bold tabular-nums">{getTotal().toFixed(2)} د.أ</span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground">رسوم التوصيل</span>
            <span className="text-sm text-muted-foreground">تُحسب عند الدفع</span>
          </div>
          <Separator className="mb-4" />
          <div className="flex items-center justify-between mb-6">
            <span className="text-lg font-bold">الإجمالي</span>
            <span className="text-xl font-black text-terracotta tabular-nums">
              {getTotal().toFixed(2)} د.أ
            </span>
          </div>
          <Link
            href="/checkout"
            className="w-full flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-white rounded-2xl gradient-terracotta shadow-lg hover:shadow-terracotta/30 transition-all hover:scale-[1.02]"
          >
            أكملي الطلب
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
