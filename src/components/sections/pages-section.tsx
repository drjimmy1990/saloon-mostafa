"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { t, isRTL } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  FileText,
  Save,
  Loader2,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CmsPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  updatedAt: string;
}

const PAGE_ICONS: Record<string, string> = {
  about: "📋",
  contact: "📞",
  privacy: "🔒",
  terms: "📜",
  "booking-conditions": "📅",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function PagesSection() {
  const { locale } = useAppStore();
  const rtl = isRTL(locale);

  const [pages, setPages] = useState<CmsPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPage, setSelectedPage] = useState<CmsPage | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  // ─── Fetch ───────────────────────────────────────────────────────────────────

  const fetchPages = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cms");
      const data = await res.json();
      setPages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch pages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const selectPage = (page: CmsPage) => {
    setSelectedPage(page);
    setEditTitle(page.title);
    setEditContent(page.content);
  };

  const handleSave = async () => {
    if (!selectedPage) return;
    setSaving(true);

    try {
      await fetch("/api/cms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedPage.id,
          title: editTitle,
          content: editContent,
        }),
      });

      // Update local state
      setPages((prev) =>
        prev.map((p) => (p.id === selectedPage.id ? { ...p, title: editTitle, content: editContent } : p))
      );
      setSelectedPage((prev) => prev ? { ...prev, title: editTitle, content: editContent } : prev);
    } catch (err) {
      console.error("Failed to save page:", err);
    } finally {
      setSaving(false);
    }
  };

  const getPageLabel = (slug: string): string => {
    const keyMap: Record<string, string> = {
      about: "pages.about",
      contact: "pages.contact",
      privacy: "pages.privacy",
      terms: "pages.terms",
      "booking-conditions": "pages.bookingConditions",
    };
    return t(locale, keyMap[slug] || slug);
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ─── Editor View ─────────────────────────────────────────────────────────────

  if (selectedPage) {
    return (
      <div className="space-y-6">
        {/* Back button */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedPage(null)}>
            <ArrowLeft className={cn("w-4 h-4", rtl && "rotate-180")} />
          </Button>
          <div>
            <h2 className={cn("text-2xl font-bold tracking-tight", rtl && "font-arabic text-right")}>
              {t(locale, "pages.editPage")}
            </h2>
            <p className={cn("text-muted-foreground text-sm", rtl && "font-arabic")}>
              {getPageLabel(selectedPage.slug)}
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label className={cn(rtl && "font-arabic")}>{rtl ? "عنوان الصفحة" : "Page Title"}</Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className={cn(rtl && "text-right font-arabic")}
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label className={cn(rtl && "font-arabic")}>{rtl ? "المحتوى" : "Content"}</Label>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className={cn("min-h-[400px] font-mono text-sm", rtl && "text-right")}
                placeholder={rtl ? "اكتب المحتوى هنا... (يدعم HTML)" : "Write content here... (HTML supported)"}
              />
            </div>

            {/* Save */}
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span className={cn(rtl && "font-arabic")}>{t(locale, "pages.savePage")}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Page List View ──────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h2 className={cn("text-2xl font-bold tracking-tight", rtl && "font-arabic text-right")}>
          {t(locale, "pages.title")}
        </h2>
        <p className={cn("text-muted-foreground text-sm", rtl && "font-arabic text-right")}>
          {t(locale, "pages.subtitle")}
        </p>
      </div>

      {/* Page cards */}
      <div className="grid gap-3">
        {pages.map((page) => (
          <Card
            key={page.id}
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => selectPage(page)}
          >
            <CardContent className="p-4">
              <div className={cn("flex items-center justify-between", rtl && "flex-row-reverse")}>
                <div className={cn("flex items-center gap-3", rtl && "flex-row-reverse")}>
                  <span className="text-2xl">{PAGE_ICONS[page.slug] || "📄"}</span>
                  <div>
                    <p className={cn("font-medium", rtl && "font-arabic text-right")}>
                      {getPageLabel(page.slug)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {rtl ? "آخر تحديث: " : "Last updated: "}
                      {new Date(page.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <ChevronRight className={cn("w-5 h-5 text-muted-foreground", rtl && "rotate-180")} />
              </div>
            </CardContent>
          </Card>
        ))}

        {pages.length === 0 && (
          <div className={cn("text-center py-12 text-muted-foreground", rtl && "font-arabic")}>
            {t(locale, "noData")}
          </div>
        )}
      </div>
    </div>
  );
}
