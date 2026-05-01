"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { t, isRTL } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  UserCog,
  Plus,
  Search,
  Pencil,
  Trash2,
  Clock,
  Phone,
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Staff {
  id: string;
  name: string;
  phone: string;
  role: string;
  avatar: string;
  isActive: boolean;
  services: string[];
  createdAt: string;
}

interface ScheduleEntry {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isOff: boolean;
}

interface Product {
  id: string;
  name: string;
  category: string;
}

const ROLES = ["stylist", "nail_tech", "manager", "receptionist"];

const DAY_NAMES_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_NAMES_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

const DEFAULT_SCHEDULE: ScheduleEntry[] = Array.from({ length: 7 }, (_, i) => ({
  dayOfWeek: i,
  startTime: "09:00",
  endTime: "18:00",
  isOff: i === 5, // Friday off by default
}));

// ─── Component ────────────────────────────────────────────────────────────────

export function StaffSection() {
  const { locale } = useAppStore();
  const rtl = isRTL(locale);

  // Data state
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Schedule dialog
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleStaffId, setScheduleStaffId] = useState<string | null>(null);
  const [scheduleStaffName, setScheduleStaffName] = useState("");
  const [schedule, setSchedule] = useState<ScheduleEntry[]>(DEFAULT_SCHEDULE);
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formRole, setFormRole] = useState("stylist");
  const [formActive, setFormActive] = useState(true);
  const [formServices, setFormServices] = useState<string[]>([]);

  // ─── Fetch Data ──────────────────────────────────────────────────────────────

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/staff");
      const data = await res.json();
      setStaffList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch staff:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    }
  };

  useEffect(() => {
    fetchStaff();
    fetchProducts();
  }, []);

  // ─── Filtered list ───────────────────────────────────────────────────────────

  const filteredStaff = useMemo(() => {
    if (!searchQuery.trim()) return staffList;
    const q = searchQuery.toLowerCase();
    return staffList.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q)
    );
  }, [staffList, searchQuery]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const openAddDialog = () => {
    setEditingStaff(null);
    setFormName("");
    setFormPhone("");
    setFormRole("stylist");
    setFormActive(true);
    setFormServices([]);
    setDialogOpen(true);
  };

  const openEditDialog = (staff: Staff) => {
    setEditingStaff(staff);
    setFormName(staff.name);
    setFormPhone(staff.phone);
    setFormRole(staff.role);
    setFormActive(staff.isActive);
    setFormServices(staff.services || []);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);

    try {
      const payload = {
        ...(editingStaff ? { id: editingStaff.id } : {}),
        name: formName,
        phone: formPhone,
        role: formRole,
        isActive: formActive,
        services: formServices,
      };

      const method = editingStaff ? "PUT" : "POST";
      await fetch("/api/staff", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setDialogOpen(false);
      fetchStaff();
    } catch (err) {
      console.error("Failed to save staff:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await fetch(`/api/staff?id=${deletingId}`, { method: "DELETE" });
      setDeleteDialogOpen(false);
      setDeletingId(null);
      fetchStaff();
    } catch (err) {
      console.error("Failed to delete staff:", err);
    }
  };

  // ─── Schedule Handlers ───────────────────────────────────────────────────────

  const openScheduleDialog = async (staff: Staff) => {
    setScheduleStaffId(staff.id);
    setScheduleStaffName(staff.name);
    setSchedule([...DEFAULT_SCHEDULE]);
    setScheduleDialogOpen(true);

    try {
      const res = await fetch(`/api/staff/schedule?staff_id=${staff.id}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const merged = DEFAULT_SCHEDULE.map((d) => {
          const found = data.find((s: ScheduleEntry) => s.dayOfWeek === d.dayOfWeek);
          return found ? { ...d, ...found } : d;
        });
        setSchedule(merged);
      }
    } catch (err) {
      console.error("Failed to fetch schedule:", err);
    }
  };

  const updateScheduleEntry = (dayOfWeek: number, field: keyof ScheduleEntry, value: string | boolean) => {
    setSchedule((prev) =>
      prev.map((s) => (s.dayOfWeek === dayOfWeek ? { ...s, [field]: value } : s))
    );
  };

  const handleSaveSchedule = async () => {
    if (!scheduleStaffId) return;
    setSavingSchedule(true);

    try {
      await fetch("/api/staff/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staff_id: scheduleStaffId, schedule }),
      });
      setScheduleDialogOpen(false);
    } catch (err) {
      console.error("Failed to save schedule:", err);
    } finally {
      setSavingSchedule(false);
    }
  };

  const toggleService = (productId: string) => {
    setFormServices((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  const dayNames = rtl ? DAY_NAMES_AR : DAY_NAMES_EN;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2 className={cn("text-2xl font-bold tracking-tight", rtl && "font-arabic text-right")}>
            {t(locale, "staff.title")}
          </h2>
          <p className={cn("text-muted-foreground text-sm", rtl && "font-arabic text-right")}>
            {t(locale, "staff.subtitle")}
          </p>
        </div>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          <span className={cn(rtl && "font-arabic")}>{t(locale, "staff.addStaff")}</span>
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", rtl ? "right-3" : "left-3")} />
        <Input
          placeholder={t(locale, "search")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn("h-10", rtl ? "pr-10 text-right font-arabic" : "pl-10")}
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={cn(rtl && "text-right font-arabic")}>{t(locale, "staff.staffName")}</TableHead>
                  <TableHead className={cn(rtl && "text-right font-arabic")}>{t(locale, "staff.staffPhone")}</TableHead>
                  <TableHead className={cn(rtl && "text-right font-arabic")}>{t(locale, "staff.staffRole")}</TableHead>
                  <TableHead className={cn(rtl && "text-right font-arabic")}>{t(locale, "status")}</TableHead>
                  <TableHead className={cn(rtl && "text-right font-arabic")}>{t(locale, "staff.services")}</TableHead>
                  <TableHead className={cn(rtl && "text-right font-arabic")}>{t(locale, "actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filteredStaff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className={cn("text-center py-12 text-muted-foreground", rtl && "font-arabic")}>
                      {t(locale, "noData")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStaff.map((staff) => (
                    <TableRow key={staff.id} className="hover:bg-muted/50">
                      <TableCell className={cn("font-medium", rtl && "text-right font-arabic")}>
                        {staff.name}
                      </TableCell>
                      <TableCell className={cn(rtl && "text-right")} dir="ltr">
                        {staff.phone || "—"}
                      </TableCell>
                      <TableCell className={cn(rtl && "text-right font-arabic")}>
                        <Badge variant="outline">{t(locale, `staff.${staff.role}`)}</Badge>
                      </TableCell>
                      <TableCell className={cn(rtl && "text-right")}>
                        {staff.isActive ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {t(locale, "active")}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <XCircle className="w-3 h-3" />
                            {t(locale, "inactive")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className={cn(rtl && "text-right")}>
                        <span className="text-sm text-muted-foreground">
                          {staff.services?.length || 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openScheduleDialog(staff)}>
                            <Calendar className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(staff)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => {
                              setDeletingId(staff.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ─── Add/Edit Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" dir={rtl ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className={cn(rtl && "font-arabic text-right")}>
              {editingStaff ? t(locale, "staff.editStaff") : t(locale, "staff.addStaff")}
            </DialogTitle>
            <DialogDescription className={cn(rtl && "font-arabic text-right")}>
              {editingStaff
                ? rtl ? "تعديل بيانات الموظفة" : "Update staff member details"
                : rtl ? "إضافة موظفة جديدة للصالون" : "Add a new team member"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label className={cn(rtl && "font-arabic")}>{t(locale, "staff.staffName")}</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} className={cn(rtl && "text-right font-arabic")} />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label className={cn(rtl && "font-arabic")}>{t(locale, "staff.staffPhone")}</Label>
              <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} dir="ltr" />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label className={cn(rtl && "font-arabic")}>{t(locale, "staff.staffRole")}</Label>
              <Select value={formRole} onValueChange={setFormRole}>
                <SelectTrigger className={cn(rtl && "font-arabic")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role} className={cn(rtl && "font-arabic")}>
                      {t(locale, `staff.${role}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active */}
            <div className="flex items-center justify-between">
              <Label className={cn(rtl && "font-arabic")}>{t(locale, "status")}</Label>
              <div dir="ltr">
                <Switch checked={formActive} onCheckedChange={setFormActive} />
              </div>
            </div>

            {/* Services */}
            <div className="space-y-2">
              <Label className={cn(rtl && "font-arabic")}>{t(locale, "staff.services")}</Label>
              <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                {products.map((product) => (
                  <label key={product.id} className="flex items-center gap-2 py-1 px-2 rounded hover:bg-muted/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formServices.includes(product.id)}
                      onChange={() => toggleService(product.id)}
                      className="rounded"
                    />
                    <span className={cn("text-sm", rtl && "font-arabic")}>{product.name}</span>
                  </label>
                ))}
                {products.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">{t(locale, "noData")}</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className={cn(rtl && "font-arabic")}>
              {t(locale, "cancel")}
            </Button>
            <Button onClick={handleSave} disabled={saving || !formName.trim()}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              <span className={cn(rtl && "font-arabic")}>{t(locale, "save")}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Schedule Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="sm:max-w-[600px]" dir={rtl ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className={cn(rtl && "font-arabic text-right")}>
              {t(locale, "staff.schedule")} — {scheduleStaffName}
            </DialogTitle>
            <DialogDescription className={cn(rtl && "font-arabic text-right")}>
              {rtl ? "إدارة ساعات العمل الأسبوعية" : "Manage weekly work hours"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {schedule.map((entry) => (
              <div key={entry.dayOfWeek} className={cn("flex items-center gap-3 p-3 rounded-lg border", entry.isOff && "opacity-50 bg-muted/30")}>
                <div className={cn("w-24 font-medium text-sm shrink-0", rtl && "font-arabic text-right")}>
                  {dayNames[entry.dayOfWeek]}
                </div>

                <div className="flex items-center gap-2 flex-1" dir="ltr">
                  <Input
                    type="time"
                    value={entry.startTime}
                    onChange={(e) => updateScheduleEntry(entry.dayOfWeek, "startTime", e.target.value)}
                    className="w-28 h-8 text-sm"
                    disabled={entry.isOff}
                  />
                  <span className="text-muted-foreground text-sm">—</span>
                  <Input
                    type="time"
                    value={entry.endTime}
                    onChange={(e) => updateScheduleEntry(entry.dayOfWeek, "endTime", e.target.value)}
                    className="w-28 h-8 text-sm"
                    disabled={entry.isOff}
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={entry.isOff}
                    onChange={(e) => updateScheduleEntry(entry.dayOfWeek, "isOff", e.target.checked)}
                    className="rounded"
                  />
                  <span className={cn("text-xs text-muted-foreground", rtl && "font-arabic")}>
                    {t(locale, "staff.dayOff")}
                  </span>
                </label>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)} className={cn(rtl && "font-arabic")}>
              {t(locale, "cancel")}
            </Button>
            <Button onClick={handleSaveSchedule} disabled={savingSchedule}>
              {savingSchedule && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              <span className={cn(rtl && "font-arabic")}>{t(locale, "staff.saveSchedule")}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation ──────────────────────────────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir={rtl ? "rtl" : "ltr"}>
          <AlertDialogHeader>
            <AlertDialogTitle className={cn(rtl && "font-arabic text-right")}>
              {t(locale, "staff.deleteStaff")}
            </AlertDialogTitle>
            <AlertDialogDescription className={cn(rtl && "font-arabic text-right")}>
              {t(locale, "staff.deleteConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={cn(rtl && "flex-row-reverse")}>
            <AlertDialogCancel className={cn(rtl && "font-arabic")}>{t(locale, "cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <span className={cn(rtl && "font-arabic")}>{t(locale, "delete")}</span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
