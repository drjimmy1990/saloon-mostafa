"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { t, isRTL } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ClipboardList, Loader2, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function BotServicesSection() {
  const { locale } = useAppStore();
  const rtl = isRTL(locale);

  const [botServicesText, setBotServicesText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (data?.bot_services_text) {
            setBotServicesText(data.bot_services_text);
          }
        }
      } catch (err) {
        console.error("Failed to fetch bot services text", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bot_services_text: botServicesText,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const data = await res.json();
        alert(data?.error || "Failed to save settings");
      }
    } catch (err) {
      console.error("Failed to save bot services text", err);
      alert("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={rtl ? "rtl" : "ltr"}>
      {/* Page Header */}
      <div className="space-y-1">
        <h2 className={cn("text-2xl font-bold tracking-tight", rtl && "font-arabic text-right")}>
          {t(locale, "botServices.title")}
        </h2>
        <p className={cn("text-muted-foreground text-sm", rtl && "font-arabic text-right")}>
          {t(locale, "botServices.subtitle")}
        </p>
      </div>

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className={cn("flex items-center gap-2", rtl ? "flex-row-reverse text-right font-arabic" : "flex-row")}>
            <ClipboardList className="w-5 h-5 text-primary" />
            {t(locale, "botServices.title")}
          </CardTitle>
          <CardDescription className={cn(rtl && "font-arabic text-right")}>
            {rtl
              ? "هذا النص سيتم استهلاكه بواسطة أتمتة n8n لتوجيه البوت الذكي وعرض الخدمات للعملاء."
              : "This text will be consumed by the n8n automation to direct the AI agent and list services for clients."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className={cn(rtl && "font-arabic text-right block")}>
              {rtl ? "نص الخدمات وتفاصيل الأسعار" : "Services & Pricing Text Content"}
            </Label>
            <Textarea
              value={botServicesText}
              onChange={(e) => setBotServicesText(e.target.value)}
              placeholder={t(locale, "botServices.placeholder")}
              className={cn("min-h-[350px] font-sans text-base leading-relaxed p-4", rtl && "text-right font-arabic")}
              dir={rtl ? "rtl" : "ltr"}
            />
          </div>

          <div className={cn("flex items-center gap-3", rtl && "flex-row-reverse")}>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span className={cn(rtl && "font-arabic")}>{t(locale, "save")}</span>
            </Button>
            {saved && (
              <span className={cn("text-sm text-emerald-600 dark:text-emerald-400", rtl && "font-arabic")}>
                ✓ {t(locale, "botServices.saved")}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
