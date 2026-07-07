"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { t, isRTL } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Bell, CheckCircle2, MessageSquare, Loader2, Mail, Trash2, Briefcase, Heart, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  client_id?: string;
  client?: { id: string; name: string; phone: string } | null;
  isRead: boolean;
  createdAt: string;
}

// ── Notification type detection helpers ──────────────────────────────────────
// Titles may contain emojis, so we match on Arabic keywords only

type NotifCategory = "all" | "job_request" | "customer_service" | "bridal_inquiry";

const CATEGORY_MATCHERS: { category: NotifCategory; keywords: string[] }[] = [
  { category: "job_request", keywords: ["توظيف", "طلب عمل", "وظيفة", "شغل"] },
  { category: "bridal_inquiry", keywords: ["عروس", "عرائس", "باكدج", "بكج"] },
  { category: "customer_service", keywords: ["تواصل", "خدمة العملاء", "موظف"] },
];

function detectCategory(notif: Notification): NotifCategory {
  // 1. Match on Arabic keywords in the title FIRST (highest priority)
  //    This catches cases where the DB type is generic "customer_service"
  //    but the title says "طلب توظيف" or "باكدج العروسة"
  const title = notif.title || "";
  for (const matcher of CATEGORY_MATCHERS) {
    if (matcher.keywords.some((kw) => title.includes(kw))) {
      return matcher.category;
    }
  }

  // 2. Fallback: check the `type` field from the DB
  if (notif.type === "job_request") return "job_request";
  if (notif.type === "bridal_inquiry") return "bridal_inquiry";
  if (notif.type === "customer_service") return "customer_service";

  return "customer_service"; // default
}

function getCategoryIcon(category: NotifCategory, isRead: boolean) {
  const cls = cn("w-5 h-5", isRead ? "text-muted-foreground" : "text-primary");
  switch (category) {
    case "job_request":
      return <Briefcase className={cls} />;
    case "bridal_inquiry":
      return <Heart className={cls} />;
    case "customer_service":
      return <MessageSquare className={cls} />;
    default:
      return <Mail className={cls} />;
  }
}

function getCategoryBgColor(category: NotifCategory, isRead: boolean) {
  if (isRead) return "bg-muted";
  switch (category) {
    case "job_request":
      return "bg-amber-500/10";
    case "bridal_inquiry":
      return "bg-pink-500/10";
    case "customer_service":
      return "bg-primary/10";
    default:
      return "bg-primary/10";
  }
}

// ── Labels for the filter bar ────────────────────────────────────────────────

const CATEGORY_LABELS: Record<NotifCategory, { ar: string; en: string }> = {
  all: { ar: "الكل", en: "All" },
  job_request: { ar: "طلب توظيف", en: "Job Request" },
  customer_service: { ar: "طلب تواصل مع موظف", en: "Customer Service" },
  bridal_inquiry: { ar: "باكدج العروسة", en: "Bridal Package" },
};

function timeAgo(dateStr: string, locale: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return locale === "ar" ? "الآن" : "just now";
  if (mins < 60) return locale === "ar" ? `${mins} دقيقة` : `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return locale === "ar" ? `${hrs} ساعة` : `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return locale === "ar" ? `${days} يوم` : `${days}d`;
}

