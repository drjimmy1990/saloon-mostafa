"use client";

import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, MapPin, CalendarDays, User, Sparkles, Clock, Hash, CreditCard, Grid3X3, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";

interface StaffInfo { id: string; name: string; nameAr?: string; avatar?: string; role?: string; }
interface Service { id: string; name: string; price: number; images: string[]; category?: string; durationMinutes?: number; durationMode?: "time" | "queue"; depositAmount?: number; publishAt?: string | null; staff: StaffInfo[]; }
interface CategoryGroup { category: string; image: string | null; services: Service[]; }
interface BranchItem { id: string; name: string; nameAr?: string; address?: string; }

const STEPS = ["الفرع", "نوع الخدمة", "اختاري", "الموعد", "البيانات", "التأكيد"];

function BookingForm() {
  const searchParams = useSearchParams();
  const preSelectedService = searchParams.get("service");

  const [step, setStep] = useState(0);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [availableSlots, setAvailableSlots] = useState<Array<{ time: string; booked: boolean }>>([]);
  const [terms, setTerms] = useState("");

  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [selectedStaff, setSelectedStaff] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card");

  // Phone validation: Saudi format 05XXXXXXXX (10 digits) or +9665XXXXXXXX or 9665XXXXXXXX
  const validatePhone = (value: string): string => {
    const cleaned = value.replace(/[\s\-()]/g, "");
    if (!cleaned) return "رقم الهاتف مطلوب";
    // Saudi mobile: starts with 05 and 10 digits total
    if (/^05\d{8}$/.test(cleaned)) return "";
    // With country code: +966 or 966 followed by 5XXXXXXXX
    if (/^\+?9665\d{8}$/.test(cleaned)) return "";
    return "رقم هاتف غير صحيح — مثال: 0512345678";
  };

  const handlePhoneChange = (value: string) => {
    // Only allow digits, + and spaces
    const filtered = value.replace(/[^\d+\s]/g, "");
    setPhone(filtered);
    if (filtered.trim()) {
      setPhoneError(validatePhone(filtered));
    } else {
      setPhoneError("");
    }
  };

  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [staffBlocked, setStaffBlocked] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [queueNumber, setQueueNumber] = useState<number | null>(null);
  const [bookingResult, setBookingResult] = useState<any>(null);

  const { user, client, initialize } = useAuthStore();

  // Derived
  const currentCat = categories.find(c => c.category === selectedCategory);
  const allServicesInCat = currentCat?.services || [];
  // Build staff-service cards: one card per staff per service
  const staffServiceCards = allServicesInCat.flatMap(svc =>
    svc.staff.map(st => ({ service: svc, staffMember: st, key: `${svc.id}-${st.id}` }))
  );
  const selectedCard = staffServiceCards.find(c => c.service.id === selectedService && c.staffMember.id === selectedStaff);
  const serviceObj = selectedCard?.service;
  const staffObj = selectedCard?.staffMember;
  const branchObj = branches.find(b => b.id === selectedBranch);
  const isQueueMode = serviceObj?.durationMode === "queue";
  const depositAmount = serviceObj?.depositAmount || 0;

  useEffect(() => { initialize(); }, [initialize]);
  useEffect(() => {
    if (client) {
      if (client.name && !name) setName(client.name);
      if (client.phone && !phone) setPhone(client.phone);
    }
  }, [client]);

  // Fetch branches
  useEffect(() => {
    fetch("/api/branches?active=true").then(r => r.json()).then(d => setBranches(Array.isArray(d) ? d : [])).catch(console.error);
  }, []);

  // Fetch services grouped by category when branch selected
  useEffect(() => {
    if (!selectedBranch) return;
    setSelectedCategory(""); setSelectedService(""); setSelectedStaff(""); setSelectedTime("");
    fetch(`/api/services-with-staff?branchId=${selectedBranch}`)
      .then(r => r.json())
      .then(d => setCategories(Array.isArray(d) ? d : []))
      .catch(console.error);
  }, [selectedBranch]);

  // Fetch availability
  useEffect(() => {
    if (!selectedStaff || !selectedDate || !selectedService) return;
    setSlotsLoading(true); setSelectedTime(""); setStaffBlocked(false);
    fetch(`/api/availability?staffId=${selectedStaff}&serviceId=${selectedService}&date=${selectedDate}`)
      .then(r => r.json()).then(d => {
        if (d.blocked) {
          setStaffBlocked(true);
          setAvailableSlots([]);
        } else {
          setStaffBlocked(false);
          setAvailableSlots(d.slots || []);
        }
        setSlotsLoading(false);
      })
      .catch(() => setSlotsLoading(false));
  }, [selectedStaff, selectedDate, selectedService]);

  // Fetch terms
  useEffect(() => {
    if (step === 5) fetch("/api/terms?slug=booking-conditions").then(r => r.json()).then(d => setTerms(d.content || "")).catch(console.error);
  }, [step]);

  const canNext = () => {
    switch (step) {
      case 0: return !!selectedBranch;
      case 1: return !!selectedCategory;
      case 2: return !!selectedService && !!selectedStaff;
      case 3: return staffBlocked ? false : (isQueueMode ? !!selectedDate : (!!selectedDate && !!selectedTime));
      case 4: return name.trim() && phone.trim() && !validatePhone(phone);
      default: return true;
    }
  };

  const handleSubmit = async () => {
    const phoneErr = validatePhone(phone);
    if (phoneErr) { toast.error(phoneErr); setPhoneError(phoneErr); return; }
    if (!agreedToTerms) { toast.error("يرجى الموافقة على الشروط والأحكام"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/booking", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedService, serviceSummary: serviceObj?.name || "",
          date: selectedDate, time: isQueueMode ? null : selectedTime,
          branchId: selectedBranch, staffId: selectedStaff,
          name, phone, notes, depositAmount, paymentMethod,
          authUserId: user?.id || null,
          durationMode: serviceObj?.durationMode || "time",
          durationMinutes: serviceObj?.durationMinutes || 30,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "حدث خطأ أثناء الحجز"); return; }

      // ── PAYMENT REDIRECT ────────────────────────────────────────
      // The booking API already created the Paymob intention and returned
      // the checkout URL. Use it directly — do NOT call /api/payment/intent
      // again as that will fail with "reference already exists" on Paymob.
      if (paymentMethod === "card" && depositAmount > 0) {
        if (data.paymentUrl) {
          // Hard redirect to Paymob checkout — success screen is shown
          // only AFTER Paymob redirects back to /booking/success?code=...
          window.location.href = data.paymentUrl;
          return; // Stop here — do NOT show success screen
        } else {
          // Paymob URL was not generated (e.g. Paymob misconfigured on server).
          // Do NOT let the booking appear as confirmed to the user.
          toast.error("تعذر إنشاء رابط الدفع. يرجى التواصل معنا لإتمام الحجز.");
          console.error("Card payment required but no paymentUrl returned:", data);
          return; // Stop — booking stays as waiting_payment in DB
        }
      }
      // ── CASH / FREE BOOKING ─────────────────────────────────────
      setBookingResult(data); setQueueNumber(data.queueNumber || null); setSubmitted(true);
      toast.success("تم تأكيد الحجز بنجاح! 🌸");
    } catch { toast.error("حدث خطأ أثناء الحجز. يرجى المحاولة مرة أخرى."); }
    finally { setLoading(false); }
  };

  const today = new Date().toISOString().split("T")[0];

  // Get booking availability start date for selected service (YYYY-MM-DD in Saudi timezone)
  const getServiceAvailabilityMin = (svc?: Service): string => {
    if (!svc?.publishAt) return today;
    const pubDate = new Date(svc.publishAt)
      .toLocaleDateString("sv-SE", { timeZone: "Asia/Riyadh" }); // 'sv-SE' yields YYYY-MM-DD
    return pubDate > today ? pubDate : today;
  };

  const minDate = getServiceAvailabilityMin(serviceObj);

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
          <h1 className="text-3xl font-bold text-dark mb-3" style={{ fontFamily: "'Tajawal', sans-serif" }}>تم تأكيد حجزك! 🎉</h1>
          <p className="text-muted-foreground mb-2">{serviceObj?.name} — {staffObj?.nameAr || staffObj?.name}</p>
          {isQueueMode && queueNumber && (
            <div className="my-4 p-4 bg-sage-50 rounded-xl border border-sage-200">
              <p className="text-sm text-muted-foreground mb-1">رقم دورك</p>
              <p className="text-5xl font-bold text-sage-700">{queueNumber}</p>
            </div>
          )}
          {!isQueueMode && <p className="text-muted-foreground mb-6">{selectedDate} — {selectedTime && fmt12h(selectedTime)}</p>}
          <p className="text-sm text-muted-foreground">سنتواصل معك على الرقم {phone} لتأكيد الموعد.</p>
        </div>
      </div>
    );
  }

  // ─── Step 0: Branch ───
  const renderBranchStep = () => (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-right font-arabic">اختاري الفرع</h2>
      <div className="grid gap-3">
        {branches.map((b) => (
          <button key={b.id} onClick={() => { setSelectedBranch(b.id); setTimeout(() => setStep(1), 200); }}
            className={cn("p-4 rounded-xl border-2 text-right transition-all hover:shadow-md", selectedBranch === b.id ? "border-sage-500 bg-sage-50 shadow-md" : "border-gray-200 bg-white hover:border-sage-300")}>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-sage-600 shrink-0" />
              <div>
                <p className="font-bold font-arabic">{b.nameAr || b.name}</p>
                {b.address && <p className="text-sm text-muted-foreground">{b.address}</p>}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  // ─── Step 1: Category ───
  const renderCategoryStep = () => (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-right font-arabic">نوع الخدمة</h2>
      <div className="grid grid-cols-2 gap-3">
        {categories.map((cat) => (
          <button key={cat.category} onClick={() => { setSelectedCategory(cat.category); setSelectedService(""); setSelectedStaff(""); setTimeout(() => setStep(2), 200); }}
            className={cn(
              "rounded-xl border-2 overflow-hidden transition-all hover:shadow-lg group",
              selectedCategory === cat.category ? "border-sage-500 shadow-lg ring-1 ring-sage-300" : "border-gray-200 bg-white hover:border-sage-300"
            )}>
            <div className="aspect-[4/3] bg-sage-100 overflow-hidden">
              {cat.image ? (
                <img src={cat.image} alt={cat.category} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Grid3X3 className="w-10 h-10 text-sage-300" />
                </div>
              )}
            </div>
            <div className="p-3 text-center">
              <p className="font-bold font-arabic text-sm">{cat.category}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{cat.services.length} خدمة</p>
            </div>
          </button>
        ))}
        {categories.length === 0 && <p className="text-center text-muted-foreground py-8 font-arabic col-span-2">لا توجد خدمات متاحة</p>}
      </div>
    </div>
  );

  // ─── Step 2: Service+Staff Cards ───
  const renderServiceStaffStep = () => (
    <div className="space-y-4">
      <div className="flex flex-col text-right">
        <h2 className="text-xl font-bold font-arabic text-dark">اختاري الخدمة والعاملة</h2>
        <p className="text-sm text-muted-foreground font-arabic mt-1">{selectedCategory}</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {staffServiceCards.map(({ service: svc, staffMember: st, key }) => {
          const isSelected = selectedService === svc.id && selectedStaff === st.id;
          const openDate = svc.publishAt ? new Date(svc.publishAt) : null;
          const availabilityStartDate = openDate
            ? openDate.toLocaleDateString("sv-SE", { timeZone: "Asia/Riyadh" })
            : null;
          const bookingNotYetOpen = availabilityStartDate ? availabilityStartDate > today : false;
          const formattedOpenDate = openDate
            ? openDate.toLocaleDateString("ar-SA", { timeZone: "Asia/Riyadh", year: "numeric", month: "long", day: "numeric" })
            : "";
          return (
            <button key={key}
              onClick={() => { setSelectedService(svc.id); setSelectedStaff(st.id);
                // Reset date if it's before this service's availability start
                if (availabilityStartDate && selectedDate && selectedDate < availabilityStartDate) {
                  setSelectedDate(""); setSelectedTime("");
                }
                setTimeout(() => setStep(3), 250);
              }}
              className={cn(
                "group flex flex-col text-right rounded-2xl border-2 overflow-hidden transition-all duration-300 relative",
                bookingNotYetOpen
                  ? "border-amber-200 bg-amber-50/30"
                  : isSelected
                    ? "border-terracotta-500 bg-terracotta-50/50 shadow-lg ring-1 ring-terracotta-300 hover:shadow-xl"
                    : "border-gray-100 bg-white hover:border-terracotta-300 hover:shadow-xl"
              )}
              dir="rtl"
            >
              {/* Booking availability badge */}
              {bookingNotYetOpen && (
                <div className="absolute top-2 left-2 z-10">
                  <Badge className="bg-amber-500 text-white text-[10px] px-2 py-1 font-bold shadow-md gap-1">
                    <Calendar className="w-3 h-3" />
                    المواعيد تبدأ {formattedOpenDate}
                  </Badge>
                </div>
              )}

              {/* Bottom Info Section */}
              <div className={cn("p-4 flex flex-col flex-1 w-full justify-between gap-3", bookingNotYetOpen && "grayscale-[30%]")}>
                <div>
                  <p className="font-bold text-base font-arabic text-dark leading-tight mb-3 line-clamp-2">{svc.name}</p>
                  
                  {/* Staff Info */}
                  <div className="flex items-center gap-2.5 bg-gray-50/80 rounded-xl p-2 border border-gray-100 transition-colors group-hover:bg-white group-hover:border-gray-200">
                    <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-sm border border-gray-200 shrink-0">
                      {st.avatar ? <img src={st.avatar} className="w-full h-full object-cover" alt="" /> : <User className="w-4 h-4 text-gray-400" />}
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="text-[10px] text-muted-foreground leading-none mb-1">العاملة</span>
                      <p className="text-sm font-bold font-arabic text-gray-800 leading-none">{st.nameAr || st.name}</p>
                    </div>
                  </div>
                </div>
                
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 mt-auto pt-1">
                  {Number(svc.price) > 0 && (
                    <Badge className="bg-terracotta text-white text-xs px-2.5 py-1 font-bold shadow-sm">
                      {svc.price} ر.س
                    </Badge>
                  )}
                  {svc.durationMinutes && (
                    <Badge variant="outline" className="text-xs px-2 py-1 gap-1.5 border-gray-200 text-gray-600 bg-white">
                      <Clock className="w-3 h-3" />
                      {svc.durationMinutes >= 60 ? `${svc.durationMinutes/60} ساعة` : `${svc.durationMinutes} دقيقة`}
                    </Badge>
                  )}
                  {svc.durationMode === "queue" && (
                    <Badge variant="outline" className="text-xs px-2 py-1 gap-1.5 border-gray-200 text-gray-600 bg-white">
                      <Hash className="w-3 h-3" />
                      بالدور
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          );
        })}
        {staffServiceCards.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
            <p className="text-muted-foreground font-arabic">لا توجد عاملات متاحات لهذه الخدمة حالياً</p>
          </div>
        )}
      </div>
    </div>
  );

  // ─── Step 3: Date/Time ───
  const renderDateTimeStep = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-right font-arabic">{isQueueMode ? "اختاري التاريخ" : "اختاري الموعد"}</h2>
      <div className="space-y-2">
        <Label className="text-right block font-arabic">التاريخ</Label>
        <Input type="date" min={minDate} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} dir="ltr" />
        {serviceObj?.publishAt && getServiceAvailabilityMin(serviceObj) > today && (
          <p className="text-xs text-amber-600 font-arabic text-right mt-1">
            📅 أقرب موعد متاح:{" "}
            {new Date(serviceObj.publishAt).toLocaleDateString("ar-SA", { timeZone: "Asia/Riyadh", year: "numeric", month: "long", day: "numeric" })}
          </p>
        )}
      </div>
      {!isQueueMode && selectedDate && (
        <div className="space-y-2">
          <Label className="text-right block font-arabic">الأوقات المتاحة</Label>
          {slotsLoading ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-sage-400 border-t-transparent rounded-full animate-spin" /></div>
          ) : availableSlots.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {availableSlots.map((slot) => (
              <button key={slot.time} type="button"
                  onClick={() => !slot.booked && setSelectedTime(slot.time)}
                  disabled={slot.booked}
                  className={cn(
                    "py-2.5 px-3 rounded-lg border text-sm font-bold transition-all",
                    slot.booked
                      ? "border-red-100 bg-red-50 text-red-300 line-through cursor-not-allowed opacity-60"
                      : selectedTime === slot.time
                        ? "border-terracotta bg-terracotta text-white shadow-md scale-105 ring-2 ring-terracotta-300 cursor-pointer"
                        : "border-gray-200 bg-white hover:border-terracotta-300 hover:bg-terracotta-50 text-gray-700 cursor-pointer"
                  )}>
                  {fmt12h(slot.time)}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-6 font-arabic">لا توجد أوقات متاحة في هذا اليوم</p>
          )}
        </div>
      )}
      {isQueueMode && selectedDate && !staffBlocked && (
        <div className="bg-sage-50 border border-sage-200 rounded-xl p-4 text-center">
          <Hash className="w-8 h-8 text-sage-600 mx-auto mb-2" />
          <p className="text-sm font-arabic text-muted-foreground">سيتم تحديد رقم دورك عند التأكيد</p>
        </div>
      )}
      {staffBlocked && selectedDate && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-sm font-arabic text-red-600 font-bold">⚠️ العاملة في إجازة في هذا اليوم</p>
          <p className="text-xs font-arabic text-red-500 mt-1">يرجى اختيار تاريخ آخر</p>
        </div>
      )}
    </div>
  );

  // ─── Step 4: Data ───
  const renderDataStep = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-right font-arabic">بياناتك</h2>
      <div className="space-y-2">
        <Label className="text-right block font-arabic">الاسم</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم الكامل" className="text-right font-arabic" dir="rtl" />
      </div>
      <div className="space-y-2">
        <Label className="text-right block font-arabic">رقم الهاتف</Label>
        <Input value={phone} onChange={(e) => handlePhoneChange(e.target.value)} placeholder="0512345678" dir="ltr" type="tel" maxLength={15}
          className={phoneError ? "border-red-400 focus:ring-red-300" : ""} />
        {phoneError && <p className="text-xs text-red-500 text-right font-arabic mt-1">{phoneError}</p>}
      </div>
      <div className="space-y-2">
        <Label className="text-right block font-arabic">ملاحظات (اختياري)</Label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
          className="w-full rounded-lg border p-3 text-right font-arabic text-sm resize-none focus:ring-2 focus:ring-sage-400 outline-none" dir="rtl" placeholder="أي ملاحظات إضافية..." />
      </div>
      {depositAmount > 0 && (
        <div className="space-y-2">
          <Label className="text-right block font-arabic">طريقة دفع العربون ({depositAmount} SAR)</Label>
          <div className="grid grid-cols-2 gap-2">
            {[{ v: "card", l: "بطاقة" }].map(({ v, l }) => (
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

  // ─── Step 5: Confirm ───
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
          { label: "السعر", value: serviceObj?.price ? `${serviceObj.price} ر.س` : "" },
          ...(depositAmount > 0 ? [{ label: "العربون", value: `${depositAmount} ر.س (${paymentMethod === "card" ? "بطاقة" : "كاش"})` }] : []),
          { label: "الاسم", value: name },
          { label: "الهاتف", value: phone },
        ].filter(r => r.value).map((row, i) => (
          <div key={i} className="flex justify-between items-center p-3">
            <span className="text-sm font-bold font-arabic">{row.label}</span>
            <span className="text-sm text-muted-foreground">{row.value}</span>
          </div>
        ))}
      </div>
      {notes && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-right font-arabic"><strong>ملاحظات:</strong> {notes}</p>
        </div>
      )}
      {/* Terms & Conditions */}
      {terms && (
        <div className="bg-gray-50 border rounded-xl p-4 max-h-48 overflow-y-auto">
          <h4 className="text-sm font-bold font-arabic text-right mb-2">الشروط والأحكام</h4>
          <div className="text-xs text-muted-foreground font-arabic text-right leading-relaxed whitespace-pre-line"
            dangerouslySetInnerHTML={{ __html: terms }}
          />
        </div>
      )}
      <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border hover:bg-sage-50 transition-colors">
        <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)}
          className="w-5 h-5 rounded border-gray-300 text-sage-600 focus:ring-sage-500" />
        <span className="text-sm font-arabic font-medium">أوافق على الشروط والأحكام</span>
      </label>
    </div>
  );

  const stepRenderers = [renderBranchStep, renderCategoryStep, renderServiceStaffStep, renderDateTimeStep, renderDataStep, renderConfirmStep];

  return (
    <div className="min-h-screen bg-cream py-10">
      <div className="container mx-auto max-w-lg px-4">
        {/* Stepper */}
        <div className="mb-8">
          {/* Step label */}
          <div className="text-center mb-4">
            <span className="text-xs text-muted-foreground font-medium">الخطوة {step + 1} من {STEPS.length}</span>
            <h2 className="text-lg font-bold text-dark font-arabic mt-0.5">{STEPS[step]}</h2>
          </div>
          {/* Progress bar */}
          <div className="flex items-center justify-center gap-1.5">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                  i < step ? "bg-terracotta text-white shadow-sm shadow-terracotta/25" : i === step ? "bg-terracotta-100 text-terracotta-700 ring-2 ring-terracotta-400 scale-110" : "bg-gray-100 text-gray-400")}>
                  {i < step ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn("w-6 sm:w-8 h-[3px] rounded-full transition-all duration-500", i < step ? "bg-terracotta-400" : "bg-gray-200")} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
          {stepRenderers[step]()}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 justify-between">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="gap-2 font-arabic">
              <ChevronRight className="w-4 h-4" /> السابق
            </Button>
          )}
          <div className="flex-1" />
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext()} className="gap-2 font-arabic bg-terracotta hover:bg-terracotta-600 text-white px-6 py-3 text-base rounded-xl shadow-md">
              التالي <ChevronLeft className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading || !agreedToTerms} className="gap-2 font-arabic bg-terracotta hover:bg-terracotta-600 text-white px-6 py-3 text-base rounded-xl shadow-md">
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
