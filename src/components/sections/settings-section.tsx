"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { t, isRTL } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Settings, Save, Users, Trash2, Plus, Globe, Clock, Image as ImageIcon, Upload, Loader2, Building2, Copy, Check, Sparkles, Lock } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { uploadImage } from "@/lib/storage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface DaySchedule {
  dayOfWeek: number; // 0=Sunday to 6=Saturday
  dayNameAr: string;
  dayNameEn: string;
  isOpen: boolean;
  open: string;
  close: string;
}

export interface BranchItem {
  id: string;
  name: string;
  nameAr?: string;
  address?: string;
  phone?: string;
  isActive?: boolean;
  workingHours?: DaySchedule[] | Record<string, any>;
}

export const DEFAULT_DAYS_SCHEDULE: DaySchedule[] = [
  { dayOfWeek: 6, dayNameAr: "السبت", dayNameEn: "Saturday", isOpen: true, open: "13:00", close: "22:00" },
  { dayOfWeek: 0, dayNameAr: "الأحد", dayNameEn: "Sunday", isOpen: true, open: "13:00", close: "22:00" },
  { dayOfWeek: 1, dayNameAr: "الإثنين", dayNameEn: "Monday", isOpen: true, open: "13:00", close: "22:00" },
  { dayOfWeek: 2, dayNameAr: "الثلاثاء", dayNameEn: "Tuesday", isOpen: true, open: "13:00", close: "22:00" },
  { dayOfWeek: 3, dayNameAr: "الأربعاء", dayNameEn: "Wednesday", isOpen: true, open: "13:00", close: "22:00" },
  { dayOfWeek: 4, dayNameAr: "الخميس", dayNameEn: "Thursday", isOpen: true, open: "13:00", close: "22:00" },
  { dayOfWeek: 5, dayNameAr: "الجمعة", dayNameEn: "Friday", isOpen: true, open: "13:00", close: "22:00" },
];

function normalizeSchedule(raw: any): DaySchedule[] {
  if (Array.isArray(raw) && raw.length === 7) {
    return raw.map((d, idx) => ({
      ...DEFAULT_DAYS_SCHEDULE[idx],
      ...d,
    }));
  }
  if (raw && typeof raw === "object") {
    return DEFAULT_DAYS_SCHEDULE.map((def) => {
      const match = raw[def.dayOfWeek] || raw[String(def.dayOfWeek)];
      if (match) {
        return { ...def, ...match };
      }
      return def;
    });
  }
  return DEFAULT_DAYS_SCHEDULE;
}