export function NotificationsSection() {
  const { locale } = useAppStore();
  const rtl = isRTL(locale);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState<NotifCategory>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch { /* noop */ }
    setLoading(false);
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isRead: true }),
      });
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch { /* noop */ }
  };

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch { /* noop */ }
  };

  const deleteNotification = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch { /* noop */ }
    setDeletingId(null);
  };

  // ── Derived: available categories from actual data ──────────────────────────
  const availableCategories = useMemo(() => {
    const cats = new Set<NotifCategory>();
    notifications.forEach((n) => cats.add(detectCategory(n)));
    // Always show "all" first, then only categories that exist in data
    const ordered: NotifCategory[] = ["all"];
    (["job_request", "customer_service", "bridal_inquiry"] as NotifCategory[]).forEach((c) => {
      if (cats.has(c)) ordered.push(c);
    });
    return ordered;
  }, [notifications]);

  // ── Filtering logic ──────────────────────────────────────────────────────────
  const displayed = useMemo(() => {
    let result = notifications;

    // Tab filter: all vs unread
    if (tab === "unread") {
      result = result.filter((n) => !n.isRead);
    }

    // Category filter
    if (categoryFilter !== "all") {
      result = result.filter((n) => detectCategory(n) === categoryFilter);
    }

    return result;
  }, [notifications, tab, categoryFilter]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2 className={cn("text-2xl font-bold tracking-tight", rtl && "font-arabic text-right")}>
            {t(locale, "notifications.title")}
          </h2>
          <p className={cn("text-muted-foreground text-sm", rtl && "font-arabic text-right")}>
            {t(locale, "notifications.subtitle")}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllRead} className={cn("gap-2", rtl && "font-arabic")}>
            <CheckCircle2 className="w-4 h-4" />
            {t(locale, "notifications.markAllRead")}
          </Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all" className={cn(rtl && "font-arabic")}>
            {t(locale, "notifications.all")}
          </TabsTrigger>
          <TabsTrigger value="unread" className={cn(rtl && "font-arabic")}>
            {t(locale, "notifications.unread")} {unreadCount > 0 && <Badge variant="destructive" className="ml-2 text-[10px] px-1.5">{unreadCount}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="space-y-4 mt-4">
          {/* ── Category Filter Bar ────────────────────────────────────── */}
          {availableCategories.length > 1 && (
            <div className={cn("flex items-center gap-2 flex-wrap", rtl && "flex-row-reverse")}>
              <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
              {availableCategories.map((cat) => {
                const label = CATEGORY_LABELS[cat]?.[locale === "ar" ? "ar" : "en"] || cat;
                const isActive = categoryFilter === cat;
                return (
                  <Button
                    key={cat}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategoryFilter(cat)}
                    className={cn(
                      "text-xs h-8 px-3 rounded-full transition-all",
                      rtl && "font-arabic",
                      isActive && cat === "job_request" && "bg-amber-600 hover:bg-amber-700 text-white border-amber-600",
                      isActive && cat === "bridal_inquiry" && "bg-pink-600 hover:bg-pink-700 text-white border-pink-600",
                      isActive && cat === "customer_service" && "bg-blue-600 hover:bg-blue-700 text-white border-blue-600",
                    )}
                  >
                    {label}
                    {cat !== "all" && (
                      <Badge variant="secondary" className="ml-1.5 text-[10px] px-1 py-0 h-4 min-w-[16px] justify-center">
                        {notifications.filter((n) => detectCategory(n) === cat).length}
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>
          )}

          {/* ── Notification List ──────────────────────────────────────── */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : displayed.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className={cn("text-muted-foreground", rtl && "font-arabic")}>{t(locale, "notifications.noNotifications")}</p>
              </CardContent>
            </Card>
          ) : (
            displayed.map((notif) => {
              const category = detectCategory(notif);
              return (
                <Card key={notif.id} className={cn("transition-all", !notif.isRead && "border-primary/30 bg-primary/5")}>
                  <CardContent className="p-4">
                    <div className={cn("flex items-start gap-4", rtl && "flex-row-reverse")}>
                      <div className={cn("shrink-0 w-10 h-10 rounded-full flex items-center justify-center", getCategoryBgColor(category, notif.isRead))}>
                        {getCategoryIcon(category, notif.isRead)}
                      </div>
                      <div className={cn("flex-1 min-w-0", rtl && "text-right")}>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className={cn("font-semibold text-sm", rtl && "font-arabic")}>{notif.title}</p>
                          <span className="text-xs text-muted-foreground shrink-0">{timeAgo(notif.createdAt, locale)}</span>
                        </div>
                        {notif.body && <p className={cn("text-sm text-muted-foreground mb-2", rtl && "font-arabic")}>{notif.body}</p>}
                        {notif.client && (
                          <p className="text-xs text-muted-foreground">
                            {notif.client.name} · {notif.client.phone}
                          </p>
                        )}
                        <div className={cn("flex items-center gap-2 mt-3", rtl && "flex-row-reverse")}>
                          {!notif.isRead && (
                            <Button variant="outline" size="sm" onClick={() => markAsRead(notif.id)} className={cn("gap-1", rtl && "font-arabic")}>
                              <CheckCircle2 className="w-3 h-3" />
                              {t(locale, "notifications.markAsRead")}
                            </Button>
                          )}
                          {notif.client && (
                            <Button variant="ghost" size="sm" asChild className={cn("gap-1", rtl && "font-arabic")}>
                              <a href={`/chat?clientId=${notif.client_id || notif.client.id}`}>
                                <MessageSquare className="w-3 h-3" />
                                {t(locale, "notifications.viewChat")}
                              </a>
                            </Button>
                          )}
                          {/* Delete button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notif.id)}
                            disabled={deletingId === notif.id}
                            className={cn(
                              "gap-1 text-destructive hover:text-destructive hover:bg-destructive/10",
                              rtl && "font-arabic"
                            )}
                          >
                            {deletingId === notif.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                            {t(locale, "notifications.delete")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
