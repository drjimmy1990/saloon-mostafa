"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { t, isRTL } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Bell, CheckCircle2, MessageSquare, Loader2, Mail } from "lucide-react";
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

  const displayed = tab === "unread" ? notifications.filter((n) => !n.isRead) : notifications;
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

        <TabsContent value={tab} className="space-y-3 mt-4">
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
            displayed.map((notif) => (
              <Card key={notif.id} className={cn("transition-all", !notif.isRead && "border-primary/30 bg-primary/5")}>
                <CardContent className="p-4">
                  <div className={cn("flex items-start gap-4", rtl && "flex-row-reverse")}>
                    <div className={cn("shrink-0 w-10 h-10 rounded-full flex items-center justify-center", notif.isRead ? "bg-muted" : "bg-primary/10")}>
                      {notif.type === "customer_service" ? (
                        <MessageSquare className={cn("w-5 h-5", notif.isRead ? "text-muted-foreground" : "text-primary")} />
                      ) : (
                        <Mail className={cn("w-5 h-5", notif.isRead ? "text-muted-foreground" : "text-primary")} />
                      )}
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
                            <a href="/chat">
                              <MessageSquare className="w-3 h-3" />
                              {t(locale, "notifications.viewChat")}
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
