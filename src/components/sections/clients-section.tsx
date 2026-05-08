"use client";

import React, { useState, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { t, isRTL } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  Users,
  Search,
  Plus,
  Pencil,
  Trash2,
  Phone,
  MapPin,
  StickyNote,
  User,
  ShieldBan,
  Ban,
  MessageCircle,
  CalendarCheck,
  UserCheck,
  UserX,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Separator } from "@/components/ui/separator";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bot, BotOff } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Client {
  id: string;
  name?: string | null;
  phone: string;
  address: string;
  notes: string;
  platform?: string;
  platform_user_id?: string;
  avatar_url?: string;
  last_interaction_at?: string;
  last_message_preview?: string;
  unread_count?: number;
  status?: string;
  ai_enabled?: boolean;
  bookings_count?: number;
  createdAt?: string;
  channel_id?: string;
  auth_user_id?: string | null;
  Channel?: { name: string; type: string } | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ClientsSection() {
  const { locale, setActiveChatId } = useAppStore();
  const router = useRouter();
  const rtl = isRTL(locale);

  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [aiFilter, setAiFilter] = useState<"all" | "active" | "inactive">("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [clientTypeFilter, setClientTypeFilter] = useState<string>("all");

  const uniqueChannels = useMemo(() => {
    const channelMap = new Map<string, { value: string, label: string }>();
    clients.forEach(c => {
      const value = c.channel_id || c.platform;
      if (value && !channelMap.has(value)) {
        const name = c.Channel?.name || c.platform || "Unknown";
        const type = c.Channel?.type || c.platform || "Unknown";
        channelMap.set(value, {
          value,
          label: `${name} (${type})`
        });
      }
    });
    return Array.from(channelMap.values());
  }, [clients]);

  // Form state
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // ─── Fetch Data ───────────────────────────────────────────────────────────
  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/clients");
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch clients", err);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchClients();
  }, []);

  // ─── Filtering ────────────────────────────────────────────────────────────

  const filteredClients = useMemo(() => {
    let result = clients;
    
    if (searchQuery.trim()) {
      result = result.filter((c) => {
        const name = c.name || "";
        const phone = c.phone || "";
        return (
          name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          phone.includes(searchQuery)
        );
      });
    }

    if (aiFilter === "active") {
      result = result.filter((c) => c.ai_enabled !== false);
    } else if (aiFilter === "inactive") {
      result = result.filter((c) => c.ai_enabled === false);
    }

    if (channelFilter !== "all") {
      result = result.filter((c) => (c.channel_id || c.platform) === channelFilter);
    }

    if (clientTypeFilter === "registered") {
      result = result.filter((c) => !!c.auth_user_id);
    } else if (clientTypeFilter === "guest") {
      result = result.filter((c) => !c.auth_user_id);
    }

    return result;
  }, [clients, searchQuery, aiFilter, channelFilter, clientTypeFilter]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const resetForm = () => {
    setFormName("");
    setFormPhone("");
    setFormAddress("");
    setFormNotes("");
  };

  const openEditDialog = (client: Client) => {
    setSelectedClient(client);
    setFormName(client.name || "");
    setFormPhone(client.phone || "");
    setFormAddress(client.address || "");
    setFormNotes(client.notes || "");
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (client: Client) => {
    setSelectedClient(client);
    setDeleteDialogOpen(true);
  };

  const handleOpenChat = (client: Client) => {
    setActiveChatId(client.id);
    router.push("/chat");
  };

  const handleSave = async () => {
    if (!formName.trim()) return;

    try {
      const payload = {
        name: formName,
        phone: formPhone,
        address: formAddress,
        notes: formNotes,
      };

      if (selectedClient) {
        const res = await fetch(`/api/clients/${selectedClient.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          fetchClients();
        }
      }
    } catch (err) {
      console.error("Failed to save client", err);
    }

    setEditDialogOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (!selectedClient) return;

    try {
      const res = await fetch(`/api/clients/${selectedClient.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchClients();
      }
    } catch (err) {
      console.error("Failed to delete client", err);
    }
    setDeleteDialogOpen(false);
    setSelectedClient(null);
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
          {t(locale, "clients.title")}
        </h2>
        <p
          className={cn(
            "text-muted-foreground text-sm",
            rtl && "font-arabic text-right"
          )}
        >
          {t(locale, "clients.subtitle")}
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
        <Select
          value={channelFilter}
          onValueChange={(val: string) => setChannelFilter(val)}
        >
          <SelectTrigger className={cn("w-[160px] shrink-0", rtl && "font-arabic")}>
            <SelectValue placeholder={rtl ? "تصفية القناة" : "Filter Channel"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className={cn(rtl && "font-arabic")}>
              {rtl ? "كل القنوات" : "All Channels"}
            </SelectItem>
            {uniqueChannels.map(channel => (
              <SelectItem key={channel.value} value={channel.value} className={cn(rtl && "font-arabic")}>
                {channel.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={aiFilter}
          onValueChange={(val: any) => setAiFilter(val)}
        >
          <SelectTrigger className={cn("w-[160px] shrink-0", rtl && "font-arabic")}>
            <SelectValue placeholder={rtl ? "تصفية البوت" : "Filter Bot"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className={cn(rtl && "font-arabic")}>
              {rtl ? "الكل" : "All"}
            </SelectItem>
            <SelectItem value="active" className={cn(rtl && "font-arabic")}>
              {rtl ? "البوت يعمل" : "Bot Active"}
            </SelectItem>
            <SelectItem value="inactive" className={cn(rtl && "font-arabic")}>
              {rtl ? "البوت متوقف" : "Bot Paused"}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={clientTypeFilter}
          onValueChange={(val: string) => setClientTypeFilter(val)}
        >
          <SelectTrigger className={cn("w-[160px] shrink-0", rtl && "font-arabic")}>
            <SelectValue placeholder={rtl ? "نوع العميل" : "Client Type"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className={cn(rtl && "font-arabic")}>
              {rtl ? "الكل" : "All"}
            </SelectItem>
            <SelectItem value="registered" className={cn(rtl && "font-arabic")}>
              {rtl ? "مسجّل" : "Registered"}
            </SelectItem>
            <SelectItem value="guest" className={cn(rtl && "font-arabic")}>
              {rtl ? "ضيف" : "Guest"}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Card */}
      <Card className="border-sage-200 dark:border-sage-800/40 bg-sage-50 dark:bg-sage-900/20 py-0">
        <CardContent className="p-4">
          <div className={cn("flex items-center gap-3", "")}>
            <div className="p-2.5 rounded-xl bg-sage-100 dark:bg-sage-800/30 shrink-0">
              <Users className="w-5 h-5 text-sage-600 dark:text-sage-400" />
            </div>
            <div className={cn("min-w-0", rtl && "text-right")}>
              <p
                className={cn(
                  "text-xs font-medium text-muted-foreground",
                  rtl && "font-arabic"
                )}
              >
                {t(locale, "clients.totalClients")}
              </p>
              <p className="text-2xl font-bold tabular-nums">
                {isLoading ? "..." : clients.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card className="py-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={cn(rtl && "text-right font-arabic", "w-[250px]")}>
                    {t(locale, "clients.clientName")}
                  </TableHead>
                  <TableHead className={cn(rtl && "text-right font-arabic", "w-[150px]")}>
                    {t(locale, "clients.clientPhone")}
                  </TableHead>
                  <TableHead className={cn(rtl && "text-right font-arabic", "w-[150px]")}>
                    {rtl ? "القناة" : "Channel"}
                  </TableHead>
                  <TableHead className={cn(rtl && "text-right font-arabic", "w-[120px]")}>
                    {rtl ? "حالة البوت" : "Bot Status"}
                  </TableHead>
                  <TableHead className={cn(rtl && "text-right font-arabic", "w-[100px]")}>
                    {rtl ? "الحجوزات" : "Bookings"}
                  </TableHead>
                  <TableHead className={cn(rtl && "text-right font-arabic", "max-w-[200px]")}>
                    {t(locale, "clients.clientAddress")}
                  </TableHead>
                  <TableHead className={cn(rtl && "text-right font-arabic", "max-w-[200px]")}>
                    {t(locale, "clients.clientNotes")}
                  </TableHead>
                  <TableHead className={cn(rtl && "text-right font-arabic", "w-[120px]")}>
                    {t(locale, "actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className={cn(
                        "h-24 text-center text-muted-foreground",
                        rtl && "font-arabic"
                      )}
                    >
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className={cn(
                        "h-24 text-center text-muted-foreground",
                        rtl && "font-arabic"
                      )}
                    >
                      {t(locale, "noData")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client) => (
                    <TableRow key={client.id} className="hover:bg-muted/50">
                      <TableCell
                        className={cn(
                          "font-medium",
                          rtl && "text-right font-arabic"
                        )}
                      >
                        <div className={cn("flex items-center gap-2", "")}>
                          <div className="p-1.5 rounded-lg bg-primary/10 shrink-0">
                            <User className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5">
                              {client.name}
                              {client.auth_user_id ? (
                                <Badge variant="outline" className="gap-1 text-[10px] font-medium bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/40">
                                  <UserCheck className="w-3 h-3" />
                                  {rtl ? "مسجّل" : "Reg"}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="gap-1 text-[10px] font-medium bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800/40">
                                  <UserX className="w-3 h-3" />
                                  {rtl ? "ضيف" : "Guest"}
                                </Badge>
                              )}
                              {(client.unread_count ?? 0) > 0 && (
                                <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 leading-none shrink-0 rounded-full bg-primary text-primary-foreground">
                                  {client.unread_count}
                                </Badge>
                              )}
                            </div>
                            {client.last_message_preview && (
                              <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                                {client.last_message_preview}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "tabular-nums text-muted-foreground",
                          rtl && "text-right"
                        )}
                      >
                        {client.phone}
                      </TableCell>
                      <TableCell className={cn(rtl && "text-right")}>
                        <div className="flex flex-col">
                          <span className={cn("font-medium", rtl && "font-arabic")}>
                            {client.Channel?.name || client.platform || "-"}
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            {client.Channel?.type || client.platform || "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.ai_enabled === false ? (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/40 gap-1 pr-2">
                            <BotOff className="w-3 h-3" />
                            {rtl ? "متوقف" : "Paused"}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1 pr-2">
                            <Bot className="w-3 h-3" />
                            {rtl ? "يعمل" : "Active"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "tabular-nums font-medium",
                          rtl && "text-right"
                        )}
                      >
                        {client.bookings_count || 0}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "max-w-[200px] truncate text-muted-foreground",
                          rtl && "text-right font-arabic"
                        )}
                      >
                        {client.address}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "max-w-[200px] truncate text-muted-foreground",
                          rtl && "text-right font-arabic"
                        )}
                      >
                        {client.notes}
                      </TableCell>
                      <TableCell>
                        <div className={cn("flex items-center gap-1", "")}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                            onClick={() => handleOpenChat(client)}
                          >
                            <MessageCircle className="h-4 w-4" />
                            <span className="sr-only">Chat</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(client)}
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                            <span className="sr-only">{t(locale, "edit")}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openDeleteDialog(client)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">{t(locale, "delete")}</span>
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

      {/* Add/Edit Client Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent
          className={cn("sm:max-w-lg", rtl && "font-arabic")}
          dir={rtl ? "rtl" : "ltr"}
        >
          <DialogHeader className={cn(rtl && "text-right items-end")}>
            <DialogTitle className={cn(rtl && "font-arabic text-right")}>
              {t(locale, "clients.editClient")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {/* Name */}
            <div className="space-y-2">
              <Label className={cn(rtl && "font-arabic text-right block")}>
                {t(locale, "clients.clientName")}
              </Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={rtl ? "اسم العميل" : "Client Name"}
                className={rtl ? "font-arabic text-right" : ""}
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label className={cn(rtl && "font-arabic text-right block")}>
                {t(locale, "clients.clientPhone")}
              </Label>
              <div className="relative">
                <Phone
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground",
                    rtl ? "right-3" : "left-3"
                  )}
                />
                <Input
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+966 5X XXX XXXX"
                  className={rtl ? "pr-9 pl-3" : "pl-9 pr-3"}
                  dir="ltr"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label className={cn(rtl && "font-arabic text-right block")}>
                {t(locale, "clients.clientAddress")}
              </Label>
              <Input
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                placeholder={rtl ? "العنوان" : "Address"}
                className={rtl ? "font-arabic text-right" : ""}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className={cn(rtl && "font-arabic text-right block")}>
                {t(locale, "clients.clientNotes")}
              </Label>
              <Textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder={rtl ? "ملاحظات إضافية" : "Additional notes"}
                rows={3}
                className={rtl ? "font-arabic text-right" : ""}
              />
            </div>
          </div>
          <DialogFooter
            className={cn("mt-6", "")}
          >
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className={rtl ? "font-arabic" : ""}
            >
              {t(locale, "cancel")}
            </Button>
            <Button onClick={handleSave} className={rtl ? "font-arabic" : ""}>
              {t(locale, "save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir={rtl ? "rtl" : "ltr"}>
          <AlertDialogHeader className={cn(rtl && "text-right items-end")}>
            <AlertDialogTitle className={cn(rtl && "font-arabic text-right")}>
              {t(locale, "clients.deleteClient")}
            </AlertDialogTitle>
            <AlertDialogDescription className={cn(rtl && "font-arabic text-right")}>
              {t(locale, "clients.deleteConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedClient && (
            <div
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg bg-muted/50",
                ""
              )}
            >
              <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 shrink-0">
                <User className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <div className={cn("min-w-0", rtl && "text-right")}>
                <p className={cn("font-medium", rtl && "font-arabic")}>
                  {selectedClient.name}
                </p>
                <p className="text-sm text-muted-foreground tabular-nums">
                  {selectedClient.phone}
                </p>
              </div>
            </div>
          )}
          <AlertDialogFooter className={cn("")}>
            <AlertDialogCancel className={rtl ? "font-arabic" : ""}>
              {t(locale, "cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t(locale, "delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
