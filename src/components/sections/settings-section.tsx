"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { t, isRTL } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Settings, Save, Users, Trash2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [whatsappNotification, setWhatsappNotification] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("2");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
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
    { id: "catalog", labelAr: "الكتالوج", labelEn: "Catalog" },
    { id: "bookings", labelAr: "الحجوزات", labelEn: "Bookings" },
    { id: "clients", labelAr: "العملاء", labelEn: "Clients" },
    { id: "chat", labelAr: "المحادثات", labelEn: "Chat" },
    { id: "blacklist", labelAr: "القائمة السوداء", labelEn: "Blacklist" },
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
        setWhatsappNotification(data.order_notification_whatsapp || "");
        setDeliveryFee(data.delivery_fee || "2");
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
        order_notification_whatsapp: whatsappNotification,
        delivery_fee: deliveryFee,
      };
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      // Optionally show a toast here
    } catch (err) {
      console.error("Failed to save settings", err);
    } finally {
      setIsSavingSettings(false);
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
