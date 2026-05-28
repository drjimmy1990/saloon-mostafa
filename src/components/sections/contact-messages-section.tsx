"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { t, isRTL } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  Mail,
  MailOpen,
  Search,
  RefreshCw,
  Trash2,
  Phone,
  User,
  MessageSquare,
  Clock,
  MapPin,
  Filter,
  Loader2,
  Eye,
  CheckCircle2,
  Circle,
  Inbox,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
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

interface ContactMessage {
  id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  branchId?: string;
  Branch?: {
    id: string;
    name: string;
    nameAr: string;
  } | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ContactMessagesSection() {
  const { locale } = useAppStore();
  const rtl = isRTL(locale);

  // State
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Dialog state
  const [viewMessage, setViewMessage] = useState<ContactMessage | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Fetch
  const fetchMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: searchQuery,
        filter: filterStatus,
      });
      const res = await fetch(`/api/contact-messages?${params}`);
      const json = await res.json();
      setMessages(json.data || []);
      setTotal(json.total || 0);
      setUnread(json.unread || 0);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, filterStatus]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Toggle read
  const toggleRead = async (msg: ContactMessage) => {
    try {
      await fetch(`/api/contact-messages/${msg.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: !msg.isRead }),
      });
      fetchMessages();
    } catch (err) {
      console.error("Failed to toggle read:", err);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/contact-messages/${deleteId}`, { method: "DELETE" });
      setDeleteId(null);
      fetchMessages();
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

  // View & auto-mark read
  const openMessage = async (msg: ContactMessage) => {
    setViewMessage(msg);
    if (!msg.isRead) {
      try {
        await fetch(`/api/contact-messages/${msg.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isRead: true }),
        });
        // Update local state
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, isRead: true } : m))
        );
        setUnread((u) => Math.max(0, u - 1));
      } catch {}
    }
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString(rtl ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6" dir={rtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2 className={cn("text-2xl font-bold tracking-tight", rtl && "font-arabic text-right")}>
            {t(locale, "contactMessages.title")}
          </h2>
          <p className={cn("text-muted-foreground text-sm", rtl && "font-arabic text-right")}>
            {t(locale, "contactMessages.subtitle")}
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={fetchMessages} disabled={isLoading}>
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          <span className={cn(rtl && "font-arabic")}>{t(locale, "contactMessages.refresh")}</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="border-primary/20 bg-primary/5 py-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 shrink-0">
                <Inbox className="w-5 h-5 text-primary" />
              </div>
              <div className={cn("min-w-0", rtl && "text-right")}>
                <p className={cn("text-xs font-medium text-muted-foreground", rtl && "font-arabic")}>
                  {t(locale, "contactMessages.total")}
                </p>
                <p className="text-2xl font-bold tabular-nums">{isLoading ? "..." : total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/20 py-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-800/30 shrink-0">
                <Mail className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className={cn("min-w-0", rtl && "text-right")}>
                <p className={cn("text-xs font-medium text-muted-foreground", rtl && "font-arabic")}>
                  {t(locale, "contactMessages.unread")}
                </p>
                <p className="text-2xl font-bold tabular-nums">{isLoading ? "..." : unread}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-sage-200 dark:border-sage-800/40 bg-sage-50 dark:bg-sage-900/20 py-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-sage-100 dark:bg-sage-800/30 shrink-0">
                <MailOpen className="w-5 h-5 text-sage-600 dark:text-sage-400" />
              </div>
              <div className={cn("min-w-0", rtl && "text-right")}>
                <p className={cn("text-xs font-medium text-muted-foreground", rtl && "font-arabic")}>
                  {t(locale, "contactMessages.read")}
                </p>
                <p className="text-2xl font-bold tabular-nums">{isLoading ? "..." : total - unread}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="py-0">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", rtl ? "right-3" : "left-3")} />
              <Input
                placeholder={t(locale, "contactMessages.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className={cn("w-full", rtl ? "pr-10 font-arabic" : "pl-10")}
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
              <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
                <SelectTrigger className={cn("w-full sm:w-[160px]", rtl && "font-arabic")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className={rtl ? "font-arabic" : ""}>{t(locale, "contactMessages.filterAll")}</SelectItem>
                  <SelectItem value="unread" className={rtl ? "font-arabic" : ""}>{t(locale, "contactMessages.filterUnread")}</SelectItem>
                  <SelectItem value="read" className={rtl ? "font-arabic" : ""}>{t(locale, "contactMessages.filterRead")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : messages.length === 0 ? (
        <Card className="py-0">
          <CardContent className="p-12 text-center">
            <Mail className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className={cn("text-lg font-medium text-muted-foreground", rtl && "font-arabic")}>
              {t(locale, "contactMessages.noMessages")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="py-0 overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={cn("w-10", rtl && "text-right")} />
                  <TableHead className={cn(rtl && "text-right font-arabic")}>{t(locale, "contactMessages.colName")}</TableHead>
                  <TableHead className={cn(rtl && "text-right font-arabic")}>{t(locale, "contactMessages.colPhone")}</TableHead>
                  <TableHead className={cn("hidden md:table-cell", rtl && "text-right font-arabic")}>{t(locale, "contactMessages.colEmail")}</TableHead>
                  <TableHead className={cn("hidden lg:table-cell", rtl && "text-right font-arabic")}>{t(locale, "contactMessages.colMessage")}</TableHead>
                  <TableHead className={cn("hidden md:table-cell", rtl && "text-right font-arabic")}>{t(locale, "contactMessages.colBranch")}</TableHead>
                  <TableHead className={cn(rtl && "text-right font-arabic")}>{t(locale, "contactMessages.colDate")}</TableHead>
                  <TableHead className={cn("w-24", rtl && "text-right font-arabic")}>{t(locale, "contactMessages.colActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((msg) => (
                  <TableRow
                    key={msg.id}
                    className={cn(
                      "cursor-pointer hover:bg-accent/30 transition-colors",
                      !msg.isRead && "bg-primary/3 font-medium"
                    )}
                    onClick={() => openMessage(msg)}
                  >
                    <TableCell className="text-center">
                      {msg.isRead ? (
                        <MailOpen className="w-4 h-4 text-muted-foreground/40 mx-auto" />
                      ) : (
                        <div className="relative mx-auto w-fit">
                          <Mail className="w-4 h-4 text-amber-500" />
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className={cn(rtl && "font-arabic")}>
                      <span className={cn(!msg.isRead && "font-bold")}>{msg.name}</span>
                    </TableCell>
                    <TableCell dir="ltr" className="text-sm tabular-nums">{msg.phone}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground truncate max-w-[150px]">{msg.email || "—"}</TableCell>
                    <TableCell className={cn("hidden lg:table-cell text-sm text-muted-foreground truncate max-w-[200px]", rtl && "font-arabic")}>
                      {msg.message.length > 50 ? msg.message.substring(0, 50) + "..." : msg.message}
                    </TableCell>
                    <TableCell className={cn("hidden md:table-cell text-sm", rtl && "font-arabic")}>
                      {msg.Branch ? (
                        <Badge variant="outline" className="gap-1">
                          <MapPin className="w-3 h-3" />
                          {rtl ? msg.Branch.nameAr || msg.Branch.name : msg.Branch.name}
                        </Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(msg.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleRead(msg)} title={msg.isRead ? "Mark unread" : "Mark read"}>
                          {msg.isRead ? <Circle className="w-4 h-4 text-muted-foreground" /> : <CheckCircle2 className="w-4 h-4 text-primary" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteId(msg.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            {rtl ? "التالي" : "Previous"}
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            {rtl ? "السابق" : "Next"}
          </Button>
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={!!viewMessage} onOpenChange={() => setViewMessage(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className={cn(rtl && "font-arabic text-right")}>
              {t(locale, "contactMessages.messageDetails")}
            </DialogTitle>
          </DialogHeader>
          {viewMessage && (
            <div className={cn("space-y-4", rtl && "text-right")} dir={rtl ? "rtl" : "ltr"}>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                <User className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className={cn("text-xs text-muted-foreground", rtl && "font-arabic")}>{t(locale, "contactMessages.colName")}</p>
                  <p className={cn("font-medium", rtl && "font-arabic")}>{viewMessage.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                <Phone className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className={cn("text-xs text-muted-foreground", rtl && "font-arabic")}>{t(locale, "contactMessages.colPhone")}</p>
                  <p className="font-medium tabular-nums" dir="ltr">{viewMessage.phone}</p>
                </div>
              </div>
              {viewMessage.email && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                  <Mail className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className={cn("text-xs text-muted-foreground", rtl && "font-arabic")}>{t(locale, "contactMessages.colEmail")}</p>
                    <p className="font-medium">{viewMessage.email}</p>
                  </div>
                </div>
              )}
              {viewMessage.Branch && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                  <MapPin className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className={cn("text-xs text-muted-foreground", rtl && "font-arabic")}>{t(locale, "contactMessages.colBranch")}</p>
                    <p className={cn("font-medium", rtl && "font-arabic")}>{rtl ? viewMessage.Branch.nameAr || viewMessage.Branch.name : viewMessage.Branch.name}</p>
                  </div>
                </div>
              )}
              <div className="p-3 rounded-xl bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <p className={cn("text-xs text-muted-foreground", rtl && "font-arabic")}>{t(locale, "contactMessages.colMessage")}</p>
                </div>
                <p className={cn("text-sm leading-relaxed whitespace-pre-wrap", rtl && "font-arabic")}>{viewMessage.message}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                {formatDate(viewMessage.createdAt)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className={cn(rtl && "font-arabic text-right")}>
              {t(locale, "contactMessages.deleteTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription className={cn(rtl && "font-arabic text-right")}>
              {t(locale, "contactMessages.deleteConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={cn(rtl && "flex-row-reverse")}>
            <AlertDialogCancel className={cn(rtl && "font-arabic")}>{t(locale, "contactMessages.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              <span className={cn(rtl && "font-arabic")}>{t(locale, "contactMessages.delete")}</span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
