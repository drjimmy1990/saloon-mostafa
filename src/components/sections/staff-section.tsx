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
  X,
  PlusCircle,
  ShieldBan,
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
  branchId?: string | null;
  Branch?: {
    id: string;
    name: string;
    nameAr: string;
  } | null;
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

interface Branch {
  id: string;
  name: string;
  nameAr: string;
}

interface StaffRole {
  key: string;
  labelEn: string;
  labelAr: string;
}

const DEFAULT_ROLES: StaffRole[] = [
  { key: "stylist", labelEn: "Stylist", labelAr: "مصففة شعر" },
  { key: "nail_tech", labelEn: "Nail Technician", labelAr: "فنية أظافر" },
  { key: "manager", labelEn: "Manager", labelAr: "مديرة" },
  { key: "receptionist", labelEn: "Receptionist", labelAr: "استقبال" },
];

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
  const [branches, setBranches] = useState<Branch[]>([]);
  const [roles, setRoles] = useState<StaffRole[]>(DEFAULT_ROLES);
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

  // Role management state
  const [newRoleEn, setNewRoleEn] = useState("");
  const [newRoleAr, setNewRoleAr] = useState("");
  const [showAddRole, setShowAddRole] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formRole, setFormRole] = useState("stylist");
  const [formActive, setFormActive] = useState(true);
  const [formServices, setFormServices] = useState<string[]>([]);
  const [formBranchId, setFormBranchId] = useState<string>("none");
  // Real service count per staff (from StaffService junction table)
  const [staffServiceCount, setStaffServiceCount] = useState<Record<string, number>>({});

  // Blocked dates state
  const [blockedDialogOpen, setBlockedDialogOpen] = useState(false);
  const [blockedStaffId, setBlockedStaffId] = useState<string | null>(null);
  const [blockedStaffName, setBlockedStaffName] = useState("");
  const [blockedDates, setBlockedDates] = useState<{ id: string; blockedDate: string; reason: string }[]>([]);
  const [blockedDateInput, setBlockedDateInput] = useState("");
  const [blockedReasonInput, setBlockedReasonInput] = useState("");
  const [blockedLoading, setBlockedLoading] = useState(false);

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

  const fetchBranches = async () => {
    try {
      const res = await fetch("/api/branches");
      const data = await res.json();
      setBranches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch branches:", err);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data?.staff_roles) {
        const parsed = JSON.parse(data.staff_roles);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRoles(parsed);
        }
      }
    } catch {
      // Use defaults on error
    }
  };

  const saveRoles = async (updated: StaffRole[]) => {
    setRoles(updated);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staff_roles: JSON.stringify(updated) }),
      });
    } catch {
      console.error("Failed to save roles");
    }
  };

  const handleAddRole = () => {
    if (!newRoleEn.trim()) return;
    const key = newRoleEn.trim().toLowerCase().replace(/\s+/g, "_");
    if (roles.some((r) => r.key === key)) return;
    const updated = [...roles, { key, labelEn: newRoleEn.trim(), labelAr: newRoleAr.trim() || newRoleEn.trim() }];
    saveRoles(updated);
    setNewRoleEn("");
    setNewRoleAr("");
    setShowAddRole(false);
  };

  const handleRemoveRole = (key: string) => {
    const updated = roles.filter((r) => r.key !== key);
    if (updated.length === 0) return; // Keep at least one
    saveRoles(updated);
    if (formRole === key) setFormRole(updated[0].key);
  };

  const getRoleLabel = (key: string) => {
    const role = roles.find((r) => r.key === key);
    if (role) return rtl ? role.labelAr : role.labelEn;
    // Fallback to i18n for legacy roles
    const i18nKey = `staff.${key}`;
    const translated = t(locale, i18nKey);
    return translated !== i18nKey ? translated : key;
  };

  useEffect(() => {
    fetchStaff();
    fetchProducts();
    fetchBranches();
    fetchRoles();
    fetchStaffServiceCounts();
  }, []);

  const fetchStaffServiceCounts = async () => {
    try {
      const res = await fetch('/api/staff-services');
      const data = await res.json();
      if (!Array.isArray(data)) return;
      const counts: Record<string, number> = {};
      for (const row of data) {
        const sid = row.staff_id;
        if (sid) counts[sid] = (counts[sid] || 0) + 1;
      }
      setStaffServiceCount(counts);
    } catch (err) {
      console.error('Failed to fetch staff service counts', err);
    }
  };

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
    setFormBranchId("none");
    setDialogOpen(true);
  };

  const openEditDialog = (staff: Staff) => {
    setEditingStaff(staff);
    setFormName(staff.name);
    setFormPhone(staff.phone);
    setFormRole(staff.role);
    setFormActive(staff.isActive);
    setFormServices(staff.services || []);
    setFormBranchId(staff.branchId || "none");
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
        branchId: formBranchId === "none" ? null : formBranchId,
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

  // ─── Blocked Dates Handlers ──────────────────────────────────────────────────

  const openBlockedDialog = async (staff: Staff) => {
    setBlockedStaffId(staff.id);
    setBlockedStaffName(staff.name);
    setBlockedDateInput("");
    setBlockedReasonInput("");
    setBlockedDialogOpen(true);
    setBlockedLoading(true);
    try {
      const res = await fetch(`/api/staff/blocked-dates?staff_id=${staff.id}`);
      const data = await res.json();
      setBlockedDates(Array.isArray(data) ? data : []);
    } catch { setBlockedDates([]); }
    setBlockedLoading(false);
  };

  const handleAddBlockedDate = async () => {
    if (!blockedStaffId || !blockedDateInput) return;
    setBlockedLoading(true);
    try {
      await fetch('/api/staff/blocked-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_id: blockedStaffId, blockedDate: blockedDateInput, reason: blockedReasonInput }),
      });
      // Refresh list
      const res = await fetch(`/api/staff/blocked-dates?staff_id=${blockedStaffId}`);
      const data = await res.json();
      setBlockedDates(Array.isArray(data) ? data : []);
      setBlockedDateInput("");
      setBlockedReasonInput("");
    } catch { /* noop */ }
    setBlockedLoading(false);
  };

  const handleDeleteBlockedDate = async (id: string) => {
    try {
      await fetch(`/api/staff/blocked-dates?id=${id}`, { method: 'DELETE' });
      setBlockedDates((prev) => prev.filter((bd) => bd.id !== id));
    } catch { /* noop */ }
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
                  <TableHead className={cn(rtl && "text-right font-arabic")}>{rtl ? "الفرع" : "Branch"}</TableHead>
                  <TableHead className={cn(rtl && "text-right font-arabic")}>{t(locale, "status")}</TableHead>
                  <TableHead className={cn(rtl && "text-right font-arabic")}>{t(locale, "staff.services")}</TableHead>
                  <TableHead className={cn(rtl && "text-right font-arabic")}>{t(locale, "actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filteredStaff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className={cn("text-center py-12 text-muted-foreground", rtl && "font-arabic")}>
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
                        <Badge variant="outline">{getRoleLabel(staff.role)}</Badge>
                      </TableCell>
                      <TableCell className={cn(rtl && "text-right font-arabic")}>
                        {staff.Branch ? (rtl ? staff.Branch.nameAr || staff.Branch.name : staff.Branch.name) : "—"}
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
                          {staffServiceCount[staff.id] || 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openScheduleDialog(staff)}>
                            <Calendar className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openBlockedDialog(staff)}>
                            <ShieldBan className="w-4 h-4" />
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
              <div className="flex items-center justify-between">
                <Label className={cn(rtl && "font-arabic")}>{t(locale, "staff.staffRole")}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs gap-1"
                  onClick={() => setShowAddRole(!showAddRole)}
                >
                  {showAddRole ? <X className="w-3 h-3" /> : <PlusCircle className="w-3 h-3" />}
                  {showAddRole ? (rtl ? "إلغاء" : "Cancel") : (rtl ? "دور جديد" : "New Role")}
                </Button>
              </div>

              {showAddRole && (
                <div className="flex gap-2 items-end p-2 rounded-md border bg-muted/30">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">{rtl ? "الاسم بالإنجليزي" : "English Name"}</Label>
                    <Input
                      value={newRoleEn}
                      onChange={(e) => setNewRoleEn(e.target.value)}
                      placeholder="e.g. Makeup Artist"
                      className="h-8 text-sm"
                      dir="ltr"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs font-arabic">{rtl ? "الاسم بالعربي" : "Arabic Name"}</Label>
                    <Input
                      value={newRoleAr}
                      onChange={(e) => setNewRoleAr(e.target.value)}
                      placeholder="مثال: فنانة مكياج"
                      className="h-8 text-sm font-arabic"
                      dir="rtl"
                    />
                  </div>
                  <Button type="button" size="sm" className="h-8" onClick={handleAddRole} disabled={!newRoleEn.trim()}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              )}

              <Select value={formRole} onValueChange={setFormRole}>
                <SelectTrigger className={cn(rtl && "font-arabic")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.key} value={role.key} className={cn(rtl && "font-arabic")}>
                      <span className="flex items-center justify-between w-full gap-2">
                        {rtl ? role.labelAr : role.labelEn}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Role chips with remove buttons */}
              <div className="flex flex-wrap gap-1">
                {roles.map((role) => (
                  <Badge key={role.key} variant="secondary" className="gap-1 text-xs">
                    {rtl ? role.labelAr : role.labelEn}
                    {roles.length > 1 && (
                      <button
                        type="button"
                        className="hover:text-destructive transition-colors"
                        onClick={() => handleRemoveRole(role.key)}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Branch */}
            <div className="space-y-2">
              <Label className={cn(rtl && "font-arabic")}>{rtl ? "الفرع" : "Branch"}</Label>
              <Select value={formBranchId} onValueChange={setFormBranchId}>
                <SelectTrigger className={cn(rtl && "font-arabic")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className={cn(rtl && "font-arabic")}>
                    {rtl ? "غير محدد" : "None"}
                  </SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id} className={cn(rtl && "font-arabic")}>
                      {rtl ? branch.nameAr || branch.name : branch.name}
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

            {/* Note: Staff-to-service assignment is managed from the Services section */}
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

      {/* ─── Blocked Dates Dialog ──────────────────────────────────── */}
      <Dialog open={blockedDialogOpen} onOpenChange={setBlockedDialogOpen}>
        <DialogContent className="sm:max-w-[450px]" dir={rtl ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className={cn(rtl && "font-arabic text-right")}>
              {t(locale, "staff.emergencyLeave")} — {blockedStaffName}
            </DialogTitle>
            <DialogDescription className={cn(rtl && "font-arabic text-right")}>
              {t(locale, "staff.blockedDates")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <Label className={cn(rtl && "font-arabic")}>{t(locale, "date")}</Label>
                <Input type="date" value={blockedDateInput} onChange={(e) => setBlockedDateInput(e.target.value)} dir="ltr" />
              </div>
              <div className="flex-1 space-y-1">
                <Label className={cn(rtl && "font-arabic")}>{t(locale, "reason")}</Label>
                <Input value={blockedReasonInput} onChange={(e) => setBlockedReasonInput(e.target.value)} className={cn(rtl && "text-right font-arabic")} placeholder={rtl ? "مثال: إجازة طارئة" : "e.g. Emergency"} />
              </div>
              <Button onClick={handleAddBlockedDate} disabled={!blockedDateInput || blockedLoading} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {blockedDates.length === 0 ? (
              <p className={cn("text-sm text-muted-foreground text-center py-4", rtl && "font-arabic")}>{t(locale, "staff.noBlockedDates")}</p>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {blockedDates.map((bd) => (
                  <div key={bd.id} className="flex items-center justify-between rounded-lg border p-2">
                    <div>
                      <span className="text-sm font-medium">{bd.blockedDate}</span>
                      {bd.reason && <span className={cn("text-xs text-muted-foreground ml-2", rtl && "mr-2 ml-0 font-arabic")}>{bd.reason}</span>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteBlockedDate(bd.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
