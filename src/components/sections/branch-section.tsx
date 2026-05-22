"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { t, isRTL } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  MapPin,
  Plus,
  Search,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
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

interface Branch {
  id: string;
  name: string;
  nameAr: string;
  address: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  whatsapp?: string;
  email?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  googleMapsUrl?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BranchSection() {
  const { locale } = useAppStore();
  const rtl = isRTL(locale);

  // Data state
  const [branchList, setBranchList] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formNameAr, setFormNameAr] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [formWhatsapp, setFormWhatsapp] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formInstagram, setFormInstagram] = useState("");
  const [formFacebook, setFormFacebook] = useState("");
  const [formGoogleMaps, setFormGoogleMaps] = useState("");

  // ─── Fetch Data ──────────────────────────────────────────────────────────────

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/branches");
      const data = await res.json();
      setBranchList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch branches:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  // ─── Filtered list ───────────────────────────────────────────────────────────

  const filteredBranches = useMemo(() => {
    if (!searchQuery.trim()) return branchList;
    const q = searchQuery.toLowerCase();
    return branchList.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.nameAr.toLowerCase().includes(q) ||
        b.phone.toLowerCase().includes(q)
    );
  }, [branchList, searchQuery]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const openAddDialog = () => {
    setEditingBranch(null);
    setFormName("");
    setFormNameAr("");
    setFormAddress("");
    setFormPhone("");
    setFormActive(true);
    setFormWhatsapp(""); setFormEmail(""); setFormInstagram("");
    setFormFacebook(""); setFormGoogleMaps("");
    setDialogOpen(true);
  };

  const openEditDialog = (branch: Branch) => {
    setEditingBranch(branch);
    setFormName(branch.name || "");
    setFormNameAr(branch.nameAr || "");
    setFormAddress(branch.address || "");
    setFormPhone(branch.phone || "");
    setFormActive(branch.isActive);
    setFormWhatsapp(branch.whatsapp || "");
    setFormEmail(branch.email || "");
    setFormInstagram(branch.instagramUrl || "");
    setFormFacebook(branch.facebookUrl || "");
    setFormGoogleMaps(branch.googleMapsUrl || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);

    try {
      const payload = {
        ...(editingBranch ? { id: editingBranch.id } : {}),
        name: formName,
        nameAr: formNameAr,
        address: formAddress,
        phone: formPhone,
        isActive: formActive,
        whatsapp: formWhatsapp,
        email: formEmail,
        instagramUrl: formInstagram,
        facebookUrl: formFacebook,
        googleMapsUrl: formGoogleMaps,
      };

      const method = editingBranch ? "PUT" : "POST";
      await fetch("/api/branches", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setDialogOpen(false);
      fetchBranches();
    } catch (err) {
      console.error("Failed to save branch:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await fetch(`/api/branches?id=${deletingId}`, { method: "DELETE" });
      setDeleteDialogOpen(false);
      setDeletingId(null);
      fetchBranches();
    } catch (err) {
      console.error("Failed to delete branch:", err);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6" dir={rtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2 className={cn("text-2xl font-bold tracking-tight", rtl && "font-arabic")}>
            {rtl ? "إدارة الفروع" : "Branch Management"}
          </h2>
          <p className={cn("text-muted-foreground text-sm", rtl && "font-arabic")}>
            {rtl ? "قم بإدارة فروع الصالون ومعلوماتها" : "Manage your salon branches and their details"}
          </p>
        </div>
        <Button onClick={openAddDialog} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          <span className={cn(rtl && "font-arabic")}>{rtl ? "إضافة فرع" : "Add Branch"}</span>
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
                  <TableHead className={cn(rtl && "text-right font-arabic")}>{rtl ? "اسم الفرع" : "Branch Name"}</TableHead>
                  <TableHead className={cn(rtl && "text-right font-arabic")}>{rtl ? "الهاتف" : "Phone"}</TableHead>
                  <TableHead className={cn(rtl && "text-right font-arabic")}>{rtl ? "العنوان" : "Address"}</TableHead>
                  <TableHead className={cn(rtl && "text-right font-arabic")}>{t(locale, "status")}</TableHead>
                  <TableHead className={cn(rtl && "text-right font-arabic")}>{t(locale, "actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filteredBranches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className={cn("text-center py-12 text-muted-foreground", rtl && "font-arabic")}>
                      {t(locale, "noData")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBranches.map((branch) => (
                    <TableRow key={branch.id} className="hover:bg-muted/50">
                      <TableCell className={cn("font-medium", rtl && "text-right font-arabic")}>
                        {rtl ? (branch.nameAr || branch.name) : branch.name}
                      </TableCell>
                      <TableCell className={cn(rtl && "text-right")} dir="ltr">
                        {branch.phone || "—"}
                      </TableCell>
                      <TableCell className={cn("text-muted-foreground text-sm", rtl && "text-right font-arabic")}>
                        {branch.address || "—"}
                      </TableCell>
                      <TableCell className={cn(rtl && "text-right")}>
                        {branch.isActive ? (
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
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(branch)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => {
                              setDeletingId(branch.id);
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
              {editingBranch ? (rtl ? "تعديل الفرع" : "Edit Branch") : (rtl ? "إضافة فرع" : "Add Branch")}
            </DialogTitle>
            <DialogDescription className={cn(rtl && "font-arabic text-right")}>
              {editingBranch
                ? rtl ? "تعديل بيانات فرع موجود" : "Update an existing branch"
                : rtl ? "إضافة فرع جديد للصالون" : "Add a new salon branch"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className={cn(rtl && "font-arabic")}>{rtl ? "الاسم (انجليزي)" : "Name (English)"}</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} dir="ltr" />
            </div>

            <div className="space-y-2">
              <Label className={cn(rtl && "font-arabic")}>{rtl ? "الاسم (عربي)" : "Name (Arabic)"}</Label>
              <Input value={formNameAr} onChange={(e) => setFormNameAr(e.target.value)} className="font-arabic" dir="rtl" />
            </div>

            <div className="space-y-2">
              <Label className={cn(rtl && "font-arabic")}>{rtl ? "العنوان" : "Address"}</Label>
              <Input value={formAddress} onChange={(e) => setFormAddress(e.target.value)} className={cn(rtl && "font-arabic text-right")} />
            </div>

            <div className="space-y-2">
              <Label className={cn(rtl && "font-arabic")}>{rtl ? "رقم الهاتف" : "Phone Number"}</Label>
              <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} dir="ltr" />
            </div>

            {/* ─── Contact Info ─── */}
            <div className="pt-2 border-t">
              <p className={cn("text-sm font-medium text-muted-foreground mb-3", rtl && "font-arabic")}>
                {rtl ? "معلومات التواصل" : "Contact Information"}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className={cn("text-xs", rtl && "font-arabic")}>WhatsApp</Label>
                  <Input value={formWhatsapp} onChange={(e) => setFormWhatsapp(e.target.value)} dir="ltr" placeholder="+962..." />
                </div>
                <div className="space-y-1">
                  <Label className={cn("text-xs", rtl && "font-arabic")}>{rtl ? "البريد الإلكتروني" : "Email"}</Label>
                  <Input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} dir="ltr" placeholder="branch@salon.com" />
                </div>
                <div className="space-y-1">
                  <Label className={cn("text-xs", rtl && "font-arabic")}>Instagram</Label>
                  <Input value={formInstagram} onChange={(e) => setFormInstagram(e.target.value)} dir="ltr" placeholder="https://instagram.com/..." />
                </div>
                <div className="space-y-1">
                  <Label className={cn("text-xs", rtl && "font-arabic")}>Facebook</Label>
                  <Input value={formFacebook} onChange={(e) => setFormFacebook(e.target.value)} dir="ltr" placeholder="https://facebook.com/..." />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className={cn("text-xs", rtl && "font-arabic")}>Google Maps</Label>
                  <Input value={formGoogleMaps} onChange={(e) => setFormGoogleMaps(e.target.value)} dir="ltr" placeholder="https://maps.google.com/..." />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label className={cn(rtl && "font-arabic")}>{t(locale, "status")}</Label>
              <div dir="ltr">
                <Switch checked={formActive} onCheckedChange={setFormActive} />
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

      {/* ─── Delete Confirmation ──────────────────────────────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir={rtl ? "rtl" : "ltr"}>
          <AlertDialogHeader>
            <AlertDialogTitle className={cn(rtl && "font-arabic text-right")}>
              {rtl ? "حذف الفرع" : "Delete Branch"}
            </AlertDialogTitle>
            <AlertDialogDescription className={cn(rtl && "font-arabic text-right")}>
              {rtl ? "هل أنت متأكد من حذف هذا الفرع؟ لا يمكن التراجع عن هذا الإجراء." : "Are you sure you want to delete this branch? This action cannot be undone."}
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
