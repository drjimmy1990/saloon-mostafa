"use client";

import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, MapPin, CalendarDays, User, Sparkles, Clock, Hash, CreditCard, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";

interface Service {
  id: string;
  name: string;
  price: number;
  images: string[];
  category?: string;
  durationMinutes?: number;
  durationMode?: "time" | "queue";
  depositAmount?: number;
}

interface StaffMember {
  id: string;
  name: string;
  nameAr?: string;
  avatar?: string;
  role?: string;
  branchId?: string;
}

interface BranchItem {
  id: string;
  name: string;
  nameAr?: string;
  address?: string;
}

const STEPS = ["الفرع", "الخدمة", "العاملة", "الموعد", "الشروط", "البيانات", "التأكيد"];

function BookingForm() {
  const searchParams = useSearchParams();
  const preSelectedService = searchParams.get("service");

  // Step state
  const [step, setStep] = useState(0);

  // Data
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [terms, setTerms] = useState("");

  // Selections
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [selectedStaff, setSelectedStaff] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Customer data
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  // UI state
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [queueNumber, setQueueNumber] = useState<number | null>(null);
  const [bookingResult, setBookingResult] = useState<any>(null);

  const { user, client, initialize } = useAuthStore();

  // Derived
  const serviceObj = services.find((s) => s.id === selectedService);
  const staffObj = staffList.find((s) => s.id === selectedStaff);
  const branchObj = branches.find((b) => b.id === selectedBranch);
  const isQueueMode = serviceObj?.durationMode === "queue";
  const depositAmount = serviceObj?.depositAmount || 0;

  // Auth init & auto-fill
  useEffect(() => { initialize(); }, [initialize]);
  useEffect(() => {
    if (client) {
      if (client.name && !name) setName(client.name);
      if (client.phone && !phone) setPhone(client.phone);
    }
  }, [client]);

  // Fetch branches on mount
  useEffect(() => {
    fetch("/api/branches?active=true").then(r => r.json()).then(d => setBranches(Array.isArray(d) ? d : [])).catch(console.error);
  }, []);

  // Fetch services when branch selected
  useEffect(() => {
    if (!selectedBranch) return;
    setSelectedService(""); setSelectedStaff(""); setSelectedTime("");
    fetch(`/api/services?branchId=${selectedBranch}`).then(r => r.json()).then(d => {
      setServices(Array.isArray(d) ? d : []);
      if (preSelectedService && d?.some((s: Service) => s.id === preSelectedService)) {
        setSelectedService(preSelectedService);
      }
    }).catch(console.error);
  }, [selectedBranch, preSelectedService]);

  // Fetch staff when service selected
  useEffect(() => {
    if (!selectedService || !selectedBranch) return;
    setSelectedStaff(""); setSelectedTime("");
    fetch(`/api/staff-by-service?serviceId=${selectedService}&branchId=${selectedBranch}`)
      .then(r => r.json()).then(d => setStaffList(Array.isArray(d) ? d : [])).catch(console.error);
  }, [selectedService, selectedBranch]);

  // Fetch availability when staff + date selected (time mode only)
  useEffect(() => {
    if (!selectedStaff || !selectedDate || !selectedService || isQueueMode) return;
    setSlotsLoading(true);
    setSelectedTime("");
    fetch(`/api/availability?staffId=${selectedStaff}&serviceId=${selectedService}&date=${selectedDate}`)
      .then(r => r.json()).then(d => {
        setAvailableSlots(d.slots || []);
        setSlotsLoading(false);
      }).catch(() => setSlotsLoading(false));
  }, [selectedStaff, selectedDate, selectedService, isQueueMode]);

  // Fetch terms
  useEffect(() => {
    if (step === 4) {
      fetch("/api/terms?slug=booking-conditions").then(r => r.json()).then(d => setTerms(d.content || "")).catch(console.error);
    }
  }, [step]);

  const canNext = () => {
    switch (step) {
      case 0: return !!selectedBranch;
      case 1: return !!selectedService;
      case 2: return !!selectedStaff;
      case 3: return isQueueMode ? !!selectedDate : (!!selectedDate && !!selectedTime);
      case 4: return agreedToTerms;
      case 5: return name.trim() && phone.trim();
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
          serviceId: selectedService,
          serviceSummary: serviceObj?.name || "",
          date: selectedDate,
          time: isQueueMode ? null : selectedTime,
          branchId: selectedBranch,
          staffId: selectedStaff,
          name, phone, notes,
          depositAmount,
          paymentMethod,
          authUserId: user?.id || null,
          durationMode: serviceObj?.durationMode || "time",
          durationMinutes: serviceObj?.durationMinutes || 30,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "حدث خطأ أثناء الحجز");
        return;
      }
      setBookingResult(data);
      setQueueNumber(data.queueNumber || null);
      setSubmitted(true);
      toast.success("تم تأكيد الحجز بنجاح! 🌸");
    } catch {
      toast.error("حدث خطأ أثناء الحجز. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  // Generate min date (today)
  const today = new Date().toISOString().split("T")[0];

  // Format time to 12h Arabic
  const fmt12h = (t24: string) => {
    const [h, m] = t24.split(":").map(Number);
    const ampm = h >= 12 ? "م" : "ص";
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
  };

  // ─── Success Screen ───
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
          <p className="text-muted-foreground mb-2">{serviceObj?.name}</p>
          {isQueueMode && queueNumber && (
            <div className="my-4 p-4 bg-sage-50 rounded-xl border border-sage-200">
              <p className="text-sm text-muted-foreground mb-1">رقم دورك</p>
              <p className="text-5xl font-bold text-sage-700">{queueNumber}</p>
            </div>
          )}
          {!isQueueMode && (
            <p className="text-muted-foreground mb-6">
              {selectedDate} — {selectedTime && fmt12h(selectedTime)}
            </p>
          )}
          <p className="text-sm text-muted-foreground">سنتواصل معك على الرقم {phone} لتأكيد الموعد.</p>
        </div>
      </div>
    );
  }

  // ─── Step Renderers ───

  const renderBranchStep = () => (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-right font-arabic">اختاري الفرع</h2>
      <div className="grid gap-3">
        {branches.map((b) => (
          <button key={b.id} onClick={() => setSelectedBranch(b.id)}
            className={cn("p-4 rounded-xl border-2 text-right transition-all hover:shadow-md", selectedBranch === b.id ? "border-sage-500 bg-sage-50 shadow-md" : "border-gray-200 bg-white hover:border-sage-300")}>
            <div className="flex items-center gap-3 justify-end">
              <div>
                <p className="font-bold font-arabic">{b.nameAr || b.name}</p>
                {b.address && <p className="text-sm text-muted-foreground">{b.address}</p>}
              </div>
              <MapPin className="w-5 h-5 text-sage-600 shrink-0" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderServiceStep = () => (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-right font-arabic">اختاري الخدمة</h2>
      <div className="grid gap-3">
        {services.map((s) => (
          <button key={s.id} onClick={() => setSelectedService(s.id)}
            className={cn("p-4 rounded-xl border-2 text-right transition-all hover:shadow-md", selectedService === s.id ? "border-sage-500 bg-sage-50 shadow-md" : "border-gray-200 bg-white hover:border-sage-300")}>
            <div className="flex items-center gap-3 justify-between">
              <div className="flex items-center gap-2">
                {Number(s.price) > 0 && <Badge variant="secondary">{s.price} JOD</Badge>}
                {s.durationMinutes && (
                  <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" />{s.durationMinutes >= 60 ? `${s.durationMinutes/60} ساعة` : `${s.durationMinutes} د`}</Badge>
                )}
                {s.durationMode === "queue" && <Badge variant="outline" className="gap-1"><Hash className="w-3 h-3" />بالدور</Badge>}
                {(s.depositAmount || 0) > 0 && <Badge className="bg-amber-100 text-amber-800 gap-1"><CreditCard className="w-3 h-3" />عربون {s.depositAmount}</Badge>}
              </div>
              <p className="font-bold font-arabic">{s.name}</p>
            </div>
          </button>
        ))}
        {services.length === 0 && <p className="text-center text-muted-foreground py-8 font-arabic">لا توجد خدمات متاحة لهذا الفرع</p>}
      </div>
    </div>
  );

  const renderStaffStep = () => (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-right font-arabic">اختاري العاملة</h2>
      <div className="grid gap-3">
        {staffList.map((s) => (
          <button key={s.id} onClick={() => setSelectedStaff(s.id)}
            className={cn("p-4 rounded-xl border-2 text-right transition-all hover:shadow-md", selectedStaff === s.id ? "border-sage-500 bg-sage-50 shadow-md" : "border-gray-200 bg-white hover:border-sage-300")}>
            <div className="flex items-center gap-3 justify-end">
              <div>
                <p className="font-bold font-arabic">{s.nameAr || s.name}</p>
                {s.role && <p className="text-sm text-muted-foreground">{s.role}</p>}
              </div>
              <div className="w-10 h-10 rounded-full bg-sage-100 flex items-center justify-center shrink-0">
                {s.avatar ? <img src={s.avatar} className="w-10 h-10 rounded-full object-cover" alt="" /> : <User className="w-5 h-5 text-sage-600" />}
              </div>
            </div>
          </button>
        ))}
        {staffList.length === 0 && <p className="text-center text-muted-foreground py-8 font-arabic">لا توجد عاملات متاحات لهذه الخدمة</p>}
      </div>
    </div>
  );

  const renderDateTimeStep = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-right font-arabic">{isQueueMode ? "اختاري التاريخ" : "اختاري الموعد"}</h2>
      {/* Date */}
      <div className="space-y-2">
        <Label className="text-right block font-arabic">التاريخ</Label>
        <Input type="date" min={today} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} dir="ltr" />
      </div>
      {/* Time slots (time mode only) */}
      {!isQueueMode && selectedDate && (
        <div className="space-y-2">
          <Label className="text-right block font-arabic">الأوقات المتاحة</Label>
          {slotsLoading ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-sage-400 border-t-transparent rounded-full animate-spin" /></div>
          ) : availableSlots.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {availableSlots.map((slot) => (
                <button key={slot} onClick={() => setSelectedTime(slot)}
                  className={cn("py-2 px-3 rounded-lg border text-sm font-medium transition-all", selectedTime === slot ? "border-sage-500 bg-sage-50 text-sage-700" : "border-gray-200 bg-white hover:border-sage-300")}>
                  {fmt12h(slot)}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-6 font-arabic">لا توجد أوقات متاحة في هذا اليوم</p>
          )}
        </div>
      )}
    </div>
  );

  const renderTermsStep = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-right font-arabic">الشروط والأحكام</h2>
      <div className="bg-white border rounded-xl p-4 max-h-60 overflow-y-auto">
        <p className="text-sm text-right font-arabic leading-relaxed whitespace-pre-wrap">{terms || "جاري التحميل..."}</p>
      </div>
      <label className="flex items-center gap-3 justify-end cursor-pointer p-3 rounded-lg border hover:bg-sage-50 transition-colors">
        <span className="text-sm font-arabic font-medium">أوافق على الشروط والأحكام</span>
        <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)}
          className="w-5 h-5 rounded border-gray-300 text-sage-600 focus:ring-sage-500" />
      </label>
    </div>
  );

  const renderDataStep = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-right font-arabic">بياناتك</h2>
      <div className="space-y-2">
        <Label className="text-right block font-arabic">الاسم</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم الكامل" className="text-right font-arabic" dir="rtl" />
      </div>
      <div className="space-y-2">
        <Label className="text-right block font-arabic">رقم الهاتف</Label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XXXXXXXX" dir="ltr" type="tel" />
      </div>
      <div className="space-y-2">
        <Label className="text-right block font-arabic">ملاحظات (اختياري)</Label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
          className="w-full rounded-lg border p-3 text-right font-arabic text-sm resize-none focus:ring-2 focus:ring-sage-400 outline-none" dir="rtl" placeholder="أي ملاحظات إضافية..." />
      </div>
      {/* Payment Method */}
      {depositAmount > 0 && (
        <div className="space-y-2">
          <Label className="text-right block font-arabic">طريقة دفع العربون ({depositAmount} JOD)</Label>
          <div className="grid grid-cols-2 gap-2">
            {[{ v: "cash", l: "كاش" }, { v: "card", l: "بطاقة" }].map(({ v, l }) => (
              <button key={v} onClick={() => setPaymentMethod(v)}
                className={cn("p-3 rounded-lg border-2 text-sm font-arabic font-medium transition-all", paymentMethod === v ? "border-sage-500 bg-sage-50" : "border-gray-200 bg-white hover:border-sage-300")}>
                {l}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderConfirmStep = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-right font-arabic">تأكيد الحجز</h2>
      <div className="bg-white border rounded-xl divide-y">
        {[
          { label: "الفرع", value: branchObj?.nameAr || branchObj?.name },
          { label: "الخدمة", value: serviceObj?.name },
          { label: "العاملة", value: staffObj?.nameAr || staffObj?.name },
          { label: "التاريخ", value: selectedDate },
          ...(!isQueueMode ? [{ label: "الوقت", value: selectedTime ? fmt12h(selectedTime) : "" }] : []),
          { label: "المدة", value: serviceObj?.durationMinutes ? `${serviceObj.durationMinutes} دقيقة` : "" },
          { label: "السعر", value: serviceObj?.price ? `${serviceObj.price} JOD` : "" },
          ...(depositAmount > 0 ? [{ label: "العربون", value: `${depositAmount} JOD (${paymentMethod === "card" ? "بطاقة" : "كاش"})` }] : []),
          { label: "الاسم", value: name },
          { label: "الهاتف", value: phone },
        ].filter(r => r.value).map((row, i) => (
          <div key={i} className="flex justify-between items-center p-3">
            <span className="text-sm text-muted-foreground">{row.value}</span>
            <span className="text-sm font-bold font-arabic">{row.label}</span>
          </div>
        ))}
      </div>
      {notes && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-right font-arabic"><strong>ملاحظات:</strong> {notes}</p>
        </div>
      )}
    </div>
  );

  const stepRenderers = [renderBranchStep, renderServiceStep, renderStaffStep, renderDateTimeStep, renderTermsStep, renderDataStep, renderConfirmStep];

  return (
    <div className="min-h-screen bg-cream py-10">
      <div className="container mx-auto max-w-lg px-4">
        {/* Stepper */}
        <div className="flex items-center justify-center gap-1 mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                i < step ? "bg-sage-500 text-white" : i === step ? "bg-sage-100 text-sage-700 ring-2 ring-sage-400" : "bg-gray-100 text-gray-400")}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={cn("w-4 h-0.5", i < step ? "bg-sage-400" : "bg-gray-200")} />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 border border-white/50">
          {stepRenderers[step]()}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 justify-between" dir="rtl">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="gap-2 font-arabic">
              <ChevronRight className="w-4 h-4" /> السابق
            </Button>
          )}
          <div className="flex-1" />
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext()} className="gap-2 font-arabic bg-sage-600 hover:bg-sage-700">
              التالي <ChevronLeft className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} className="gap-2 font-arabic bg-sage-600 hover:bg-sage-700">
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
              تأكيد الحجز
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream flex items-center justify-center"><div className="w-8 h-8 border-2 border-sage-400 border-t-transparent rounded-full animate-spin" /></div>}>
      <BookingForm />
    </Suspense>
  );
}