function formatTime12h(timeStr: string): string {
  if (!timeStr) return "";
  const [hStr, mStr] = timeStr.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr || "0", 10);
  const period = h >= 12 ? "م" : "ص";
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${displayH}:00 ${period}` : `${displayH}:${m.toString().padStart(2, "0")} ${period}`;
}

interface SystemSetting {
  key: string;
  value: string;
}

interface AppUserRole {
  id: string;
  name: string;
  email: string;
  role: "admin" | "team" | "demo";
  permissions: string[];
}

export function SettingsSection() {
  const { locale, userRole } = useAppStore();
  const rtl = isRTL(locale);

  // General Settings State
  const [salonAddress, setSalonAddress] = useState("");
  const [salonPhone, setSalonPhone] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappNotification, setWhatsappNotification] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("2");
  const [workingHoursWeekdays, setWorkingHoursWeekdays] = useState("");
  const [workingHoursFriday, setWorkingHoursFriday] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [bookingStartTime, setBookingStartTime] = useState("09:00");
  const [bookingEndTime, setBookingEndTime] = useState("20:00");
  const [heroImage1, setHeroImage1] = useState("");
  const [heroImage2, setHeroImage2] = useState("");
  const [heroImage3, setHeroImage3] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isUploading1, setIsUploading1] = useState(false);
  const [isUploading2, setIsUploading2] = useState(false);
  const [isUploading3, setIsUploading3] = useState(false);
  const [password, setPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Branch Working Hours State
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [branchSchedules, setBranchSchedules] = useState<Record<string, DaySchedule[]>>({});
  const [copiedDay, setCopiedDay] = useState<number | null>(null);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);

  // Users State
  const [users, setUsers] = useState<AppUserRole[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUserRole | null>(null);
  const [userForm, setUserForm] = useState<{name: string, email: string, role: "admin" | "team" | "demo", password?: string, permissions: string[]}>({ name: "", email: "", role: "team", permissions: [] });

  const AVAILABLE_PERMISSIONS = [
    { id: "channels", labelAr: "القنوات", labelEn: "Channels" },
    { id: "branches", labelAr: "الفروع", labelEn: "Branches" },
    { id: "services", labelAr: "الخدمات", labelEn: "Services" },
    { id: "products", labelAr: "المنتجات", labelEn: "Products" },
    { id: "offers", labelAr: "العروض", labelEn: "Offers" },
    { id: "bookings", labelAr: "الحجوزات", labelEn: "Bookings" },
    { id: "orders", labelAr: "الطلبات", labelEn: "Orders" },
    { id: "clients", labelAr: "العملاء", labelEn: "Clients" },
    { id: "staff", labelAr: "العاملات", labelEn: "Staff" },
    { id: "chat", labelAr: "المحادثات", labelEn: "Chat" },
    { id: "gallery", labelAr: "المعرض", labelEn: "Gallery" },
    { id: "blacklist", labelAr: "القائمة السوداء", labelEn: "Blacklist" },
    { id: "bot-offers", labelAr: "عروض البوت", labelEn: "Bot Offers" },
    { id: "bot-settings", labelAr: "إعدادات البوت", labelEn: "Bot Settings" },
    { id: "bot-services", labelAr: "خدمات البوت", labelEn: "Bot Services" },
    { id: "notifications", labelAr: "الإشعارات", labelEn: "Notifications" },
  ];

  useEffect(() => {
    fetchSettings();
    fetchUsers();
  }, []);

  const fetchSettings = async () => {
    setIsLoadingBranches(true);
    try {
      const [settingsRes, branchesRes] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/branches"),
      ]);

      let parsedBranchSchedules: Record<string, DaySchedule[]> = {};
      let settingsData: Record<string, string> = {};

      if (settingsRes.ok) {
        settingsData = await settingsRes.json();
        setSalonAddress(settingsData.salon_address || "");
        setSalonPhone(settingsData.salon_phone || "");
        setWhatsappNumber(settingsData.whatsapp_number || "");
        setWhatsappNotification(settingsData.order_notification_whatsapp || "");
        setDeliveryFee(settingsData.delivery_fee || "2");
        setWorkingHoursWeekdays(settingsData.working_hours_weekdays || "");
        setWorkingHoursFriday(settingsData.working_hours_friday || "");
        setInstagramUrl(settingsData.instagram_url || "");
        setFacebookUrl(settingsData.facebook_url || "");
        setTiktokUrl(settingsData.tiktok_url || "");
        setGoogleMapsUrl(settingsData.google_maps_url || "");
        setBookingStartTime(settingsData.booking_start_time || "09:00");
        setBookingEndTime(settingsData.booking_end_time || "20:00");
        setHeroImage1(settingsData.hero_image_1 || "");
        setHeroImage2(settingsData.hero_image_2 || "");
        setHeroImage3(settingsData.hero_image_3 || "");

        if (settingsData.branch_working_hours) {
          try {
            const rawParsed = JSON.parse(settingsData.branch_working_hours);
            Object.keys(rawParsed).forEach((bId) => {
              parsedBranchSchedules[bId] = normalizeSchedule(rawParsed[bId]);
            });
          } catch (e) {
            console.error("Error parsing branch_working_hours:", e);
          }
        }
      }

      if (branchesRes.ok) {
        const branchesData: BranchItem[] = await branchesRes.json();
        setBranches(branchesData);
        if (branchesData.length > 0) {
          setSelectedBranchId((prev) => (prev ? prev : branchesData[0].id));
        }
        const mergedSchedules: Record<string, DaySchedule[]> = {};
        branchesData.forEach((b) => {
          if (b.workingHours) {
            mergedSchedules[b.id] = normalizeSchedule(b.workingHours);
          } else if (parsedBranchSchedules[b.id]) {
            mergedSchedules[b.id] = parsedBranchSchedules[b.id];
          } else {
            mergedSchedules[b.id] = [...DEFAULT_DAYS_SCHEDULE];
          }
        });
        setBranchSchedules(mergedSchedules);
      }
    } catch (err) {
      console.error("Failed to fetch settings and branches", err);
    } finally {
      setIsLoadingBranches(false);
    }
  };

  const handleDayChange = (
    branchId: string,
    dayOfWeek: number,
    field: "isOpen" | "open" | "close",
    value: any
  ) => {
    setBranchSchedules((prev) => {
      const current = prev[branchId] ? [...prev[branchId]] : [...DEFAULT_DAYS_SCHEDULE];
      const idx = current.findIndex((d) => d.dayOfWeek === dayOfWeek);
      if (idx !== -1) {
        current[idx] = { ...current[idx], [field]: value };
      }
      return { ...prev, [branchId]: current };
    });
  };

  const handleCopyHoursToAllDays = (branchId: string, sourceDay: DaySchedule) => {
    setBranchSchedules((prev) => {
      const current = prev[branchId] ? [...prev[branchId]] : [...DEFAULT_DAYS_SCHEDULE];
      const updated = current.map((d) => ({
        ...d,
        isOpen: sourceDay.isOpen,
        open: sourceDay.open,
        close: sourceDay.close,
      }));
      return { ...prev, [branchId]: updated };
    });
    setCopiedDay(sourceDay.dayOfWeek);
    setTimeout(() => setCopiedDay(null), 2000);
    toast.success(
      rtl
        ? `تم نسخ توقيت يوم ${sourceDay.dayNameAr} لجميع أيام الفرع`
        : `Copied ${sourceDay.dayNameEn} hours to all days of branch`
    );
  };

  const handleAutoGenerateSummaries = () => {
    const activeList = branches.filter((b) => b.isActive !== false);
    if (activeList.length === 0) return;

    const weekdayParts: string[] = [];
    const fridayParts: string[] = [];
    let minOpenHour = "23:59";
    let maxCloseHour = "00:00";

    for (const b of activeList) {
      const sched = branchSchedules[b.id] || DEFAULT_DAYS_SCHEDULE;
      const bTitle = b.nameAr || b.name;

      const weekdays = sched.filter((d) => d.dayOfWeek !== 5);
      const openWeekdays = weekdays.filter((d) => d.isOpen);

      if (openWeekdays.length === 0) {
        weekdayParts.push(`${bTitle}: مغلق طوال الأسبوع`);
      } else {
        const first = openWeekdays[0];
        weekdayParts.push(
          `${bTitle}: ${formatTime12h(first.open)} - ${formatTime12h(first.close)}`
        );
        openWeekdays.forEach((d) => {
          if (d.open < minOpenHour) minOpenHour = d.open;
          if (d.close > maxCloseHour) maxCloseHour = d.close;
        });
      }

      const fri = sched.find((d) => d.dayOfWeek === 5) || {
        isOpen: false,
        open: "14:00",
        close: "22:00",
      };
      if (!fri.isOpen) {
        fridayParts.push(`${bTitle}: مغلق`);
      } else {
        fridayParts.push(
          `${bTitle}: ${formatTime12h(fri.open)} - ${formatTime12h(fri.close)}`
        );
        if (fri.open < minOpenHour) minOpenHour = fri.open;
        if (fri.close > maxCloseHour) maxCloseHour = fri.close;
      }
    }

    const firstW = weekdayParts[0]?.split(": ")[1];
    const allWSame =
      weekdayParts.length > 1 &&
      weekdayParts.every((p) => p.split(": ")[1] === firstW);
    const summaryWeekdays = allWSame
      ? `السبت - الخميس: ${firstW}`
      : weekdayParts.join(" | ");

    const firstF = fridayParts[0]?.split(": ")[1];
    const allFSame =
      fridayParts.length > 1 &&
      fridayParts.every((p) => p.split(": ")[1] === firstF);
    const summaryFriday = allFSame
      ? firstF === "مغلق"
        ? "الجمعة: مغلق"
        : `الجمعة: ${firstF}`
      : fridayParts.join(" | ");

    setWorkingHoursWeekdays(summaryWeekdays);
    setWorkingHoursFriday(summaryFriday);

    if (minOpenHour !== "23:59") setBookingStartTime(minOpenHour);
    if (maxCloseHour !== "00:00") setBookingEndTime(maxCloseHour);

    toast.success(
      rtl
        ? "تم تحديث ملخص أوقات العمل تلقائياً"
        : "Working hours summary updated automatically"
    );
  };

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const payload = {
        salon_address: salonAddress,
        salon_phone: salonPhone,
        whatsapp_number: whatsappNumber,
        order_notification_whatsapp: whatsappNotification,
        delivery_fee: deliveryFee,
        working_hours_weekdays: workingHoursWeekdays,
        working_hours_friday: workingHoursFriday,
        instagram_url: instagramUrl,
        facebook_url: facebookUrl,
        tiktok_url: tiktokUrl,
        google_maps_url: googleMapsUrl,
        booking_start_time: bookingStartTime,
        booking_end_time: bookingEndTime,
        hero_image_1: heroImage1,
        hero_image_2: heroImage2,
        hero_image_3: heroImage3,
        branch_working_hours: JSON.stringify(branchSchedules),
      };
      const [settingsRes] = await Promise.all([
        fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
        ...branches.map((b) =>
          fetch("/api/branches", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: b.id,
              name: b.name,
              nameAr: b.nameAr,
              workingHours: branchSchedules[b.id] || DEFAULT_DAYS_SCHEDULE,
            }),
          }).catch((err) => console.error("Failed to update branch working hours:", b.id, err))
        ),
      ]);

      if (settingsRes.ok) {
        toast.success(rtl ? "تم حفظ الإعدادات ومواعيد الفروع بنجاح" : "Settings and branch schedules saved successfully");
      } else {
        toast.error(rtl ? "فشل في حفظ الإعدادات" : "Failed to save settings");
      }
    } catch (err) {
      console.error("Failed to save settings", err);
      toast.error(rtl ? "حدث خطأ أثناء حفظ الإعدادات" : "An error occurred while saving settings");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, imageNum: 1 | 2 | 3) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (imageNum === 1) setIsUploading1(true);
    if (imageNum === 2) setIsUploading2(true);
    if (imageNum === 3) setIsUploading3(true);

    try {
      const publicUrl = await uploadImage(file, "saloon_uploads", "hero");
      if (imageNum === 1) setHeroImage1(publicUrl);
      if (imageNum === 2) setHeroImage2(publicUrl);
      if (imageNum === 3) setHeroImage3(publicUrl);
      toast.success(rtl ? "تم رفع الصورة بنجاح" : "Image uploaded successfully");
    } catch (err) {
      console.error("Image upload failed:", err);
      toast.error(rtl ? "فشل في رفع الصورة" : "Failed to upload image");
    } finally {
      if (imageNum === 1) setIsUploading1(false);
      if (imageNum === 2) setIsUploading2(false);
      if (imageNum === 3) setIsUploading3(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!password || password.length < 6) {
      alert(rtl ? "يجب أن تكون كلمة المرور 6 أحرف على الأقل" : "Password must be at least 6 characters");
      return;
    }
    setIsUpdatingPassword(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        alert(rtl ? "تم تحديث كلمة المرور بنجاح" : "Password updated successfully");
        setPassword("");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update password");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSaveUser = async () => {
    try {
      const res = editingUser
        ? await fetch(`/api/users/${editingUser.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userForm),
          })
        : await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userForm),
          });

      if (!res.ok) {
        const errorData = await res.json();
        toast.error(errorData.error || (rtl ? "فشل في حفظ المستخدم" : "Failed to save user"));
        return;
      }

      toast.success(editingUser
        ? (rtl ? "تم تحديث المستخدم بنجاح" : "User updated successfully")
        : (rtl ? "تم إضافة المستخدم بنجاح" : "User added successfully")
      );
      fetchUsers();
      setUserDialogOpen(false);
    } catch (err) {
      console.error("Failed to save user", err);
      toast.error(rtl ? "حدث خطأ غير متوقع" : "An unexpected error occurred");
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm(rtl ? "هل أنت متأكد من حذف هذا المستخدم؟" : "Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const errorData = await res.json();
        toast.error(errorData.error || (rtl ? "فشل في حذف المستخدم" : "Failed to delete user"));
        return;
      }
      toast.success(rtl ? "تم حذف المستخدم بنجاح" : "User deleted successfully");
      fetchUsers();
    } catch (err) {
      console.error("Failed to delete user", err);
      toast.error(rtl ? "حدث خطأ أثناء حذف المستخدم" : "An error occurred while deleting user");
    }
  };

  const openUserDialog = (user?: AppUserRole) => {
    if (user) {
      setEditingUser(user);
      setUserForm({ name: user.name, email: user.email, role: user.role, permissions: user.permissions || [], password: "" });
    } else {
      setEditingUser(null);
      setUserForm({ name: "", email: "", role: "team", permissions: [], password: "" });
    }
    setUserDialogOpen(true);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto" dir={rtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="space-y-1">
        <h2 className={cn("text-2xl font-bold tracking-tight", rtl && "font-arabic")}>
          {t(locale, "nav.settings")}
        </h2>
        <p className={cn("text-muted-foreground text-sm", rtl && "font-arabic")}>
          {rtl ? "إدارة إعدادات الصالون وصلاحيات فريق العمل" : "Manage salon settings and team permissions"}
        </p>
      </div>

      {userRole === "demo" && (
        <div className="bg-amber-500/15 border border-amber-500/30 rounded-lg p-4 text-amber-800 dark:text-amber-300 text-sm font-medium flex items-center gap-3 shadow-sm">
          <div className="p-2 rounded-md bg-amber-500/20 shrink-0">
            <Settings className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="font-bold">
              {rtl ? "وضع العرض التوضيحي (معاينة فقط)" : "Demo Mode (Preview Only)"}
            </p>
            <p className="text-xs sm:text-sm mt-0.5">
              {rtl
                ? "تنبيه: أنت في وضع العرض التوضيحي. جميع الإعدادات أصبحت للعرض فقط وتم تعطيل عمليات الحفظ والتعديل."
                : "Alert: You are in Demo Mode. All settings are read-only and save/edit operations are disabled."}
            </p>
          </div>
        </div>
      )}

      <Tabs defaultValue="hours" dir={rtl ? "rtl" : "ltr"} className="space-y-6">
        {/* Navigation Tabs Bar - Centered */}
        <div className="flex items-center justify-center w-full">
          <TabsList className="bg-muted/80 p-1.5 rounded-xl h-auto inline-flex flex-wrap items-center justify-center gap-1.5 border border-border/50 shadow-xs mx-auto">
            <TabsTrigger
              value="hours"
              className={cn(
                "rounded-lg px-4 py-2.5 text-xs sm:text-sm font-semibold gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all",
                rtl && "font-arabic"
              )}
            >
              <Clock className="w-4 h-4 text-primary" />
              {rtl ? "مواعيد العمل والفروع" : "Working Hours"}
            </TabsTrigger>
            <TabsTrigger
              value="general"
              className={cn(
                "rounded-lg px-4 py-2.5 text-xs sm:text-sm font-semibold gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all",
                rtl && "font-arabic"
              )}
            >
              <Settings className="w-4 h-4 text-primary" />
              {rtl ? "الإعدادات والتواصل" : "General & Contact"}
            </TabsTrigger>
            {userRole !== "demo" && (
              <TabsTrigger
                value="team"
                className={cn(
                  "rounded-lg px-4 py-2.5 text-xs sm:text-sm font-semibold gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all",
                  rtl && "font-arabic"
                )}
              >
                <Users className="w-4 h-4 text-primary" />
                {rtl ? "فريق العمل" : "Team"}
              </TabsTrigger>
            )}
            <TabsTrigger
              value="hero"
              className={cn(
                "rounded-lg px-4 py-2.5 text-xs sm:text-sm font-semibold gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all",
                rtl && "font-arabic"
              )}
            >
              <ImageIcon className="w-4 h-4 text-primary" />
              {rtl ? "صور الموقع" : "Hero Images"}
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className={cn(
                "rounded-lg px-4 py-2.5 text-xs sm:text-sm font-semibold gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all",
                rtl && "font-arabic"
              )}
            >
              <Lock className="w-4 h-4 text-primary" />
              {rtl ? "الأمان وكلمة المرور" : "Security"}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: Branch Working Hours & Booking */}
        <TabsContent value="hours" className="space-y-6 outline-none">
          <div className="space-y-6">
            {/* Branch Schedule Card */}
            <Card className="shadow-sm border-primary/20">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className={cn("flex items-center gap-2", rtl && "font-arabic")}>
                      <Clock className="w-5 h-5 text-primary" />
                      {rtl ? "مواعيد وساعات العمل بالفروع" : "Branch Working Hours"}
                    </CardTitle>
                    <CardDescription className={cn("mt-1", rtl && "font-arabic")}>
                      {rtl
                        ? "تخصيص ساعات الفتح والإغلاق وأيام الإجازات لكل فرع على حدة"
                        : "Customize open/close hours and days off for each branch"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Branch Selection Pills */}
                {branches.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 p-2 bg-muted/40 rounded-xl border border-border/60">
                    <span className={cn("text-xs font-semibold px-2 text-muted-foreground flex items-center gap-1.5", rtl && "font-arabic")}>
                      <Building2 className="w-4 h-4 text-primary" />
                      {rtl ? "اختر الفرع:" : "Select Branch:"}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {branches.map((branch) => {
                        const isSelected = (selectedBranchId || branches[0]?.id) === branch.id;
                        return (
                          <Button
                            key={branch.id}
                            type="button"
                            size="sm"
                            variant={isSelected ? "default" : "outline"}
                            onClick={() => setSelectedBranchId(branch.id)}
                            className={cn("h-8 gap-1.5 text-xs font-medium transition-all shadow-xs", rtl && "font-arabic")}
                          >
                            <Building2 className="w-3.5 h-3.5" />
                            {branch.nameAr || branch.name}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Days Table for Selected Branch */}
                {isLoadingBranches ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className={cn("text-sm", rtl && "font-arabic")}>{rtl ? "جارِ تحميل بيانات الفروع ومواعيدها..." : "Loading schedules..."}</span>
                  </div>
                ) : (
                  (() => {
                    const activeBranchId = selectedBranchId || branches[0]?.id || "";
                    const schedule = branchSchedules[activeBranchId] || DEFAULT_DAYS_SCHEDULE;
                    const activeBranch = branches.find((b) => b.id === activeBranchId);

                    return (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className={cn("text-sm font-semibold flex items-center gap-2", rtl && "font-arabic")}>
                            <span>{rtl ? "جدول أيام الأسبوع لـ:" : "Weekly schedule for:"}</span>
                            <span className="text-primary font-bold">{activeBranch?.nameAr || activeBranch?.name || (rtl ? "الفرع الحالي" : "Current Branch")}</span>
                          </h4>
                          <p className={cn("text-xs text-muted-foreground", rtl && "font-arabic")}>
                            {rtl ? "ملاحظة: يمكنك إغلاق أي يوم (إجازة) أو تعديل أوقات الفتح والإغلاق" : "Toggle open/close or edit hours"}
                          </p>
                        </div>

                        <div className="border rounded-xl divide-y overflow-hidden bg-card">
                          {schedule.map((day) => {
                            const isCopied = copiedDay === day.dayOfWeek;
                            return (
                              <div
                                key={day.dayOfWeek}
                                className={cn(
                                  "flex flex-col sm:flex-row sm:items-center justify-between p-3.5 gap-3 transition-colors",
                                  !day.isOpen && "bg-muted/20 opacity-75"
                                )}
                              >
                                {/* Right side: Switch + Day name + Badge */}
                                <div className="flex items-center gap-3.5 min-w-[200px]">
                                  <div dir="ltr" className="shrink-0">
                                    <Switch
                                      id={`switch-day-${day.dayOfWeek}`}
                                      checked={day.isOpen}
                                      onCheckedChange={(checked) =>
                                        handleDayChange(activeBranchId, day.dayOfWeek, "isOpen", checked)
                                      }
                                      disabled={userRole === "demo"}
                                    />
                                  </div>
                                  <Label
                                    htmlFor={`switch-day-${day.dayOfWeek}`}
                                    className={cn("text-sm font-semibold cursor-pointer select-none min-w-[60px]", rtl && "font-arabic")}
                                  >
                                    {rtl ? day.dayNameAr : day.dayNameEn}
                                  </Label>
                                  <span
                                    className={cn(
                                      "text-[11px] px-2.5 py-0.5 rounded-md font-medium shrink-0 transition-colors",
                                      day.isOpen
                                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                                        : "bg-muted text-muted-foreground border border-border/50"
                                    )}
                                  >
                                    {day.isOpen ? (rtl ? "مفتوح" : "Open") : (rtl ? "إجازة" : "Closed")}
                                  </span>
                                </div>

                                {/* Left side: Hours Controls */}
                                {day.isOpen ? (
                                  <div className="flex flex-wrap items-center gap-3 sm:justify-end flex-1">
                                    <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-1 rounded-lg border border-border/40">
                                      <span className={cn("text-xs text-muted-foreground whitespace-nowrap", rtl && "font-arabic")}>
                                        {rtl ? "من:" : "From:"}
                                      </span>
                                      <Input
                                        type="time"
                                        value={day.open}
                                        onChange={(e) =>
                                          handleDayChange(activeBranchId, day.dayOfWeek, "open", e.target.value)
                                        }
                                        className="w-28 h-7 text-xs text-center bg-background"
                                        dir="ltr"
                                        disabled={userRole === "demo"}
                                      />
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-1 rounded-lg border border-border/40">
                                      <span className={cn("text-xs text-muted-foreground whitespace-nowrap", rtl && "font-arabic")}>
                                        {rtl ? "إلى:" : "To:"}
                                      </span>
                                      <Input
                                        type="time"
                                        value={day.close}
                                        onChange={(e) =>
                                          handleDayChange(activeBranchId, day.dayOfWeek, "close", e.target.value)
                                        }
                                        className="w-28 h-7 text-xs text-center bg-background"
                                        dir="ltr"
                                        disabled={userRole === "demo"}
                                      />
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleCopyHoursToAllDays(activeBranchId, day)}
                                      disabled={userRole === "demo"}
                                      title={rtl ? "تطبيق هذه الساعات على باقي الأيام" : "Copy hours to all other days"}
                                      className={cn("h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground hover:bg-muted", rtl && "font-arabic")}
                                    >
                                      {isCopied ? (
                                        <>
                                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">{rtl ? "تم النسخ!" : "Copied!"}</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3.5 h-3.5" />
                                          <span>{rtl ? "نسخ للكل" : "Copy"}</span>
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center sm:justify-end flex-1 text-xs text-muted-foreground py-1">
                                    <span className={cn("italic", rtl && "font-arabic")}>
                                      {rtl ? "يوم عطلة / إجازة رسمية للفرع" : "Closed / Day off for this branch"}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()
                )}
              </CardContent>
            </Card>

            {/* Bot & Website Summaries Card */}
            <Card className="shadow-sm border-primary/20">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className={cn("flex items-center gap-2", rtl && "font-arabic")}>
                      <Sparkles className="w-5 h-5 text-primary" />
                      {rtl ? "ملخص نصوص مواعيد العمل (للبوت وموقع الويب)" : "Summary Text for Bot & Storefront"}
                    </CardTitle>
                    <CardDescription className={cn("mt-1", rtl && "font-arabic")}>
                      {rtl
                        ? "هذه النصوص يقرأها بوت الواتساب n8n وتظهر بتذييل الموقع. يمكنك تحديثها تلقائياً أو تعديلها يدوياً."
                        : "Used directly by WhatsApp n8n bot and storefront footer."}
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAutoGenerateSummaries}
                    disabled={userRole === "demo"}
                    className={cn("gap-1.5 shrink-0 border-primary/30 hover:bg-primary/10", rtl && "font-arabic")}
                    title={rtl ? "توليد ملخص أوتوماتيكي بناءً على مواعيد الفرع المحدد" : "Auto-generate text summary from branch hours"}
                  >
                    <Sparkles className="w-4 h-4 text-primary" />
                    {rtl ? "تحديث الملخص تلقائياً" : "Auto-generate Summary"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className={cn(rtl && "font-arabic")}>{rtl ? "ملخص أيام الأسبوع (Weekdays)" : "Weekday Hours Summary"}</Label>
                    <Input
                      value={workingHoursWeekdays}
                      onChange={(e) => setWorkingHoursWeekdays(e.target.value)}
                      placeholder="السبت - الخميس: 01:00 م - 10:00 م"
                      className={cn(rtl && "font-arabic text-right")}
                      dir={rtl ? "rtl" : "ltr"}
                      disabled={userRole === "demo"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className={cn(rtl && "font-arabic")}>{rtl ? "ملخص يوم الجمعة (Friday)" : "Friday Hours Summary"}</Label>
                    <Input
                      value={workingHoursFriday}
                      onChange={(e) => setWorkingHoursFriday(e.target.value)}
                      placeholder="الجمعة: 01:00 م - 10:00 م (أو مغلق)"
                      className={cn(rtl && "font-arabic text-right")}
                      dir={rtl ? "rtl" : "ltr"}
                      disabled={userRole === "demo"}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                  <div className="space-y-2">
                    <Label className={cn(rtl && "font-arabic")}>{rtl ? "بداية نافذة الحجز العامة" : "Global Booking Start"}</Label>
                    <Input
                      type="time"
                      value={bookingStartTime}
                      onChange={(e) => setBookingStartTime(e.target.value)}
                      dir="ltr"
                      disabled={userRole === "demo"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className={cn(rtl && "font-arabic")}>{rtl ? "نهاية نافذة الحجز العامة" : "Global Booking End"}</Label>
                    <Input
                      type="time"
                      value={bookingEndTime}
                      onChange={(e) => setBookingEndTime(e.target.value)}
                      dir="ltr"
                      disabled={userRole === "demo"}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSaveSettings}
                  disabled={isSavingSettings || userRole === "demo"}
                  className={cn("w-full gap-2 shadow-sm", rtl && "font-arabic")}
                >
                  {isSavingSettings ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {rtl ? "جارِ الحفظ والمزامنة..." : "Saving..."}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {rtl ? "حفظ مواعيد العمل والإعدادات" : "Save Working Hours & Settings"}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: General Settings & Contact Info */}
        <TabsContent value="general" className="outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* General Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle className={cn("flex items-center gap-2", rtl && "font-arabic")}>
                  <Settings className="w-5 h-5 text-primary" />
                  {rtl ? "الإعدادات العامة" : "General Settings"}
                </CardTitle>
                <CardDescription className={cn(rtl && "font-arabic")}>
                  {rtl ? "تفاصيل الصالون وإعدادات الإشعارات" : "Salon details and notification settings"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address" className={cn(rtl && "font-arabic")}>
                    {rtl ? "عنوان الصالون التفصيلي" : "Salon Address"}
                  </Label>
                  <Input
                    id="address"
                    value={salonAddress}
                    onChange={(e) => setSalonAddress(e.target.value)}
                    placeholder={rtl ? "شارع مكة، عمّان..." : "123 Main St..."}
                    className={cn(rtl && "font-arabic text-right")}
                    dir={rtl ? "rtl" : "ltr"}
                    disabled={userRole === "demo"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp" className={cn(rtl && "font-arabic")}>
                    {rtl ? "رقم واتساب لإشعارات الطلبات" : "WhatsApp Number for Order Notifications"}
                  </Label>
                  <Input
                    id="whatsapp"
                    value={whatsappNotification}
                    onChange={(e) => setWhatsappNotification(e.target.value)}
                    placeholder="962790000000"
                    dir="ltr"
                    disabled={userRole === "demo"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryFee" className={cn(rtl && "font-arabic")}>
                    {rtl ? "رسوم التوصيل (ر.س)" : "Delivery Fee (SAR)"}
                  </Label>
                  <Input
                    id="deliveryFee"
                    type="number"
                    step="0.5"
                    min="0"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(e.target.value)}
                    placeholder="2"
                    dir="ltr"
                    disabled={userRole === "demo"}
                  />
                  <p className={cn("text-xs text-muted-foreground", rtl && "font-arabic")}>
                    {rtl ? "رسوم التوصيل التي تظهر في صفحة الدفع بالموقع" : "Delivery fee shown on website checkout"}
                  </p>
                </div>
                <Button
                  onClick={handleSaveSettings}
                  disabled={isSavingSettings || userRole === "demo"}
                  className={cn("w-full gap-2", rtl && "font-arabic")}
                >
                  <Save className="w-4 h-4" />
                  {rtl ? "حفظ الإعدادات العامة" : "Save General Settings"}
                </Button>
              </CardContent>
            </Card>

            {/* Contact Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className={cn("flex items-center gap-2", rtl && "font-arabic")}>
                  <Globe className="w-5 h-5 text-primary" />
                  {rtl ? "معلومات التواصل والسوشال" : "Contact & Social Media"}
                </CardTitle>
                <CardDescription className={cn(rtl && "font-arabic")}>
                  {rtl ? "أرقام الهاتف وروابط السوشال ميديا" : "Phone numbers and social media links"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className={cn(rtl && "font-arabic")}>{rtl ? "رقم الهاتف" : "Phone Number"}</Label>
                    <Input value={salonPhone} onChange={(e) => setSalonPhone(e.target.value)} placeholder="962786753791" dir="ltr" disabled={userRole === "demo"} />
                  </div>
                  <div className="space-y-2">
                    <Label className={cn(rtl && "font-arabic")}>{rtl ? "رقم واتساب" : "WhatsApp Number"}</Label>
                    <Input value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="962786753791" dir="ltr" disabled={userRole === "demo"} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className={cn(rtl && "font-arabic")}>{rtl ? "رابط انستغرام" : "Instagram URL"}</Label>
                    <Input value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/..." dir="ltr" disabled={userRole === "demo"} />
                  </div>
                  <div className="space-y-2">
                    <Label className={cn(rtl && "font-arabic")}>{rtl ? "رابط فيسبوك" : "Facebook URL"}</Label>
                    <Input value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} placeholder="https://facebook.com/..." dir="ltr" disabled={userRole === "demo"} />
                  </div>
                  <div className="space-y-2">
                    <Label className={cn(rtl && "font-arabic")}>{rtl ? "رابط تيك توك" : "TikTok URL"}</Label>
                    <Input value={tiktokUrl} onChange={(e) => setTiktokUrl(e.target.value)} placeholder="https://tiktok.com/..." dir="ltr" disabled={userRole === "demo"} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className={cn(rtl && "font-arabic")}>{rtl ? "رابط خريطة Google Maps" : "Google Maps Embed URL"}</Label>
                  <Input value={googleMapsUrl} onChange={(e) => setGoogleMapsUrl(e.target.value)} placeholder="https://www.google.com/maps/embed?pb=..." dir="ltr" disabled={userRole === "demo"} />
                  <p className={cn("text-xs text-muted-foreground", rtl && "font-arabic")}>
                    {rtl ? "انسخي رابط التضمين من Google Maps" : "Paste the embed URL from Google Maps"}
                  </p>
                </div>
                <Button onClick={handleSaveSettings} disabled={isSavingSettings || userRole === "demo"} className={cn("w-full gap-2", rtl && "font-arabic")}>
                  <Save className="w-4 h-4" />
                  {rtl ? "حفظ بيانات التواصل" : "Save Contact Info"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 3: Team Management */}
        {userRole !== "demo" && (
          <TabsContent value="team" className="outline-none">
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className={cn("flex items-center gap-2", rtl && "font-arabic")}>
                      <Users className="w-5 h-5 text-primary" />
                      {rtl ? "إدارة فريق العمل" : "Team Management"}
                    </CardTitle>
                    <CardDescription className={cn(rtl && "font-arabic")}>
                      {rtl ? "صلاحيات الوصول للوحة التحكم" : "Dashboard access permissions"}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openUserDialog()} className={cn("gap-1.5", rtl && "font-arabic")}>
                    <Plus className="w-4 h-4" />
                    {rtl ? "إضافة عضو" : "Add Member"}
                  </Button>
                </CardHeader>
                <CardContent>
                  {isLoadingUsers ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                  ) : users.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      {rtl ? "لا يوجد أعضاء في الفريق" : "No team members found"}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {users.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                          <div>
                            <p className="font-medium text-sm">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                            <span className={cn("inline-block mt-1 px-2 py-0.5 text-[10px] font-medium rounded-full",
                              user.role === 'admin' ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                            )}>
                              {user.role.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openUserDialog(user)} className="h-8 w-8">
                              <Settings className="w-4 h-4 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)} className="h-8 w-8 hover:bg-red-50 hover:text-red-600">
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* TAB 4: Hero Section Images */}
        <TabsContent value="hero" className="outline-none">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className={cn("flex items-center gap-2", rtl && "font-arabic")}>
                  <ImageIcon className="w-5 h-5 text-primary" />
                  {rtl ? "صور قسم الواجهة الرئيسي" : "Hero Section Images"}
                </CardTitle>
                <CardDescription className={cn(rtl && "font-arabic")}>
                  {rtl
                    ? "تعديل الروابط الخاصة بالـ 3 صور المعروضة في واجهة الموقع الرئيسي"
                    : "Manage the URLs of the 3 images displayed in the website Hero section"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className={cn(rtl && "font-arabic")}>
                    {rtl ? "رابط الصورة الأولى (يسار علوي)" : "Image 1 URL (Top Left)"}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={heroImage1}
                      onChange={(e) => setHeroImage1(e.target.value)}
                      placeholder="/images/hero/hero_salon_1.png"
                      dir="ltr"
                      className="flex-1"
                      disabled={userRole === "demo"}
                    />
                    <input
                      type="file"
                      id="hero-upload-1"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 1)}
                      className="hidden"
                      disabled={isUploading1 || userRole === "demo"}
                    />
                    <Button
                      asChild
                      variant="outline"
                      className={cn("gap-2 shrink-0 cursor-pointer", (isUploading1 || userRole === "demo") && "opacity-50 pointer-events-none")}
                    >
                      <label htmlFor="hero-upload-1" className="flex items-center gap-2 cursor-pointer">
                        {isUploading1 ? (
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        {rtl ? "رفع" : "Upload"}
                      </label>
                    </Button>
                  </div>
                  {heroImage1 && (
                    <div className="mt-2 relative w-24 h-24 rounded-lg overflow-hidden border bg-muted group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={heroImage1}
                        alt="Preview 1"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <button
                        type="button"
                        onClick={() => setHeroImage1("")}
                        disabled={userRole === "demo"}
                        className={cn("absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200", userRole === "demo" && "pointer-events-none hidden")}
                      >
                        <Trash2 className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className={cn(rtl && "font-arabic")}>
                    {rtl ? "رابط الصورة الثانية (عمود أيمن / الموبايل)" : "Image 2 URL (Right / Mobile)"}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={heroImage2}
                      onChange={(e) => setHeroImage2(e.target.value)}
                      placeholder="/images/hero/hero_salon_2.png"
                      dir="ltr"
                      className="flex-1"
                      disabled={userRole === "demo"}
                    />
                    <input
                      type="file"
                      id="hero-upload-2"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 2)}
                      className="hidden"
                      disabled={isUploading2 || userRole === "demo"}
                    />
                    <Button
                      asChild
                      variant="outline"
                      className={cn("gap-2 shrink-0 cursor-pointer", (isUploading2 || userRole === "demo") && "opacity-50 pointer-events-none")}
                    >
                      <label htmlFor="hero-upload-2" className="flex items-center gap-2 cursor-pointer">
                        {isUploading2 ? (
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        {rtl ? "رفع" : "Upload"}
                      </label>
                    </Button>
                  </div>
                  {heroImage2 && (
                    <div className="mt-2 relative w-24 h-24 rounded-lg overflow-hidden border bg-muted group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={heroImage2}
                        alt="Preview 2"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <button
                        type="button"
                        onClick={() => setHeroImage2("")}
                        disabled={userRole === "demo"}
                        className={cn("absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200", userRole === "demo" && "pointer-events-none hidden")}
                      >
                        <Trash2 className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className={cn(rtl && "font-arabic")}>
                    {rtl ? "رابط الصورة الثالثة (يسار سفلي)" : "Image 3 URL (Bottom Left)"}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={heroImage3}
                      onChange={(e) => setHeroImage3(e.target.value)}
                      placeholder="/images/hero/hero_salon_3.png"
                      dir="ltr"
                      className="flex-1"
                      disabled={userRole === "demo"}
                    />
                    <input
                      type="file"
                      id="hero-upload-3"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 3)}
                      className="hidden"
                      disabled={isUploading3 || userRole === "demo"}
                    />
                    <Button
                      asChild
                      variant="outline"
                      className={cn("gap-2 shrink-0 cursor-pointer", (isUploading3 || userRole === "demo") && "opacity-50 pointer-events-none")}
                    >
                      <label htmlFor="hero-upload-3" className="flex items-center gap-2 cursor-pointer">
                        {isUploading3 ? (
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        {rtl ? "رفع" : "Upload"}
                      </label>
                    </Button>
                  </div>
                  {heroImage3 && (
                    <div className="mt-2 relative w-24 h-24 rounded-lg overflow-hidden border bg-muted group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={heroImage3}
                        alt="Preview 3"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <button
                        type="button"
                        onClick={() => setHeroImage3("")}
                        disabled={userRole === "demo"}
                        className={cn("absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200", userRole === "demo" && "pointer-events-none hidden")}
                      >
                        <Trash2 className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleSaveSettings}
                  disabled={isSavingSettings || userRole === "demo"}
                  className={cn("w-full gap-2", rtl && "font-arabic")}
                >
                  <Save className="w-4 h-4" />
                  {rtl ? "حفظ الصور" : "Save Images"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 5: Security & Password */}
        <TabsContent value="security" className="outline-none">
          <div className="max-w-xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className={cn("flex items-center gap-2", rtl && "font-arabic")}>
                  <Lock className="w-5 h-5 text-primary" />
                  {rtl ? "تغيير كلمة المرور" : "Change Password"}
                </CardTitle>
                <CardDescription className={cn(rtl && "font-arabic")}>
                  {rtl ? "تحديث كلمة المرور الخاصة بحسابك" : "Update the password for your account"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className={cn(rtl && "font-arabic")}>
                    {rtl ? "كلمة المرور الجديدة" : "New Password"}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••"
                    dir="ltr"
                    disabled={userRole === "demo"}
                  />
                </div>
                <Button
                  onClick={handleUpdatePassword}
                  disabled={isUpdatingPassword || userRole === "demo"}
                  className={cn("w-full gap-2", rtl && "font-arabic")}
                >
                  <Save className="w-4 h-4" />
                  {rtl ? "تحديث كلمة المرور" : "Update Password"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit User Dialog */}
      {userRole !== "demo" && (
        <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
          <DialogContent className={cn("sm:max-w-md", rtl && "font-arabic")} dir={rtl ? "rtl" : "ltr"}>
            <DialogHeader className={cn(rtl && "text-right")}>
              <DialogTitle>{editingUser ? (rtl ? "تعديل المستخدم" : "Edit User") : (rtl ? "إضافة عضو جديد" : "Add New Member")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className={cn(rtl && "text-right block")}>{rtl ? "الاسم" : "Name"}</Label>
                <Input
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className={cn(rtl && "text-right font-arabic")}
                  dir={rtl ? "rtl" : "ltr"}
                />
              </div>
              <div className="space-y-2">
                <Label className={cn(rtl && "text-right block")}>{rtl ? "البريد الإلكتروني" : "Email"}</Label>
                <Input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label className={cn(rtl && "text-right block")}>{rtl ? "الصلاحية" : "Role"}</Label>
                <Select value={userForm.role} onValueChange={(val: "admin" | "team" | "demo") => setUserForm({ ...userForm, role: val })}>
                  <SelectTrigger className={cn(rtl && "font-arabic")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin" className={cn(rtl && "font-arabic")}>{rtl ? "مدير (Admin)" : "Admin"}</SelectItem>
                    <SelectItem value="team" className={cn(rtl && "font-arabic")}>{rtl ? "فريق عمل (Team)" : "Team"}</SelectItem>
                    <SelectItem value="demo" className={cn(rtl && "font-arabic")}>{rtl ? "عرض توضيحي (Demo)" : "Demo"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className={cn(rtl && "text-right block")}>
                  {rtl ? "كلمة المرور" : "Password"}
                  {editingUser && <span className="text-muted-foreground text-xs mx-2">({rtl ? "اتركه فارغاً لعدم التغيير" : "Leave blank to keep current"})</span>}
                </Label>
                <Input
                  type="password"
                  value={userForm.password || ""}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  dir="ltr"
                  placeholder="••••••"
                />
              </div>

              {userForm.role === "team" && (
                <div className="space-y-3 pt-2 border-t mt-4">
                  <Label className={cn(rtl && "text-right block")}>{rtl ? "صلاحيات الوصول (الصفحات)" : "Access Permissions (Pages)"}</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {AVAILABLE_PERMISSIONS.map((perm) => (
                      <div key={perm.id} className={cn("flex items-center space-x-2", rtl && "flex-row-reverse space-x-reverse")}>
                        <Checkbox
                          id={`perm-${perm.id}`}
                          checked={userForm.permissions.includes(perm.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setUserForm({ ...userForm, permissions: [...userForm.permissions, perm.id] });
                            } else {
                              setUserForm({ ...userForm, permissions: userForm.permissions.filter(p => p !== perm.id) });
                            }
                          }}
                        />
                        <label
                          htmlFor={`perm-${perm.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {rtl ? perm.labelAr : perm.labelEn}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUserDialogOpen(false)} className={cn(rtl && "font-arabic")}>
                {t(locale, "cancel")}
              </Button>
              <Button onClick={handleSaveUser} disabled={!userForm.name || !userForm.email || (!editingUser && !userForm.password)} className={cn(rtl && "font-arabic")}>
                {t(locale, "save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
