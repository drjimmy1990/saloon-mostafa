"use client";

import React, { useState, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { t, isRTL } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  Search,
  Phone,
  Clock,
  Bot,
  User,
  Plus,
  Loader2
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

export interface PausedClient {
  id: string;
  platform: "whatsapp" | "facebook" | "instagram";
  platform_user_id: string;
  phone?: string;
  name?: string;
  last_interaction_at: string;
  ai_enabled: boolean;
  createdAt: string;
}

import { maskPhone, maskName, maskId } from "@/lib/demo-mask";

export function BlacklistSection() {
  const { locale, userRole } = useAppStore();
  const isDemo = userRole === "demo";
  const rtl = isRTL(locale);

  const [clients, setClients] = useState<PausedClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<PausedClient | null>(null);
  const [newBlacklistId, setNewBlacklistId] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // ─── Fetch Data ───────────────────────────────────────────────────────────
  const fetchPausedClients = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/clients?ai_enabled=false");
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch paused clients", err);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchPausedClients();
  }, []);

  // ─── Filtering ────────────────────────────────────────────────────────────

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    return clients.filter((c) => {
      const name = c.name?.toLowerCase() || "";
      const phone = c.phone?.toLowerCase() || "";
      const id = c.platform_user_id?.toLowerCase() || "";
      return (
        name.includes(searchQuery.toLowerCase()) ||
        phone.includes(searchQuery.toLowerCase()) ||
        id.includes(searchQuery.toLowerCase())
      );
    });
  }, [clients, searchQuery]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const openEnableDialog = (client: PausedClient) => {
    setSelectedClient(client);
    setDeleteDialogOpen(true);
  };

  const handleEnableAi = async () => {
    if (!selectedClient) return;

    try {
      const res = await fetch(`/api/clients/${selectedClient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ai_enabled: true }),
      });
      if (res.ok) {
        fetchPausedClients();
      }
    } catch (err) {
      console.error("Failed to re-enable AI", err);
    }

    setDeleteDialogOpen(false);
    setSelectedClient(null);
  };

  const handleAddToBlacklist = async () => {
    if (!newBlacklistId.trim()) return;
    setIsAdding(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phone: newBlacklistId.trim(), 
          platform_user_id: newBlacklistId.trim(),
          ai_enabled: false
        }),
      });
      if (res.ok) {
        setNewBlacklistId("");
        fetchPausedClients();
      } else {
        console.error("Failed to add to blacklist");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6" dir={rtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="space-y-1">
        <h2
          className={cn(
            "text-2xl font-bold tracking-tight",
            rtl && "font-arabic text-right"
          )}
        >
          {rtl ? "التحكم بالبوت (الحظر)" : "AI Control (Blacklist)"}
        </h2>
        <p
          className={cn(
            "text-muted-foreground text-sm",
            rtl && "font-arabic text-right"
          )}
        >
          {rtl 
            ? "العملاء الذين تم إيقاف البوت الذكي عن الرد عليهم." 
            : "Clients for whom the AI Bot has been paused."}
        </p>
      </div>

      {/* Action Bar */}
      <div
        className={cn(
          "flex flex-col sm:flex-row gap-3",
          ""
        )}
      >
        <div className="relative flex-1 min-w-0">
          <Search
            className={cn(
              "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground",
              rtl ? "right-3" : "left-3"
            )}
          />
          <Input
            placeholder={t(locale, "search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              rtl ? "pr-9 pl-3" : "pl-9 pr-3",
              rtl && "font-arabic text-right"
            )}
          />
        </div>
        <div className={cn("flex items-center gap-2", rtl && "flex-row-reverse")}>
          <Input
            placeholder={rtl ? "رقم الهاتف أو المعرف" : "Phone or ID"}
            value={newBlacklistId}
            onChange={(e) => setNewBlacklistId(e.target.value)}
            className={cn("w-48 text-sm", rtl && "font-arabic text-right")}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddToBlacklist();
              }
            }}
          />
          <Button
            onClick={handleAddToBlacklist}
            disabled={!newBlacklistId.trim() || isAdding}
            className={cn("bg-orange-600 hover:bg-orange-700 text-white shrink-0", rtl && "font-arabic")}
          >
            {isAdding ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2 ml-2" />
            ) : (
              <Plus className="w-4 h-4 mr-1.5 ml-1.5" />
            )}
            {rtl ? "إضافة للحظر" : "Add to List"}
          </Button>
        </div>
      </div>

      {/* Stats Card */}
      <Card className="border-orange-200 dark:border-orange-800/40 bg-orange-50 dark:bg-orange-900/20 py-0">
        <CardContent className="p-4">
          <div
            className={cn("flex items-center gap-3", "")}
          >
            <div className="p-2.5 rounded-xl bg-orange-100 dark:bg-orange-800/30 shrink-0">
              <Bot className="w-5 h-5 text-orange-600 dark:text-orange-400 opacity-50" />
            </div>
            <div className={cn("min-w-0", rtl && "text-right")}>
              <p
                className={cn(
                  "text-xs font-medium text-muted-foreground",
                  rtl && "font-arabic"
                )}
              >
                {rtl ? "مجموع العملاء المحظورين" : "Total Paused Clients"}
              </p>
              <p className="text-2xl font-bold tabular-nums">
                {isLoading ? "..." : clients.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clients List */}
      <div className="space-y-3">
        {isLoading ? (
          <Card className="py-0">
            <CardContent className="p-8">
              <div
                className={cn(
                  "flex flex-col items-center justify-center text-muted-foreground gap-2",
                  rtl && "font-arabic"
                )}
              >
                <p className="text-sm">Loading...</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredClients.length === 0 ? (
          <Card className="py-0">
            <CardContent className="p-8">
              <div
                className={cn(
                  "flex flex-col items-center justify-center text-muted-foreground gap-2",
                  rtl && "font-arabic"
                )}
              >
                <Bot className="w-8 h-8 opacity-50" />
                <p className="text-sm">{t(locale, "noData")}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredClients.map((client) => {
            return (
              <Card
                key={client.id}
                className="py-0 border hover:shadow-md transition-shadow duration-200 border-orange-200 dark:border-orange-800"
              >
                <CardContent className="p-4">
                  <div
                    className={cn(
                      "flex items-center justify-between gap-4",
                      ""
                    )}
                  >
                    <div className={cn("flex items-center gap-3", "")}>
                      {/* Icon */}
                      <div className="p-2.5 rounded-full bg-orange-100 dark:bg-orange-900/30 shrink-0">
                        <User className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      </div>

                      {/* Content */}
                      <div className={cn("flex-1 min-w-0", rtl && "text-right")}>
                        <div
                          className={cn(
                            "flex items-center gap-2",
                            ""
                          )}
                        >
                          <span
                            className={cn(
                              "font-medium",
                              rtl && "font-arabic",
                              isDemo && "blur-[3.5px] select-none pointer-events-none"
                            )}
                          >
                            {client.name ? maskName(client.name, isDemo) : (client.phone ? maskPhone(client.phone, isDemo) : maskId(client.platform_user_id, isDemo))}
                          </span>
                          <Badge
                            variant="secondary"
                            className="bg-orange-100 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 gap-1 text-[10px]"
                          >
                            <Bot className="w-3 h-3 opacity-50" />
                            {rtl ? "البوت متوقف" : "AI Paused"}
                          </Badge>
                        </div>
                        {client.name && (client.phone || client.platform_user_id) && (
                          <p
                            className={cn(
                              "text-xs text-muted-foreground mt-0.5",
                              rtl && "font-arabic",
                              isDemo && "blur-[3.5px] select-none pointer-events-none"
                            )}
                            dir="ltr"
                          >
                            {client.phone ? maskPhone(client.phone, isDemo) : maskId(client.platform_user_id, isDemo)}
                          </p>
                        )}
                        <div
                          className={cn(
                            "flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1",
                            rtl && "font-arabic"
                          )}
                        >
                          <Clock className="w-3 h-3" />
                          <span dir="ltr">
                            {new Date(client.last_interaction_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Enable AI button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn("shrink-0 text-orange-700 border-orange-200 hover:bg-orange-50", rtl && "font-arabic")}
                      onClick={() => openEnableDialog(client)}
                    >
                      <Bot className="w-4 h-4 mr-1.5" />
                      {rtl ? "تفعيل البوت" : "Enable AI"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Enable Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir={rtl ? "rtl" : "ltr"}>
          <AlertDialogHeader className={cn(rtl && "text-right items-end")}>
            <AlertDialogTitle className={cn(rtl && "font-arabic text-right")}>
              {rtl ? "تفعيل البوت الذكي" : "Enable AI Bot"}
            </AlertDialogTitle>
            <AlertDialogDescription className={cn(rtl && "font-arabic text-right")}>
              {rtl 
                ? "هل أنت متأكد من تفعيل البوت لهذا العميل؟ سيقوم البوت بالرد على رسائله القادمة تلقائياً." 
                : "Are you sure you want to re-enable the AI for this client? The bot will resume replying to their messages automatically."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedClient && (
            <div
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg bg-muted/50 mt-2",
                ""
              )}
            >
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20 shrink-0">
                <User className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div className={cn("min-w-0", rtl && "text-right")}>
                <p className="font-semibold" dir={rtl ? "rtl" : "ltr"}>
                  {selectedClient.name || selectedClient.phone || selectedClient.platform_user_id}
                </p>
                {(selectedClient.name) && (selectedClient.phone || selectedClient.platform_user_id) && (
                  <p className="text-sm text-muted-foreground" dir="ltr">
                    {selectedClient.phone || selectedClient.platform_user_id}
                  </p>
                )}
              </div>
            </div>
          )}
          <AlertDialogFooter
            className={cn(rtl && "flex-row-reverse sm:flex-row-reverse mt-4")}
          >
            <AlertDialogCancel className={rtl ? "font-arabic" : ""}>
              {t(locale, "cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEnableAi}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {rtl ? "تأكيد" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
