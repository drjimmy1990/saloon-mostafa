"use client";

import { useState, useEffect, Suspense } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, MapPin, Home, CalendarDays, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";

interface Service {
  id: string;
  name: string;
  price: number;
  images: string[];
  availableAtHome?: boolean;
  availableAtSalon?: boolean;
}

const STEPS = ["الخدمة", "الموعد", "المكان", "البيانات", "التأكيد"];

function BookingForm() {
  const searchParams = useSearchParams();
  const preSelectedService = searchParams.get("service");

  const [step, setStep] = useState(0);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [location, setLocation] = useState<"salon" | "home">("salon");
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function fetchServices() {
      const supabase = getSupabaseClient();
      const { data } = await supabase
        .from("Product")
        .select("id, name, price, images, availableAtHome, availableAtSalon")
        .eq("isAvailable", true)
        .eq("type", "service")
        .order("sortOrder", { ascending: true });
      setServices(data || []);
      if (preSelectedService && data?.some((s) => s.id === preSelectedService)) {
        setSelectedServices([preSelectedService]);
      }
    }
    fetchServices();
  }, [preSelectedService]);

  const selectedServiceObjects = services.filter((s) => selectedServices.includes(s.id));
  const totalPrice = selectedServiceObjects.reduce((sum, s) => sum + s.price, 0);

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const canNext = () => {
    switch (step) {
      case 0: return selectedServices.length > 0;
      case 1: return selectedDate && selectedTime;
      case 2: return location === "salon" || (location === "home" && address.trim());
      case 3: return name.trim() && phone.trim();
      default: return true;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          services: selectedServiceObjects.map((s) => s.name),
          serviceSummary: selectedServiceObjects.map((s) => s.name).join("، "),
          date: selectedDate,
          time: selectedTime,
          location,
          address: location === "home" ? address : "",
          name,
          phone,
          notes,
          totalPrice,
        }),
      });
      if (!res.ok) throw new Error("Failed to create booking");
      setSubmitted(true);
      toast.success("تم تأكيد الحجز بنجاح! سنتواصل معك قريباً 🌸");
    } catch {
      toast.error("حدث خطأ أثناء الحجز. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-cream py-20">
        <div className="container mx-auto max-w-lg px-4 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6 animate-fade-in-up">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-dark mb-3" style={{ fontFamily: "'Tajawal', sans-serif" }}>
            تم تأكيد حجزك! 🎉
          </h1>
          <p className="text-muted-foreground mb-2">
            {selectedServiceObjects.map((s) => s.name).join("، ")}
          </p>
          <p className="text-muted-foreground mb-6">
            {selectedDate} — {selectedTime}
          </p>
          <p className="text-sm text-muted-foreground">سنتواصل معك على الرقم {phone} لتأكيد الموعد.</p>
        </div>
      </div>
    );
  }

  const timeSlots = [
    "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
    "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
    "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM",
  ];

  return (
    <div className="min-h-screen bg-cream py-12 md:py-20">
      <div className="container mx-auto max-w-2xl px-4">
        <h1 className="text-3xl font-bold text-dark text-center mb-8" style={{ fontFamily: "'Tajawal', sans-serif" }}>
          احجزي موعدك
        </h1>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                  i <= step
                    ? "gradient-terracotta text-white shadow-md"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn("w-6 h-0.5 rounded-full", i < step ? "bg-terracotta" : "bg-muted")} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-border/50">
          {/* Step 0: Select Services */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-dark flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-terracotta" />
                اختاري الخدمة
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => toggleService(service.id)}
                    className={cn(
                      "p-4 rounded-xl border-2 text-right transition-all",
                      selectedServices.includes(service.id)
                        ? "border-terracotta bg-terracotta/5"
                        : "border-border hover:border-terracotta/30"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">{service.name}</span>
                      {selectedServices.includes(service.id) && (
                        <div className="w-5 h-5 rounded-full bg-terracotta flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-terracotta font-bold mt-1 tabular-nums">
                      {service.price.toFixed(2)} د.أ
                    </p>
                  </button>
                ))}
              </div>
              {selectedServices.length > 0 && (
                <div className="p-4 rounded-xl bg-terracotta/5 flex items-center justify-between">
                  <span className="text-sm font-medium">المجموع المقدّر</span>
                  <span className="text-lg font-black text-terracotta tabular-nums">
                    {totalPrice.toFixed(2)} د.أ
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Step 1: Date & Time */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-dark flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-terracotta" />
                اختاري الموعد
              </h2>
              <div>
                <Label className="text-sm font-medium mb-2 block">التاريخ</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="text-base"
                  dir="ltr"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">الوقت</Label>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={cn(
                        "px-2 py-2 text-xs rounded-lg border transition-all font-medium",
                        selectedTime === time
                          ? "border-terracotta bg-terracotta text-white"
                          : "border-border hover:border-terracotta/30"
                      )}
                      dir="ltr"
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-dark flex items-center gap-2">
                <MapPin className="w-5 h-5 text-terracotta" />
                مكان الخدمة
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setLocation("salon")}
                  className={cn(
                    "p-6 rounded-xl border-2 text-center transition-all",
                    location === "salon"
                      ? "border-terracotta bg-terracotta/5"
                      : "border-border hover:border-terracotta/30"
                  )}
                >
                  <MapPin className="w-8 h-8 mx-auto mb-2 text-sage" />
                  <span className="font-bold block">في الصالون</span>
                </button>
                <button
                  onClick={() => setLocation("home")}
                  className={cn(
                    "p-6 rounded-xl border-2 text-center transition-all",
                    location === "home"
                      ? "border-terracotta bg-terracotta/5"
                      : "border-border hover:border-terracotta/30"
                  )}
                >
                  <Home className="w-8 h-8 mx-auto mb-2 text-terracotta" />
                  <span className="font-bold block">في المنزل</span>
                </button>
              </div>
              {location === "home" && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">العنوان</Label>
                  <Input
                    placeholder="شارع مكة، عمّان..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 3: Customer Info */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-dark flex items-center gap-2">
                <User className="w-5 h-5 text-terracotta" />
                بياناتك
              </h2>
              <div>
                <Label className="text-sm font-medium mb-2 block">الاسم الكامل *</Label>
                <Input
                  placeholder="سارة أحمد"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">رقم الهاتف *</Label>
                <Input
                  placeholder="0790000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  dir="ltr"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">ملاحظات (اختياري)</Label>
                <Input
                  placeholder="أي ملاحظات إضافية..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-dark flex items-center gap-2">
                <Check className="w-5 h-5 text-terracotta" />
                تأكيد الحجز
              </h2>
              <div className="space-y-3 p-4 rounded-xl bg-cream">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">الخدمات</span>
                  <span className="font-medium">{selectedServiceObjects.map((s) => s.name).join("، ")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">التاريخ</span>
                  <span className="font-medium" dir="ltr">{selectedDate}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">الوقت</span>
                  <span className="font-medium" dir="ltr">{selectedTime}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">المكان</span>
                  <span className="font-medium">{location === "salon" ? "في الصالون" : "في المنزل"}</span>
                </div>
                {location === "home" && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">العنوان</span>
                    <span className="font-medium">{address}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">الاسم</span>
                  <span className="font-medium">{name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">الهاتف</span>
                  <span className="font-medium" dir="ltr">{phone}</span>
                </div>
                <div className="flex justify-between text-base font-bold pt-2 border-t">
                  <span>المجموع المقدّر</span>
                  <span className="text-terracotta tabular-nums">{totalPrice.toFixed(2)} د.أ</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            {step > 0 ? (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="gap-1">
                <ChevronRight className="w-4 h-4" />
                السابق
              </Button>
            ) : (
              <div />
            )}
            {step < STEPS.length - 1 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canNext()}
                className="gap-1 gradient-terracotta text-white border-none"
              >
                التالي
                <ChevronLeft className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="gap-1 gradient-terracotta text-white border-none"
              >
                {loading ? "جاري الحجز..." : "تأكيد الحجز ✨"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream py-20">
        <div className="container mx-auto max-w-2xl px-4 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-40 mx-auto" />
            <div className="h-4 bg-muted rounded w-60 mx-auto" />
          </div>
        </div>
      </div>
    }>
      <BookingForm />
    </Suspense>
  );
}
