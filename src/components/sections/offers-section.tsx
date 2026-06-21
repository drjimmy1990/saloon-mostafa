"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { t, isRTL } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  Percent,
  Plus,
  Search,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  price: string;
}

interface Offer {
  id: string;
  product_id: string;
  product?: Product;
  discountType: "percentage" | "fixed";
  discountValue: number;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  createdAt: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OffersSection() {
  const { locale } = useAppStore();
  const rtl = isRTL(locale);

  const [offers, setOffers] = useState<Offer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form
  const [formProductId, setFormProductId] = useState("");
  const [formDiscountType, setFormDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [formDiscountValue, setFormDiscountValue] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formActive, setFormActive] = useState(true);

  // ─── Fetch ───────────────────────────────────────────────────────────────────

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/offers");
      const data = await res.json();
      setOffers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch offers:", err);
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
    fetchOffers();
    fetchProducts();
  }, []);

  // ─── Filtered ────────────────────────────────────────────────────────────────

  const filteredOffers = useMemo(() => {
    if (!searchQuery.trim()) return offers;
    const q = searchQuery.toLowerCase();
    return offers.filter(
      (o) => o.product?.name?.toLowerCase().includes(q) || o.discountType.includes(q)
    );
  }, [offers, searchQuery]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const openAddDialog = () => {
    setEditingOffer(null);
    setFormProductId(products[0]?.id || "");
    setFormDiscountType("percentage");
    setFormDiscountValue("");
    setFormStartDate("");
    setFormEndDate("");
    setFormActive(true);
    setDialogOpen(true);
  };

  const openEditDialog = (offer: Offer) => {
    setEditingOffer(offer);
    setFormProductId(offer.product_id);
    setFormDiscountType(offer.discountType);
    setFormDiscountValue(String(offer.discountValue));
    setFormStartDate(offer.startDate ? offer.startDate.slice(0, 10) : "");
    setFormEndDate(offer.endDate ? offer.endDate.slice(0, 10) : "");
    setFormActive(offer.isActive);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formProductId || !formDiscountValue) return;
    setSaving(true);

    try {
      const payload = {
        ...(editingOffer ? { id: editingOffer.id } : {}),
        product_id: formProductId,
        discountType: formDiscountType,
        discountValue: parseFloat(formDiscountValue),
        startDate: formStartDate || null,
        endDate: formEndDate || null,
        isActive: formActive,
      };

      await fetch("/api/offers", {
        method: editingOffer ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setDialogOpen(false);
      fetchOffers();
    } catch (err) {
      console.error("Failed to save offer:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await fetch(`/api/offers?id=${deletingId}`, { method: "DELETE" });
      setDeleteDialogOpen(false);
      setDeletingId(null);
      fetchOffers();
    } catch (err) {
      console.error("Failed to delete offer:", err);
    }
  };

  const formatDiscount = (offer: Offer) => {
    if (offer.discountType === "percentage") {
      return `${offer.discountValue}%`;
    }
    return `${offer.discountValue} ${rtl ? "ر.س" : "SAR"}`;
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2 className={cn("text-2xl font-bold tracking-tight", rtl && "font-arabic text-right")}>
            {t(locale, "offers.title")}
          </h2>
          <p className={cn("text-muted-foreground text-sm", rtl && "font-arabic text-right")}>
            {t(locale, "offers.subtitle")}
          </p>
        </div>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          <span className={cn(rtl && "font-arabic")}>{t(locale, "offers.addOffer")}</span>
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
                  <TableHead className={cn(rtl && "text-right font-arabic")}>{t(locale, "offers.service")}</TableHead>
                  <TableHead className={cn(rtl && "text-right font-arabic")}>{t(locale, "offers.discountType")}</TableHead>
                  <TableHead className={cn(rtl && "text-right font-arabic")}>{t(locale, "offers.discountValue")}</TableHead>
                  <TableHead className={cn(rtl && "text-right font-arabic")}>{t(locale, "offers.startDate")}</TableHead>
                  <TableHead className={cn(rtl && "text-right font-arabic")}>{t(locale, "offers.endDate")}</TableHead>
                  <TableHead className={cn(rtl && "text-right font-arabic")}>{t(locale, "status")}</TableHead>
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
                ) : filteredOffers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className={cn("text-center py-12 text-muted-foreground", rtl && "font-arabic")}>
                      {t(locale, "noData")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOffers.map((offer) => (
                    <TableRow key={offer.id} className="hover:bg-muted/50">
                      <TableCell className={cn("font-medium", rtl && "text-right font-arabic")}>
                        {offer.product?.name || "—"}
                      </TableCell>
                      <TableCell className={cn(rtl && "text-right font-arabic")}>
                        <Badge variant="outline">
                          {t(locale, `offers.${offer.discountType}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className={cn(rtl && "text-right")}>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          {formatDiscount(offer)}
                        </Badge>
                      </TableCell>
                      <TableCell className={cn("tabular-nums", rtl && "text-right")}>
                        {offer.startDate ? new Date(offer.startDate).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell className={cn("tabular-nums", rtl && "text-right")}>
                        {offer.endDate ? new Date(offer.endDate).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell className={cn(rtl && "text-right")}>
                        {offer.isActive ? (
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
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(offer)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => {
                              setDeletingId(offer.id);
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
              {editingOffer ? t(locale, "offers.editOffer") : t(locale, "offers.addOffer")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Service selector */}
            <div className="space-y-2">
              <Label className={cn(rtl && "font-arabic")}>{t(locale, "offers.service")}</Label>
              <Select value={formProductId} onValueChange={setFormProductId}>
                <SelectTrigger className={cn(rtl && "font-arabic")}>
                  <SelectValue placeholder={rtl ? "اختر الخدمة" : "Select service"} />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id} className={cn(rtl && "font-arabic")}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Discount type */}
            <div className="space-y-2">
              <Label className={cn(rtl && "font-arabic")}>{t(locale, "offers.discountType")}</Label>
              <Select value={formDiscountType} onValueChange={(v) => setFormDiscountType(v as "percentage" | "fixed")}>
                <SelectTrigger className={cn(rtl && "font-arabic")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage" className={cn(rtl && "font-arabic")}>{t(locale, "offers.percentage")}</SelectItem>
                  <SelectItem value="fixed" className={cn(rtl && "font-arabic")}>{t(locale, "offers.fixed")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Discount value */}
            <div className="space-y-2">
              <Label className={cn(rtl && "font-arabic")}>{t(locale, "offers.discountValue")}</Label>
              <Input
                type="number"
                value={formDiscountValue}
                onChange={(e) => setFormDiscountValue(e.target.value)}
                placeholder={formDiscountType === "percentage" ? "20" : "5"}
                dir="ltr"
              />
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={cn(rtl && "font-arabic")}>{t(locale, "offers.startDate")}</Label>
                <Input type="date" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label className={cn(rtl && "font-arabic")}>{t(locale, "offers.endDate")}</Label>
                <Input type="date" value={formEndDate} onChange={(e) => setFormEndDate(e.target.value)} dir="ltr" />
              </div>
            </div>

            {/* Active */}
            <div className="flex items-center justify-between">
              <Label className={cn(rtl && "font-arabic")}>{t(locale, "status")}</Label>
              <div dir="ltr">
                <Switch checked={formActive} onCheckedChange={setFormActive} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t(locale, "cancel")}</Button>
            <Button onClick={handleSave} disabled={saving || !formProductId || !formDiscountValue}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {t(locale, "save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation ──────────────────────────────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir={rtl ? "rtl" : "ltr"}>
          <AlertDialogHeader>
            <AlertDialogTitle className={cn(rtl && "font-arabic text-right")}>{t(locale, "offers.deleteOffer")}</AlertDialogTitle>
            <AlertDialogDescription className={cn(rtl && "font-arabic text-right")}>{t(locale, "offers.deleteConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={cn(rtl && "flex-row-reverse")}>
            <AlertDialogCancel>{t(locale, "cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t(locale, "delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
