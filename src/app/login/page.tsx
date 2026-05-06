"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Flower2, Mail, Lock, Loader2, UserPlus, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading, initialize, signIn, signUp } = useAuthStore();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/account");
    }
  }, [isLoading, user, router]);

  const handleLogin = async () => {
    if (!email.trim()) {
      toast.error("يرجى إدخال البريد الإلكتروني");
      return;
    }
    if (!password || password.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);

    if (error) {
      if (error.includes("Invalid login")) {
        toast.error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      } else {
        toast.error("فشل تسجيل الدخول. حاولي مرة أخرى.");
      }
      console.error("Login error:", error);
      return;
    }

    toast.success("تم تسجيل الدخول بنجاح! 🌸");
    router.replace("/account");
  };

  const handleSignUp = async () => {
    if (!email.trim()) {
      toast.error("يرجى إدخال البريد الإلكتروني");
      return;
    }
    if (!password || password.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("كلمة المرور غير متطابقة");
      return;
    }

    setSubmitting(true);
    const { error } = await signUp(email, password);
    setSubmitting(false);

    if (error) {
      if (error.includes("already registered")) {
        toast.error("هذا البريد مسجل بالفعل. جربي تسجيل الدخول.");
      } else {
        toast.error("فشل إنشاء الحساب. حاولي مرة أخرى.");
      }
      console.error("SignUp error:", error);
      return;
    }

    toast.success("تم إنشاء حسابك بنجاح! 🌸");
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
            {mode === "login" ? "تسجيل الدخول" : "إنشاء حساب"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "login"
              ? "سجلي لحفظ حجوزاتك ومتابعة طلباتك"
              : "أنشئي حساب جديد لتتبعي حجوزاتك"}
          </p>
        </div>

        {/* Toggle Login/Signup */}
        <div className="flex bg-muted/50 rounded-xl p-1 mb-6">
          <button
            onClick={() => setMode("login")}
            className={cn(
              "flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2",
              mode === "login"
                ? "bg-white text-terracotta shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LogIn className="w-4 h-4" />
            تسجيل الدخول
          </button>
          <button
            onClick={() => setMode("signup")}
            className={cn(
              "flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2",
              mode === "signup"
                ? "bg-white text-terracotta shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <UserPlus className="w-4 h-4" />
            حساب جديد
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-border/50 space-y-5">
          {/* Email Field */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-terracotta" />
              <Label className="text-sm font-bold">البريد الإلكتروني</Label>
            </div>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              dir="ltr"
              className="h-12 text-base"
              onKeyDown={(e) =>
                e.key === "Enter" &&
                (mode === "login" ? handleLogin() : null)
              }
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-terracotta" />
              <Label className="text-sm font-bold">كلمة المرور</Label>
            </div>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              dir="ltr"
              className="h-12 text-base"
              onKeyDown={(e) =>
                e.key === "Enter" &&
                (mode === "login" ? handleLogin() : null)
              }
            />
          </div>

          {/* Confirm Password (Signup only) */}
          {mode === "signup" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-terracotta" />
                <Label className="text-sm font-bold">تأكيد كلمة المرور</Label>
              </div>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••"
                dir="ltr"
                className="h-12 text-base"
                onKeyDown={(e) =>
                  e.key === "Enter" && handleSignUp()
                }
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={mode === "login" ? handleLogin : handleSignUp}
            disabled={submitting || !email.trim() || !password}
            className="w-full px-6 py-3.5 text-base font-bold text-white rounded-xl gradient-terracotta shadow-lg shadow-terracotta/20 hover:shadow-terracotta/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : mode === "login" ? (
              "تسجيل الدخول ✨"
            ) : (
              "إنشاء حساب ✨"
            )}
          </button>
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
