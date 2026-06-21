"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { t, isRTL } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  Megaphone, Plus, Search, Pencil, Trash2, CheckCircle2, XCircle, Loader2,
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

interface Product { id: string; name: string; price: string; }
interface Offer {
  id: string;
  product_id: string;
  product?: Product;
  discountType: "percentage" | "fixed";
  discountValue: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  channel: string;
}

export function BotOffersSection() {
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

  const [formProductId, setFormProductId] = useState("");
  const [formDiscountType, setFormDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [formDiscountValue, setFormDiscountValue] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formActive, setFormActive] = useState(true);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/offers?channel=bot");
      const data = await res.json();
      setOffers(Array.isArray(data) ? data : []);
    } catch { /* noop */ } finally { setLoading(false); }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(Array.isArray(data) ? data.filter((p: { type?: string }) => p.type === "service") : []);
    } catch { /* noop */ }
  };

  useEffect(() => { fetchOffers(); fetchProducts(); }, []);

  const filteredOffers = useMemo(() => {
    if (!searchQuery.trim()) return offers;
    return offers.filter((o) =>
      o.product?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [offers, searchQuery]);

  const resetForm = () => {
    setFormProductId(""); setFormDiscountType("percentage");
    setFormDiscountValue(""); setFormStartDate(""); setFormEndDate("");
    setFormActive(true); setEditingOffer(null);
  };

  const openAddDialog = () => { resetForm(); setDialogOpen(true); };
  const openEditDialog = (offer: Offer) => {
    setEditingOffer(offer);
    setFormProductId(offer.product_id);
    setFormDiscountType(offer.discountType);
    setFormDiscountValue(String(offer.discountValue));
    setFormStartDate(offer.startDate?.split("T")[0] || "");
    setFormEndDate(offer.endDate?.split("T")[0] || "");
    setFormActive(offer.isActive);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formProductId || !formDiscountValue) return;
    setSaving(true);
    try {
      const payload = {
        product_id: formProductId,
        discountType: formDiscountType,
        discountValue: parseFloat(formDiscountValue),
        startDate: formStartDate || null,
        endDate: formEndDate || null,
        isActive: formActive,
        channel: "bot",
        ...(editingOffer && { id: editingOffer.id }),
      };
      await fetch("/api/offers", {
        method: editingOffer ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setDialogOpen(false);
      fetchOffers();
    } catch { /* noop */ } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await fetch(`/api/offers?id=${deletingId}`, { method: "DELETE" });
      setDeleteDialogOpen(false);
      fetchOffers();
    } catch { /* noop */ }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2 className={cn("text-2xl font-bold tracking-tight", rtl && "font-arabic text-right")}>
            {t(locale, "botOffers.title")}
          </h2>
          <p className={cn("text-muted-foreground text-sm", rtl && "font-arabic text-right")}>
            {t(locale, "botOffers.subtitle")}
          </p>
        </div>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          <span className={cn(rtl && "font-arabic")}>{t(locale, "botOffers.addOffer")}</span>
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", rtl ? "right-3" : "left-3")} />
        <Input
          placeholder={t(locale, "search")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn("h-10", rtl ? "pr-10 text-right font-arabic" : "pl-10")}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={cn(rtl && "text-right font-arabic")}>{t(locale, "service")}</TableHead>
                  <TableHead className={cn(rtl && "text-right font-arabic")}>{t(locale, "offers.discountType")}</TableHead>
                  <TableHead className={cn(rtl && "text-right font-arabic")}>{t(locale, "offers.discountValue")}</TableHead>
                  <TableHead className={cn(rtl && "text-right font-arabic")}>{t(locale, "status")}</TableHead>
                  <TableHead className={cn(rtl && "text-right font-arabic")}>{t(locale, "actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                ) : filteredOffers.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className={cn("text-center py-12 text-muted-foreground", rtl && "font-arabic")}>{t(locale, "noData")}</TableCell></TableRow>
                ) : filteredOffers.map((offer) => (
                  <TableRow key={offer.id} className="hover:bg-muted/50">
                    <TableCell className={cn("font-medium", rtl && "text-right font-arabic")}>{offer.product?.name || "—"}</TableCell>
                    <TableCell className={cn(rtl && "text-right font-arabic")}>
                      <Badge variant="outline">{offer.discountType === "percentage" ? t(locale, "offers.percentage") : t(locale, "offers.fixed")}</Badge>
                    </TableCell>
                    <TableCell className={cn(rtl && "text-right")}>{offer.discountType === "percentage" ? `${offer.discountValue}%` : `${offer.discountValue} ${rtl ? "ر.س" : "SAR"}`}</TableCell>
                    <TableCell className={cn(rtl && "text-right")}>
                      {offer.isActive ? (
                        <Badge variant="default" className="gap-1"><CheckCircle2 className="w-3 h-3" />{t(locale, "active")}</Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1"><XCircle className="w-3 h-3" />{t(locale, "inactive")}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(offer)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { setDeletingId(offer.id); setDeleteDialogOpen(true); }}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[450px]" dir={rtl ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className={cn(rtl && "font-arabic text-right")}>
              {editingOffer ? t(locale, "botOffers.editOffer") : t(locale, "botOffers.addOffer")}
            </DialogTitle>
            <DialogDescription className={cn(rtl && "font-arabic text-right")}>
              {t(locale, "botOffers.subtitle")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className={cn(rtl && "font-arabic")}>{t(locale, "service")}</Label>
              <Select value={formProductId} onValueChange={setFormProductId}>
                <SelectTrigger className={cn(rtl && "font-arabic")}><SelectValue placeholder={t(locale, "bookings.selectService")} /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={cn(rtl && "font-arabic")}>{t(locale, "offers.discountType")}</Label>
                <Select value={formDiscountType} onValueChange={(v) => setFormDiscountType(v as "percentage" | "fixed")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">{t(locale, "offers.percentage")}</SelectItem>
                    <SelectItem value="fixed">{t(locale, "offers.fixed")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className={cn(rtl && "font-arabic")}>{t(locale, "offers.discountValue")}</Label>
                <Input type="number" value={formDiscountValue} onChange={(e) => setFormDiscountValue(e.target.value)} />
              </div>
            </div>
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
            <div className="flex items-center gap-3">
              <Switch checked={formActive} onCheckedChange={setFormActive} />
              <Label className={cn(rtl && "font-arabic")}>{t(locale, "active")}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className={cn(rtl && "font-arabic")}>{t(locale, "cancel")}</Button>
            <Button onClick={handleSave} disabled={saving || !formProductId}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              <span className={cn(rtl && "font-arabic")}>{t(locale, "save")}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir={rtl ? "rtl" : "ltr"}>
          <AlertDialogHeader>
            <AlertDialogTitle className={cn(rtl && "font-arabic text-right")}>{t(locale, "botOffers.deleteOffer")}</AlertDialogTitle>
            <AlertDialogDescription className={cn(rtl && "font-arabic text-right")}>{t(locale, "botOffers.deleteConfirm")}</AlertDialogDescription>
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
