"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { t, isRTL } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Settings, Save, Users, Trash2, Plus, Globe, Clock, Image as ImageIcon, Upload, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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

interface SystemSetting {
  key: string;
  value: string;
}

interface AppUserRole {
  id: string;
  name: string;
  email: string;
  role: "admin" | "team";
  permissions: string[];
}

export function SettingsSection() {
  const { locale } = useAppStore();
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

  // Users State
  const [users, setUsers] = useState<AppUserRole[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUserRole | null>(null);
  const [userForm, setUserForm] = useState<{name: string, email: string, role: "admin" | "team", password?: string, permissions: string[]}>({ name: "", email: "", role: "team", permissions: [] });

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
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSalonAddress(data.salon_address || "");
        setSalonPhone(data.salon_phone || "");
        setWhatsappNumber(data.whatsapp_number || "");
        setWhatsappNotification(data.order_notification_whatsapp || "");
        setDeliveryFee(data.delivery_fee || "2");
        setWorkingHoursWeekdays(data.working_hours_weekdays || "");
        setWorkingHoursFriday(data.working_hours_friday || "");
        setInstagramUrl(data.instagram_url || "");
        setFacebookUrl(data.facebook_url || "");
        setTiktokUrl(data.tiktok_url || "");
        setGoogleMapsUrl(data.google_maps_url || "");
        setBookingStartTime(data.booking_start_time || "09:00");
        setBookingEndTime(data.booking_end_time || "20:00");
        setHeroImage1(data.hero_image_1 || "");
        setHeroImage2(data.hero_image_2 || "");
        setHeroImage3(data.hero_image_3 || "");
      }
    } catch (err) {
      console.error("Failed to fetch settings", err);
    }
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
      };
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(rtl ? "تم حفظ الإعدادات بنجاح" : "Settings saved successfully");
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
      if (editingUser) {
        await fetch(`/api/users/${editingUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userForm),
        });
      } else {
        await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userForm),
        });
      }
      fetchUsers();
      setUserDialogOpen(false);
    } catch (err) {
      console.error("Failed to save user", err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm(rtl ? "هل أنت متأكد من حذف هذا المستخدم؟" : "Are you sure you want to delete this user?")) return;
    try {
      await fetch(`/api/users/${id}`, { method: "DELETE" });
      fetchUsers();
    } catch (err) {
      console.error("Failed to delete user", err);
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
    <div className="space-y-6" dir={rtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="space-y-1">
        <h2 className={cn("text-2xl font-bold tracking-tight", rtl && "font-arabic")}>
          {t(locale, "nav.settings")}
        </h2>
        <p className={cn("text-muted-foreground text-sm", rtl && "font-arabic")}>
          {rtl ? "إدارة إعدادات الصالون وصلاحيات فريق العمل" : "Manage salon settings and team permissions"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className={cn("flex items-center gap-2", rtl && "font-arabic")}>
              <Settings className="w-5 h-5 text-primary" />
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
              />
            </div>
            <Button
              onClick={handleUpdatePassword}
              disabled={isUpdatingPassword}
              className={cn("w-full gap-2", rtl && "font-arabic")}
            >
              <Save className="w-4 h-4" />
              {rtl ? "تحديث كلمة المرور" : "Update Password"}
            </Button>
          </CardContent>
        </Card>

        {/* General Settings */}
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliveryFee" className={cn(rtl && "font-arabic")}>
                {rtl ? "رسوم التوصيل (د.أ)" : "Delivery Fee (JOD)"}
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
              />
              <p className={cn("text-xs text-muted-foreground", rtl && "font-arabic")}>
                {rtl ? "رسوم التوصيل التي تظهر في صفحة الدفع بالموقع" : "Delivery fee shown on website checkout"}
              </p>
            </div>
            <Button
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
              className={cn("w-full gap-2", rtl && "font-arabic")}
            >
              <Save className="w-4 h-4" />
              {rtl ? "حفظ الإعدادات" : "Save Settings"}
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
                <Input value={salonPhone} onChange={(e) => setSalonPhone(e.target.value)} placeholder="962786753791" dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label className={cn(rtl && "font-arabic")}>{rtl ? "رقم واتساب" : "WhatsApp Number"}</Label>
                <Input value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="962786753791" dir="ltr" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className={cn(rtl && "font-arabic")}>{rtl ? "رابط انستغرام" : "Instagram URL"}</Label>
                <Input value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/..." dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label className={cn(rtl && "font-arabic")}>{rtl ? "رابط فيسبوك" : "Facebook URL"}</Label>
                <Input value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} placeholder="https://facebook.com/..." dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label className={cn(rtl && "font-arabic")}>{rtl ? "رابط تيك توك" : "TikTok URL"}</Label>
                <Input value={tiktokUrl} onChange={(e) => setTiktokUrl(e.target.value)} placeholder="https://tiktok.com/..." dir="ltr" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className={cn(rtl && "font-arabic")}>{rtl ? "رابط خريطة Google Maps" : "Google Maps Embed URL"}</Label>
              <Input value={googleMapsUrl} onChange={(e) => setGoogleMapsUrl(e.target.value)} placeholder="https://www.google.com/maps/embed?pb=..." dir="ltr" />
              <p className={cn("text-xs text-muted-foreground", rtl && "font-arabic")}>
                {rtl ? "انسخي رابط التضمين من Google Maps" : "Paste the embed URL from Google Maps"}
              </p>
            </div>
            <Button onClick={handleSaveSettings} disabled={isSavingSettings} className={cn("w-full gap-2", rtl && "font-arabic")}>
              <Save className="w-4 h-4" />
              {rtl ? "حفظ" : "Save"}
            </Button>
          </CardContent>
        </Card>

        {/* Working Hours & Booking Card */}
        <Card>
          <CardHeader>
            <CardTitle className={cn("flex items-center gap-2", rtl && "font-arabic")}>
              <Clock className="w-5 h-5 text-primary" />
              {rtl ? "أوقات العمل والحجز" : "Working Hours & Booking"}
            </CardTitle>
            <CardDescription className={cn(rtl && "font-arabic")}>
              {rtl ? "تظهر في الموقع وصفحة الحجز" : "Displayed on website and booking page"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className={cn(rtl && "font-arabic")}>{rtl ? "أوقات العمل (أيام الأسبوع)" : "Weekday Hours"}</Label>
              <Input value={workingHoursWeekdays} onChange={(e) => setWorkingHoursWeekdays(e.target.value)} placeholder="السبت - الخميس: 10:00 ص - 8:00 م" className={cn(rtl && "font-arabic text-right")} dir={rtl ? "rtl" : "ltr"} />
            </div>
            <div className="space-y-2">
              <Label className={cn(rtl && "font-arabic")}>{rtl ? "أوقات العمل (الجمعة)" : "Friday Hours"}</Label>
              <Input value={workingHoursFriday} onChange={(e) => setWorkingHoursFriday(e.target.value)} placeholder="الجمعة: مغلق" className={cn(rtl && "font-arabic text-right")} dir={rtl ? "rtl" : "ltr"} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={cn(rtl && "font-arabic")}>{rtl ? "بداية أوقات الحجز" : "Booking Start"}</Label>
                <Input type="time" value={bookingStartTime} onChange={(e) => setBookingStartTime(e.target.value)} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label className={cn(rtl && "font-arabic")}>{rtl ? "نهاية أوقات الحجز" : "Booking End"}</Label>
                <Input type="time" value={bookingEndTime} onChange={(e) => setBookingEndTime(e.target.value)} dir="ltr" />
              </div>
            </div>
            <Button onClick={handleSaveSettings} disabled={isSavingSettings} className={cn("w-full gap-2", rtl && "font-arabic")}>
              <Save className="w-4 h-4" />
              {rtl ? "حفظ" : "Save"}
            </Button>
          </CardContent>
        </Card>

        {/* Team Management */}
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

        {/* Hero Section Images */}
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
                />
                <input
                  type="file"
                  id="hero-upload-1"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 1)}
                  className="hidden"
                  disabled={isUploading1}
                />
                <Button
                  asChild
                  variant="outline"
                  className={cn("gap-2 shrink-0 cursor-pointer", isUploading1 && "opacity-50 pointer-events-none")}
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
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
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
                />
                <input
                  type="file"
                  id="hero-upload-2"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 2)}
                  className="hidden"
                  disabled={isUploading2}
                />
                <Button
                  asChild
                  variant="outline"
                  className={cn("gap-2 shrink-0 cursor-pointer", isUploading2 && "opacity-50 pointer-events-none")}
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
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
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
                />
                <input
                  type="file"
                  id="hero-upload-3"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 3)}
                  className="hidden"
                  disabled={isUploading3}
                />
                <Button
                  asChild
                  variant="outline"
                  className={cn("gap-2 shrink-0 cursor-pointer", isUploading3 && "opacity-50 pointer-events-none")}
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
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <Trash2 className="w-5 h-5 text-white" />
                  </button>
                </div>
              )}
            </div>
            <Button
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
              className={cn("w-full gap-2", rtl && "font-arabic")}
            >
              <Save className="w-4 h-4" />
              {rtl ? "حفظ الصور" : "Save Images"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit User Dialog */}
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
              <Select value={userForm.role} onValueChange={(val: "admin" | "team") => setUserForm({ ...userForm, role: val })}>
                <SelectTrigger className={cn(rtl && "font-arabic")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin" className={cn(rtl && "font-arabic")}>{rtl ? "مدير (Admin)" : "Admin"}</SelectItem>
                  <SelectItem value="team" className={cn(rtl && "font-arabic")}>{rtl ? "فريق عمل (Team)" : "Team"}</SelectItem>
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
    </div>
  );
}
