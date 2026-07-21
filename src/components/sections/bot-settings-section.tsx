"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { t, isRTL } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Sliders, Loader2, Save, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function BotSettingsSection() {
  const { locale, userRole } = useAppStore();
  const rtl = isRTL(locale);

  const [staffHours, setStaffHours] = useState("2");
  const [clientHours, setClientHours] = useState("24");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data?.bot_staff_reminder_hours) setStaffHours(data.bot_staff_reminder_hours);
        if (data?.bot_client_reminder_hours) setClientHours(data.bot_client_reminder_hours);
      } catch { /* noop */ }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bot_staff_reminder_hours: staffHours,
          bot_client_reminder_hours: clientHours,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { /* noop */ }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className={cn("text-2xl font-bold tracking-tight", rtl && "font-arabic text-right")}>
          {t(locale, "botSettings.title")}
        </h2>
        <p className={cn("text-muted-foreground text-sm", rtl && "font-arabic text-right")}>
          {t(locale, "botSettings.subtitle")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className={cn("flex items-center gap-2", rtl && "font-arabic flex-row-reverse")}>
            <Clock className="w-5 h-5 text-primary" />
            {t(locale, "botSettings.reminderSettings")}
          </CardTitle>
          <CardDescription className={cn(rtl && "font-arabic text-right")}>
            {t(locale, "botSettings.reminderDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className={cn(rtl && "font-arabic")}>{t(locale, "botSettings.staffReminderHours")}</Label>
              <Input
                type="number"
                min="1"
                max="72"
                value={staffHours}
                onChange={(e) => setStaffHours(e.target.value)}
                className="max-w-[200px]"
                dir="ltr"
                disabled={userRole === "demo"}
              />
            </div>
            <div className="space-y-2">
              <Label className={cn(rtl && "font-arabic")}>{t(locale, "botSettings.clientReminderHours")}</Label>
              <Input
                type="number"
                min="1"
                max="72"
                value={clientHours}
                onChange={(e) => setClientHours(e.target.value)}
                className="max-w-[200px]"
                dir="ltr"
                disabled={userRole === "demo"}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving || userRole === "demo"} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span className={cn(rtl && "font-arabic")}>{t(locale, "save")}</span>
            </Button>
            {saved && (
              <span className={cn("text-sm text-emerald-600 dark:text-emerald-400", rtl && "font-arabic")}>
                ✓ {t(locale, "botSettings.saved")}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
