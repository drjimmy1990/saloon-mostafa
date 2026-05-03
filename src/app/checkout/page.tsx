"use client";
import { useState, useEffect } from "react";
import { useCartStore } from "@/lib/cart-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { CreditCard, Banknote, Smartphone } from "lucide-react";

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const getTotal = useCartStore((s) => s.getTotal);
  const clearCart = useCartStore((s) => s.clearCart);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [payment, setPayment] = useState<"cash"|"cliq"|"card">("cash");
  const [loading, setLoading] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(2);

  useEffect(() => {
    setMounted(true);
    // Fetch delivery fee from settings
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.delivery_fee) setDeliveryFee(Number(data.delivery_fee) || 2);
      })
      .catch(() => {});
  }, []);

  if (!mounted) return <div className="min-h-screen bg-cream py-20"><div className="container mx-auto max-w-2xl px-4"><div className="animate-pulse h-8 bg-muted rounded w-40 mx-auto"/></div></div>;

  if (items.length === 0) { router.push("/cart"); return null; }

  const subtotal = getTotal();
  const total = subtotal + deliveryFee;

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) { toast.error("يرجى تعبئة جميع الحقول المطلوبة"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name, customerPhone: phone, customerAddress: address,
          items: items.map(i => ({ productId: i.productId, name: i.name, price: i.price, qty: i.qty })),
          subtotal, deliveryFee, total, paymentMethod: payment, notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (payment === "card" && data.orderId) {
        const payRes = await fetch("/api/payment/intent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: data.orderId }) });
        const payData = await payRes.json();
        if (payData.iframeUrl) { window.location.href = payData.iframeUrl; return; }
      }
      clearCart();
      router.push(`/checkout/success?code=${data.orderCode || ""}`);
    } catch { toast.error("حدث خطأ. يرجى المحاولة مرة أخرى."); }
    finally { setLoading(false); }
  };

  const methods = [
    { id: "cash" as const, label: "نقداً عند التوصيل", icon: Banknote, desc: "ادفعي عند الاستلام" },
    { id: "cliq" as const, label: "كليك CliQ", icon: Smartphone, desc: "تحويل بنكي" },
    { id: "card" as const, label: "بطاقة ائتمان", icon: CreditCard, desc: "عبر Paymob" },
  ];

  return (
    <div className="min-h-screen bg-cream py-12 md:py-20">
      <div className="container mx-auto max-w-2xl px-4">
        <h1 className="text-3xl font-bold text-dark text-center mb-8" style={{ fontFamily: "'Tajawal', sans-serif" }}>إتمام الطلب</h1>
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-border/50 space-y-4">
            <h2 className="font-bold text-lg">بياناتك</h2>
            <div><Label className="text-sm mb-1 block">الاسم الكامل *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="سارة أحمد"/></div>
            <div><Label className="text-sm mb-1 block">رقم الهاتف *</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="0790000000" dir="ltr"/></div>
            <div><Label className="text-sm mb-1 block">عنوان التوصيل</Label><Input value={address} onChange={e => setAddress(e.target.value)} placeholder="شارع مكة، عمّان..."/></div>
            <div><Label className="text-sm mb-1 block">ملاحظات</Label><Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="ملاحظات إضافية..."/></div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-border/50 space-y-3">
            <h2 className="font-bold text-lg">طريقة الدفع</h2>
            {methods.map(m => (
              <button key={m.id} onClick={() => setPayment(m.id)} className={cn("w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-right", payment === m.id ? "border-terracotta bg-terracotta/5" : "border-border hover:border-terracotta/30")}>
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", payment === m.id ? "bg-terracotta text-white" : "bg-muted text-muted-foreground")}><m.icon className="w-5 h-5"/></div>
                <div><span className="font-bold text-sm block">{m.label}</span><span className="text-xs text-muted-foreground">{m.desc}</span></div>
              </button>
            ))}
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-border/50">
            <h2 className="font-bold text-lg mb-4">ملخص الطلب</h2>
            {items.map(i => (<div key={i.productId} className="flex justify-between text-sm mb-2"><span>{i.name} × {i.qty}</span><span className="tabular-nums">{(i.price * i.qty).toFixed(2)} د.أ</span></div>))}
            <Separator className="my-3"/>
            <div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">المجموع الفرعي</span><span className="tabular-nums">{subtotal.toFixed(2)} د.أ</span></div>
            <div className="flex justify-between text-sm mb-3"><span className="text-muted-foreground">رسوم التوصيل</span><span className="tabular-nums">{deliveryFee.toFixed(2)} د.أ</span></div>
            <Separator className="my-3"/>
            <div className="flex justify-between text-lg font-bold"><span>الإجمالي</span><span className="text-terracotta tabular-nums">{total.toFixed(2)} د.أ</span></div>
            <button onClick={handleSubmit} disabled={loading} className="w-full mt-6 px-8 py-4 text-base font-bold text-white rounded-2xl gradient-terracotta shadow-lg hover:shadow-terracotta/30 transition-all disabled:opacity-50">
              {loading ? "جاري إنشاء الطلب..." : "تأكيد الطلب ✨"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
