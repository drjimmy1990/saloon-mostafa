"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Flower2, ArrowLeft, Phone, ShieldCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading, initialize, sendOtp, verifyOtp } = useAuthStore();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/account");
    }
  }, [isLoading, user, router]);

  const handleSendOtp = async () => {
    if (!phone.trim() || phone.trim().length < 9) {
      toast.error("يرجى إدخال رقم هاتف صحيح");
      return;
    }
    setSubmitting(true);
    const { error } = await sendOtp(phone);
    setSubmitting(false);

    if (error) {
      toast.error("فشل إرسال رمز التحقق. تأكدي من الرقم وحاولي مرة أخرى.");
      console.error("OTP error:", error);
      return;
    }

    toast.success("تم إرسال رمز التحقق إلى هاتفك 📱");
    setStep("otp");
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.trim().length < 6) {
      toast.error("يرجى إدخال رمز التحقق المكون من 6 أرقام");
      return;
    }
    setSubmitting(true);
    const { error } = await verifyOtp(phone, otp);
    setSubmitting(false);

    if (error) {
      toast.error("رمز التحقق غير صحيح. حاولي مرة أخرى.");
      console.error("Verify error:", error);
      return;
    }

    toast.success("تم تسجيل الدخول بنجاح! 🌸");
    router.replace("/account");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream py-12 md:py-20">
      <div className="container mx-auto max-w-md px-4">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-terracotta to-terracotta/80 flex items-center justify-center shadow-lg shadow-terracotta/20 mb-4">
            <Flower2 className="w-8 h-8 text-white" />
          </div>
          <h1
            className="text-2xl font-bold text-dark"
            style={{ fontFamily: "'Tajawal', sans-serif" }}
          >
            تسجيل الدخول
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            سجلي لحفظ حجوزاتك ومتابعة طلباتك
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-border/50 space-y-6">
          {step === "phone" ? (
            <>
              {/* Phone Step */}
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-terracotta/10 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-terracotta" />
                </div>
                <div>
                  <h2 className="font-bold text-base">رقم الهاتف</h2>
                  <p className="text-xs text-muted-foreground">
                    سنرسل لكِ رمز تحقق عبر SMS
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">رقم الهاتف</Label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0790000000"
                  dir="ltr"
                  className="text-lg tracking-wider tabular-nums h-12"
                  onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                />
                <p className="text-xs text-muted-foreground">
                  مثال: 0790000000 أو 962790000000
                </p>
              </div>

              <button
                onClick={handleSendOtp}
                disabled={submitting || !phone.trim()}
                className="w-full px-6 py-3.5 text-base font-bold text-white rounded-xl gradient-terracotta shadow-lg shadow-terracotta/20 hover:shadow-terracotta/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "إرسال رمز التحقق"
                )}
              </button>
            </>
          ) : (
            <>
              {/* OTP Step */}
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="font-bold text-base">رمز التحقق</h2>
                  <p className="text-xs text-muted-foreground">
                    أدخلي الرمز المرسل إلى {phone}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">رمز التحقق (6 أرقام)</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  dir="ltr"
                  className="text-2xl text-center tracking-[0.5em] tabular-nums h-14 font-mono"
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                  autoFocus
                />
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={submitting || otp.length < 6}
                className="w-full px-6 py-3.5 text-base font-bold text-white rounded-xl gradient-terracotta shadow-lg shadow-terracotta/20 hover:shadow-terracotta/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "تأكيد الدخول ✨"
                )}
              </button>

              <button
                onClick={() => { setStep("phone"); setOtp(""); }}
                className="w-full text-sm text-muted-foreground hover:text-terracotta transition-colors flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                تغيير رقم الهاتف
              </button>
            </>
          )}
        </div>

        {/* Guest note */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          لا تحتاجين حساب للحجز أو الشراء.{" "}
          <Link href="/booking" className="text-terracotta hover:underline">
            احجزي كضيفة
          </Link>
        </p>
      </div>
    </div>
  );
}
