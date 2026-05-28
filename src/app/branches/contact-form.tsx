"use client";

import { useState } from "react";

export function ContactForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) {
      setError("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, message }),
      });

      if (!res.ok) throw new Error("فشل الإرسال");

      setSuccess(true);
      setName("");
      setPhone("");
      setEmail("");
      setMessage("");
    } catch {
      setError("حدث خطأ، حاولي مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          {/* Right side — Text */}
          <div className="order-2 md:order-1 text-right space-y-5">
            <p className="text-terracotta text-sm font-bold tracking-wider">صالون نون</p>
            <h2
              className="text-3xl md:text-4xl font-black text-dark leading-tight"
              style={{ fontFamily: "'Tajawal', sans-serif" }}
            >
              ابقي على تواصل معنا
            </h2>
            <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
              يسعدنا تواصلك معنا و استفساراتك عن أي شيء تحبيه
              <br />
              بمجرد ان تقومي بإرسال استفسارك سوف يتم الرد عليك في خلال 24 ساعة من
              خلال خدمة عملاء نون
            </p>
            <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
              حيث يعتبر صالون نون أفضل مكان لحصول المرأه على مظهر جذاب و راقي
              كملكات الجمال على مستوى المملكة العربية السعودية فهو مجهز بأفضل
              الأدوات والمعدات وبأفضل المستحضرات التجميلية وبأفضل الماركات العالمية
            </p>
            <div className="pt-2">
              <p className="text-sm font-bold text-dark mb-3">تابعنا على</p>
              <div className="flex items-center gap-2 justify-end">
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white hover:scale-110 transition-transform shadow-md"
                  aria-label="Instagram"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white hover:scale-110 transition-transform shadow-md"
                  aria-label="Snapchat"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Left side — Form */}
          <div className="order-1 md:order-2">
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-3xl p-6 md:p-8 shadow-xl shadow-black/5 border border-border/30 space-y-4"
            >
              {/* Name + Phone side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="الاسم"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl bg-cream/60 border border-border/40 text-sm text-right placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta/40 transition-all"
                  required
                />
                <input
                  type="tel"
                  placeholder="رقم الجوال"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl bg-cream/60 border border-border/40 text-sm text-right placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta/40 transition-all"
                  dir="ltr"
                  required
                />
              </div>

              {/* Email */}
              <input
                type="email"
                placeholder="البريد الإلكتروني"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl bg-cream/60 border border-border/40 text-sm text-right placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta/40 transition-all"
              />

              {/* Message */}
              <textarea
                placeholder="رسالتك"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="w-full px-4 py-3.5 rounded-xl bg-cream/60 border border-border/40 text-sm text-right placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta/40 transition-all resize-none"
                required
              />

              {/* Error */}
              {error && (
                <p className="text-sm text-red-500 text-right">{error}</p>
              )}

              {/* Success */}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                  <p className="text-sm text-green-700 font-medium">
                    ✅ تم إرسال رسالتك بنجاح! سنتواصل معك قريباً
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl gradient-terracotta text-white font-bold text-sm shadow-lg shadow-terracotta/20 hover:shadow-terracotta/40 transition-all hover:scale-105 active:scale-100 disabled:opacity-60 disabled:hover:scale-100"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="rotate-180"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
                {loading ? "جارٍ الإرسال..." : "إرسال"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
