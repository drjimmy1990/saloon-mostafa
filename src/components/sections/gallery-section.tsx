"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { t, isRTL } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { uploadImage, deleteImage } from "@/lib/storage";
import {
  ImageIcon,
  Plus,
  Search,
  Trash2,
  Loader2,
  Upload,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

interface GalleryImage {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  sortOrder: number;
  createdAt: string;
}

const GALLERY_CATEGORIES = ["hair", "nails", "makeup", "skincare"];

// ─── Component ────────────────────────────────────────────────────────────────

export function GallerySection() {
  const { locale } = useAppStore();
  const rtl = isRTL(locale);

  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("hair");
  const [formFile, setFormFile] = useState<File | null>(null);
  const [formPreview, setFormPreview] = useState("");

  // ─── Fetch ───────────────────────────────────────────────────────────────────

  const fetchImages = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gallery");
      const data = await res.json();
      setImages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch gallery:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  // ─── Filtered ────────────────────────────────────────────────────────────────

  const filteredImages = useMemo(() => {
    let list = images;
    if (filterCategory !== "all") {
      list = list.filter((img) => img.category === filterCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((img) => img.title.toLowerCase().includes(q));
    }
    return list;
  }, [images, searchQuery, filterCategory]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const openAddDialog = () => {
    setFormTitle("");
    setFormCategory("hair");
    setFormFile(null);
    setFormPreview("");
    setDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormFile(file);
      setFormPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!formFile) return;
    setSaving(true);

    try {
      // Upload image to Supabase Storage
      const imageUrl = await uploadImage(formFile, "gallery");

      // Save to Gallery table
      await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          imageUrl,
          category: formCategory,
          sortOrder: images.length,
        }),
      });

      setDialogOpen(false);
      fetchImages();
    } catch (err) {
      console.error("Failed to save gallery image:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    const image = images.find((img) => img.id === deletingId);

    try {
      // Delete from storage if URL is from Supabase
      if (image?.imageUrl?.includes("supabase")) {
        try {
          await deleteImage(image.imageUrl);
        } catch {
          // Ignore storage delete errors
        }
      }

      await fetch(`/api/gallery?id=${deletingId}`, { method: "DELETE" });
      setDeleteDialogOpen(false);
      setDeletingId(null);
      fetchImages();
    } catch (err) {
      console.error("Failed to delete image:", err);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2 className={cn("text-2xl font-bold tracking-tight", rtl && "font-arabic text-right")}>
            {t(locale, "gallery.title")}
          </h2>
          <p className={cn("text-muted-foreground text-sm", rtl && "font-arabic text-right")}>
            {t(locale, "gallery.subtitle")}
          </p>
        </div>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          <span className={cn(rtl && "font-arabic")}>{t(locale, "gallery.addImage")}</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", rtl ? "right-3" : "left-3")} />
          <Input
            placeholder={t(locale, "search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn("h-10", rtl ? "pr-10 text-right font-arabic" : "pl-10")}
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className={cn("w-40", rtl && "font-arabic")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className={cn(rtl && "font-arabic")}>
              {rtl ? "الكل" : "All"}
            </SelectItem>
            {GALLERY_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat} className={cn(rtl && "font-arabic")}>
                {t(locale, `gallery.${cat}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Image Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredImages.length === 0 ? (
        <div className={cn("text-center py-20 text-muted-foreground", rtl && "font-arabic")}>
          {t(locale, "noData")}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredImages.map((image) => (
            <Card key={image.id} className="overflow-hidden group relative">
              <div className="aspect-square relative">
                <img
                  src={image.imageUrl}
                  alt={image.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center">
                  <Button
                    variant="destructive"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    onClick={() => {
                      setDeletingId(image.id);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-3">
                <p className={cn("text-sm font-medium truncate", rtl && "font-arabic text-right")}>
                  {image.title || (rtl ? "بدون عنوان" : "Untitled")}
                </p>
                <Badge variant="outline" className={cn("mt-1 text-xs", rtl && "font-arabic")}>
                  {t(locale, `gallery.${image.category}`) || image.category}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ─── Upload Dialog ────────────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[450px]" dir={rtl ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className={cn(rtl && "font-arabic text-right")}>
              {t(locale, "gallery.addImage")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label className={cn(rtl && "font-arabic")}>{t(locale, "image")}</Label>
              {formPreview ? (
                <div className="relative aspect-video rounded-lg overflow-hidden border">
                  <img src={formPreview} alt="Preview" className="w-full h-full object-cover" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={() => { setFormFile(null); setFormPreview(""); }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">{rtl ? "اضغط لرفع صورة" : "Click to upload"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label className={cn(rtl && "font-arabic")}>{t(locale, "gallery.imageTitle")}</Label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className={cn(rtl && "text-right font-arabic")} />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className={cn(rtl && "font-arabic")}>{t(locale, "gallery.imageCategory")}</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger className={cn(rtl && "font-arabic")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GALLERY_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} className={cn(rtl && "font-arabic")}>
                      {t(locale, `gallery.${cat}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t(locale, "cancel")}</Button>
            <Button onClick={handleSave} disabled={saving || !formFile}>
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
            <AlertDialogTitle className={cn(rtl && "font-arabic text-right")}>{t(locale, "gallery.deleteImage")}</AlertDialogTitle>
            <AlertDialogDescription className={cn(rtl && "font-arabic text-right")}>{t(locale, "gallery.deleteConfirm")}</AlertDialogDescription>
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
