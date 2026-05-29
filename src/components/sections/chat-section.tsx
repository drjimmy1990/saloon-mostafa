"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { t, isRTL } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import {
  MessageCircle,
  Bot,
  User,
  Headphones,
  Send,
  Plus,
  Phone,
  Instagram,
  Facebook,
  ShieldBan,
  Menu,
  X,
  Trash2,
  Search,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

type MessageSender = "user" | "bot" | "agent";
type ChannelType = "whatsapp" | "facebook" | "instagram";

interface ChatMessage {
  id: string;
  client_id: string;
  sender_type: MessageSender;
  content_type: string;
  text_content: string;
  attachment_url: string;
  platform_timestamp: string;
  sent_at?: string;
  createdAt: string;
}

interface Client {
  id: string;
  channel_id: string;
  platform: ChannelType;
  platform_user_id: string;
  phone?: string;
  name?: string | null;
  avatar_url: string;
  last_interaction_at: string;
  last_message_preview: string;
  unread_count: number;
  status: string;
  ai_enabled: boolean;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

// Removed mockConversations

// ─── Config Maps ──────────────────────────────────────────────────────────────

const channelConfig: Record<
  ChannelType,
  {
    label: string;
    labelAr: string;
    icon: typeof MessageCircle;
    color: string;
    bgColor: string;
  }
> = {
  whatsapp: {
    label: "WhatsApp",
    labelAr: "واتساب",
    icon: Phone,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
  },
  facebook: {
    label: "Facebook",
    labelAr: "ماسنجر",
    icon: Facebook,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
  },
  instagram: {
    label: "Instagram",
    labelAr: "انستجرام",
    icon: Instagram,
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-50 dark:bg-pink-900/20",
  },
};

const senderConfig: Record<
  MessageSender,
  {
    label: string;
    labelAr: string;
    icon: typeof User;
    bubbleBg: string;
    bubbleText: string;
    labelColor: string;
  }
> = {
  user: {
    label: "User",
    labelAr: "المستخدم",
    icon: User,
    bubbleBg: "bg-sage-100 dark:bg-sage-900/30",
    bubbleText: "text-sage-900 dark:text-sage-100",
    labelColor: "text-sage-600 dark:text-sage-400",
  },
  bot: {
    label: "AI Bot",
    labelAr: "البوت الذكي",
    icon: Bot,
    bubbleBg: "bg-primary/10",
    bubbleText: "text-foreground",
    labelColor: "text-primary",
  },
  agent: {
    label: "Human Agent",
    labelAr: "العميل البشري",
    icon: Headphones,
    bubbleBg: "bg-terracotta-50 dark:bg-terracotta-900/20 border border-terracotta-200 dark:border-terracotta-800/40",
    bubbleText: "text-terracotta-900 dark:text-terracotta-100",
    labelColor: "text-terracotta-600 dark:text-terracotta-400",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ChatSection() {
  const { locale, activeChatId, setActiveChatId } = useAppStore();
  const rtl = isRTL(locale);

  const [clients, setClients] = useState<Client[]>([]);
  
  const [messageInput, setMessageInput] = useState("");
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [blockDialogContactId, setBlockDialogContactId] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState<ChannelType | "all">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [deleteChatId, setDeleteChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ─── Search State ──────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, [searchQuery]);

  // ─── Infinite Scroll State ──────────────────────────────────────────────
  const PAGE_SIZE = 10;
  const [clientPage, setClientPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const fetchClients = useCallback(async (page = 1, append = false, search = "") => {
    try {
      if (page === 1) setIsLoading(true);
      else setIsLoadingMore(true);

      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (search) params.set("search", search);

      const res = await fetch(`/api/clients?${params}`);
      if (!res.ok) {
        console.error("Clients API returned", res.status);
        return;
      }
      const json = await res.json();
      const allClients: Client[] = json.data || [];
      // Only show clients that have at least one message
      const newClients = allClients.filter(c => c.messages && c.messages.length > 0);
      const total: number = json.total ?? 0;

      setClients(prev => {
        if (!append) return newClients;
        const existingIds = new Set(prev.map(c => c.id));
        const unique = newClients.filter(c => !existingIds.has(c.id));
        return [...prev, ...unique];
      });
      setHasMore(page * PAGE_SIZE < total);
    } catch (err) {
      console.error("Failed to fetch conversations", err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  // Refetch from page 1 (used after mutations like send, toggle AI, delete)
  const refetchClients = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: "1", limit: String(clientPage * PAGE_SIZE) });
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/clients?${params}`);
      if (!res.ok) {
        console.error("Clients API returned", res.status);
        return;
      }
      const json = await res.json();
      const allClients: Client[] = json.data || [];
      // Only show clients that have at least one message
      const withMessages = allClients.filter(c => c.messages && c.messages.length > 0);
      const total: number = json.total ?? 0;
      setClients(withMessages);
      setHasMore(clientPage * PAGE_SIZE < total);
    } catch (err) {
      console.error("Failed to refetch conversations", err);
    }
  }, [clientPage, debouncedSearch]);

  // Reset pagination and fetch when search changes
  useEffect(() => {
    setClientPage(1);
    fetchClients(1, false, debouncedSearch);
  }, [debouncedSearch, fetchClients]);

  // Load more when sentinel is visible
  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    const nextPage = clientPage + 1;
    setClientPage(nextPage);
    fetchClients(nextPage, true, debouncedSearch);
  }, [clientPage, hasMore, isLoadingMore, fetchClients, debouncedSearch]);

  // IntersectionObserver for infinite scroll sentinel
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  // ─── Supabase Realtime Subscription ────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("chat-realtime")
      // Listen for new messages inserted into the Message table
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "Message" },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setClients((prev) => {
            // Check if the message's client_id matches any loaded client
            const clientIdx = prev.findIndex((c) => c.id === newMsg.client_id);
            if (clientIdx === -1) {
              // New client we haven't loaded — do a soft refetch
              refetchClients();
              return prev;
            }
            // Avoid duplicates (e.g. if we already added via optimistic update)
            const existing = prev[clientIdx];
            if (existing.messages.some((m) => m.id === newMsg.id)) return prev;
            // Inject the message into the correct client
            const updated = [...prev];
            updated[clientIdx] = {
              ...existing,
              messages: [...existing.messages, newMsg],
            };
            return updated;
          });
        }
      )
      // Listen for client row updates (unread_count, last_message_preview, etc.)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "Client" },
        (payload) => {
          const updatedClient = payload.new as Partial<Client> & { id: string };
          setClients((prev) =>
            prev.map((c) =>
              c.id === updatedClient.id
                ? {
                    ...c,
                    unread_count: updatedClient.unread_count ?? c.unread_count,
                    last_message_preview:
                      updatedClient.last_message_preview ?? c.last_message_preview,
                    last_interaction_at:
                      updatedClient.last_interaction_at ?? c.last_interaction_at,
                    ai_enabled:
                      updatedClient.ai_enabled ?? c.ai_enabled,
                  }
                : c
            )
          );
        }
      )
      // Listen for new clients being inserted
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "Client" },
        () => {
          // A brand new client appeared — refetch the list
          refetchClients();
        }
      )
      .subscribe((status) => {
        console.log("[Realtime] chat-realtime channel status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetchClients]);

  const activeClient = clients.find((c) => c.id === activeChatId) || null;

  // Auto-scroll to bottom when conversation changes or messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChatId, activeClient?.messages.length]);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/clients/${id}/read`, { method: "POST" });
      refetchClients();
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  useEffect(() => {
    if (activeChatId) {
      const client = clients.find((c) => c.id === activeChatId);
      if (client && client.unread_count > 0) {
        markAsRead(activeChatId);
      }
    }
  }, [activeChatId, clients]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleSelectClient = (id: string) => {
    setActiveChatId(id);
    setMobileShowChat(true);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeChatId || !activeClient || isSending) return;

    setIsSending(true);
    const text = messageInput;
    setMessageInput("");

    try {
      await fetch(`/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: activeChatId,
          sender_type: "agent",
          content_type: "text",
          text_content: text,
          platform_timestamp: new Date().toISOString()
        }),
      });
      refetchClients();
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleNewClient = async () => {
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: "whatsapp",
          platform_user_id: "new_client_" + Date.now(),
          name: rtl ? "عميل جديد" : "New Client",
          
          status: "active",
        }),
      });
      const newConv = await res.json();
      if (newConv && newConv.id) {
        setClients((prev) => [newConv, ...prev]);
        setActiveChatId(newConv.id);
        setMobileShowChat(true);
      }
    } catch (err) {
      console.error("Failed to create conversation", err);
    }
  };

  const handleBackToList = () => {
    setMobileShowChat(false);
  };

  const handleToggleAi = async (clientId: string) => {
    const conv = clients.find((c) => c.id === clientId);
    if (!conv) return;
    
    const newAiEnabled = !conv.ai_enabled;
    try {
      await fetch(`/api/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ai_enabled: newAiEnabled }),
      });
      refetchClients();
    } catch (err) {
      console.error("Failed to toggle AI status", err);
    }
    setBlockDialogContactId(null);
  };

  const handleConfirmDeleteChat = async () => {
    if (!deleteChatId) return;
    try {
      await fetch(`/api/clients/${deleteChatId}`, { method: "DELETE" });
      if (activeChatId === deleteChatId) {
        setActiveChatId(null);
        setMobileShowChat(false);
      }
      refetchClients();
    } catch (err) {
      console.error("Failed to delete chat", err);
    }
    setDeleteChatId(null);
  };

  // ─── Render Helpers ───────────────────────────────────────────────────────

  const renderChannelIcon = (channel: ChannelType) => {
    const config = channelConfig[channel];
    const Icon = config.icon;
    return <Icon className={cn("w-3.5 h-3.5", config.color)} />;
  };

  /**
   * Message alignment using margin-auto approach:
   * - User: ms-auto → aligns to the END of the row (right in LTR, left in RTL)
   * - Bot: me-auto → aligns to the START of the row (left in LTR, right in RTL)
   * - Agent: mx-auto → centered
   *
   * NO flex-row-reverse used for alignment.
   */
  const getMessageAlignment = (sender: MessageSender) => {
    switch (sender) {
      case "user":
        return "ms-auto";
      case "bot":
        return "me-auto";
      case "agent":
        return "me-auto";
    }
  };

  /** Sender label alignment mirrors the bubble alignment */
  const getLabelAlignment = (sender: MessageSender) => {
    switch (sender) {
      case "user":
        return "ms-auto w-fit";
      case "bot":
        return "me-auto w-fit";
      case "agent":
        return "me-auto w-fit";
    }
  };

  // ─── Block/Unblock AlertDialog ────────────────────────────────────────────

  const blockTargetContact = clients.find((c) => c.id === blockDialogContactId) || null;

  const blockAlertDialog = (
    <AlertDialog
      open={blockDialogContactId !== null}
      onOpenChange={(open) => {
        if (!open) setBlockDialogContactId(null);
      }}
    >
      <AlertDialogContent dir={rtl ? "rtl" : "ltr"}>
        <AlertDialogHeader>
          <AlertDialogTitle className={cn(rtl && "font-arabic")}>
            {blockTargetContact?.ai_enabled === false
              ? (rtl ? "تفعيل البوت" : "Enable AI Bot")
              : (rtl ? "إيقاف البوت" : "Disable AI Bot")}
          </AlertDialogTitle>
          <AlertDialogDescription className={cn(rtl && "font-arabic")}>
            {blockTargetContact?.ai_enabled === false
              ? rtl
                ? "هل أنت متأكد من تفعيل البوت الذكي لهذا المستخدم؟ سيقوم البوت بالرد عليه تلقائياً."
                : "Are you sure you want to enable the AI for this user? The bot will resume replying automatically."
              : rtl
                ? "هل أنت متأكد من إيقاف البوت الذكي؟ ستضطر للرد يدوياً على هذا العميل."
                : "Are you sure you want to disable the AI? The bot will stop replying to this user."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className={cn(rtl && "font-arabic")}>
            {t(locale, "cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (blockDialogContactId !== null) {
                handleToggleAi(blockDialogContactId);
              }
            }}
            className={cn(
              blockTargetContact?.ai_enabled !== false && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
              rtl && "font-arabic"
            )}
          >
            {blockTargetContact?.ai_enabled === false
              ? (rtl ? "تفعيل البوت" : "Enable AI")
              : (rtl ? "إيقاف البوت" : "Disable AI")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // ─── Delete Chat AlertDialog ──────────────────────────────────────────────

  const deleteChatAlertDialog = (
    <AlertDialog
      open={deleteChatId !== null}
      onOpenChange={(open) => {
        if (!open) setDeleteChatId(null);
      }}
    >
      <AlertDialogContent dir={rtl ? "rtl" : "ltr"}>
        <AlertDialogHeader>
          <AlertDialogTitle className={cn(rtl && "font-arabic")}>
            {rtl ? "حذف المحادثة" : "Delete Chat"}
          </AlertDialogTitle>
          <AlertDialogDescription className={cn(rtl && "font-arabic")}>
            {rtl
              ? "هل أنت متأكد من حذف هذه المحادثة بشكل نهائي؟ سيتم حذف جميع الرسائل المرتبطة بها ولا يمكن التراجع عن هذا الإجراء."
              : "Are you sure you want to permanently delete this chat? All associated messages will be deleted and this action cannot be undone."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className={cn(rtl && "font-arabic")}>
            {t(locale, "cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmDeleteChat}
            className={cn("bg-destructive text-destructive-foreground hover:bg-destructive/90", rtl && "font-arabic")}
          >
            {rtl ? "حذف" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // ─── Conversation List Panel ──────────────────────────────────────────────

  const conversationListPanel = (
    <div className="flex flex-col h-full min-h-0 overflow-hidden" dir={rtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="px-3 py-3 border-b">
        <div className="flex items-center justify-between">
          <h3 className={cn("font-semibold text-sm", rtl && "font-arabic text-right")}>
            {t(locale, "chat.conversations")}
          </h3>
          <select 
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value as any)}
            className={cn("text-xs h-7 px-2 rounded-md border border-input bg-background outline-none focus:ring-1 focus:ring-ring", rtl && "font-arabic")}
          >
            <option value="all">{rtl ? "جميع القنوات" : "All Channels"}</option>
            <option value="whatsapp">{rtl ? "واتساب" : "WhatsApp"}</option>
            <option value="facebook">{rtl ? "ماسنجر" : "Messenger"}</option>
            <option value="instagram">{rtl ? "انستجرام" : "Instagram"}</option>
          </select>
        </div>
      </div>

      {/* Search Input */}
      <div className="px-3 py-2 border-b shrink-0">
        <div className="relative">
          <Search
            className={cn(
              "absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground",
              rtl ? "right-2.5" : "left-2.5"
            )}
          />
          <Input
            placeholder={rtl ? "بحث بالاسم أو الرقم..." : "Search name or number..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "h-8 text-xs",
              rtl ? "pr-8 pl-2 font-arabic text-right" : "pl-8 pr-2"
            )}
          />
        </div>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1 min-h-0 overflow-hidden" dir={rtl ? "rtl" : "ltr"}>
        <div className="p-1.5 space-y-0.5">
          {clients.filter(c => channelFilter === "all" || c.platform === channelFilter).length === 0 ? (
            <div className={cn("p-6 text-center text-muted-foreground", rtl && "font-arabic")}>
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t(locale, "chat.noConversations")}</p>
            </div>
          ) : (
            clients.filter(c => channelFilter === "all" || c.platform === channelFilter).map((conv) => {
              const chConfig = channelConfig[conv.platform] || channelConfig["whatsapp"];
              const ChannelIcon = chConfig.icon;
              const isActive = conv.id === activeChatId;
              const isBlocked = conv.status === "blocked";
              const lastMsgText = conv.last_message_preview || (rtl ? "لا يوجد رسائل" : "No messages");
              const lastMsgTime = conv.last_interaction_at ? new Date(conv.last_interaction_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";

              return (
                <div
                  key={conv.id}
                  className={cn(
                    "group relative w-full rounded-md transition-colors duration-150",
                    isActive && "bg-muted"
                  )}
                >
                  <button
                    onClick={() => handleSelectClient(conv.id)}
                    className={cn(
                      "w-full text-start p-2 rounded-md hover:bg-muted/80 transition-colors",
                      rtl && "text-right"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar — compact */}
                      <div className={cn("p-2 rounded-full shrink-0 flex items-center justify-center", chConfig.bgColor)}>
                        <ChannelIcon className={cn("w-4 h-4", chConfig.color)} />
                      </div>
                      {/* Content — compact */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={cn("text-sm font-semibold truncate", rtl && "font-arabic")}>
                              {conv.name || conv.platform_user_id || conv.phone}
                            </span>
                            {conv.unread_count > 0 && (
                              <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 leading-none shrink-0 rounded-full bg-primary text-primary-foreground">
                                {conv.unread_count}
                              </Badge>
                            )}
                            {conv.ai_enabled === false && (
                              <Badge
                                variant="secondary"
                                className="text-[8px] px-1 py-0 h-3.5 leading-none shrink-0 bg-orange-100 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400"
                              >
                                {rtl ? "البوت متوقف" : "AI Paused"}
                              </Badge>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums font-medium" dir="ltr">
                            {lastMsgTime}
                          </span>
                        </div>
                        {conv.name && (conv.phone || conv.platform_user_id) && (
                          <p 
                            className="text-[11px] text-muted-foreground/80 truncate mt-0.5 tabular-nums" 
                            dir="ltr"
                            style={{ textAlign: rtl ? 'right' : 'left' }}
                          >
                            {conv.phone || conv.platform_user_id}
                          </p>
                        )}
                        <p className={cn("text-xs text-muted-foreground truncate mt-1", rtl && "font-arabic")}>
                          {lastMsgText}
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              );
            })
          )}
          {/* Infinite scroll sentinel */}
          {hasMore && (
            <div ref={loadMoreRef} className="flex items-center justify-center py-3">
              {isLoadingMore && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  // ─── Chat Area Panel ─────────────────────────────────────────────────────

  const chatAreaPanel = activeClient ? (
    <div className="flex flex-col h-full min-h-0" dir={rtl ? "rtl" : "ltr"}>
      {/* Chat Header — compact single line */}
      <div className="px-3 py-1.5 border-b shrink-0">
        <div className="flex items-center gap-2">
          {/* Back button (mobile only) */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-6 w-6 shrink-0"
            onClick={handleBackToList}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={rtl ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
            </svg>
          </Button>
          <div className={cn("p-2 rounded-full", (channelConfig[activeClient.platform] || channelConfig["whatsapp"]).bgColor)}>
            {renderChannelIcon(activeClient.platform)}
          </div>
          <div className="min-w-0 flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-1.5">
              <h3 className={cn("font-bold text-sm truncate", rtl && "font-arabic")}>
                {activeClient.name || activeClient.platform_user_id || activeClient.phone}
              </h3>
              {activeClient.ai_enabled === false && (
                <Badge variant="secondary" className="text-[8px] px-1 h-3.5 shrink-0 leading-none bg-orange-100 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400">
                  {rtl ? "البوت متوقف" : "AI Paused"}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              {(activeClient.name) && (activeClient.phone || activeClient.platform_user_id) && (
                <>
                  <span className="text-[11px] font-medium text-muted-foreground tabular-nums" dir="ltr">
                    {activeClient.phone || activeClient.platform_user_id}
                  </span>
                  <span className="text-[11px] text-muted-foreground/50">•</span>
                </>
              )}
              <span className={cn("text-[11px] text-muted-foreground/80", rtl && "font-arabic")}>
                {rtl
                  ? (channelConfig[activeClient.platform] || channelConfig["whatsapp"]).labelAr
                  : (channelConfig[activeClient.platform] || channelConfig["whatsapp"]).label}
              </span>
              <span className="text-[11px] text-muted-foreground/50">•</span>
              <span className="text-[11px] text-muted-foreground/80 tabular-nums">
                {activeClient.messages.length} {rtl ? "رسالة" : "msgs"}
              </span>
            </div>
          </div>
          {/* AI Toggle button in header — compact */}
          <Button
            variant={activeClient.ai_enabled === false ? "outline" : "ghost"}
            size="sm"
            onClick={() => setBlockDialogContactId(activeClient.id)}
            className={cn(
              "gap-1 shrink-0 text-[10px] h-6 px-2",
              activeClient.ai_enabled === false
                ? "text-orange-600 border-orange-600/30 hover:bg-orange-600/10"
                : "text-muted-foreground hover:text-orange-600",
              rtl && "font-arabic"
            )}
          >
            <Bot className={cn("w-3 h-3", activeClient.ai_enabled === false && "opacity-50")} />
            {activeClient.ai_enabled === false
              ? (rtl ? "تفعيل البوت" : "Enable AI")
              : (rtl ? "إيقاف البوت" : "Disable AI")}
          </Button>
          {/* Delete Chat Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteChatId(activeClient.id)}
            className="h-6 w-6 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0 ml-1"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* AI Paused Banner — compact */}
      {activeClient.ai_enabled === false && (
        <div className="px-3 py-1 bg-orange-50 dark:bg-orange-900/10 border-b shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Bot className="w-3 h-3 text-orange-600 shrink-0 opacity-50" />
              <p className={cn("text-[10px] text-orange-700 dark:text-orange-400 font-medium", rtl && "font-arabic")}>
                {rtl
                  ? "البوت الذكي متوقف مؤقتاً لهذا المستخدم. يجب عليك الرد يدوياً."
                  : "AI replies are paused for this user. You must reply manually."}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBlockDialogContactId(activeClient.id)}
              className={cn(
                "gap-1 shrink-0 text-[10px] h-5 px-1.5 border-orange-500/40 text-orange-700 hover:bg-orange-500/10 dark:text-orange-400",
                rtl && "font-arabic"
              )}
            >
              {rtl ? "تفعيل البوت" : "Enable AI"}
            </Button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <ScrollArea className="flex-1 min-h-0 p-3" dir={rtl ? "rtl" : "ltr"}>
        <div className="space-y-3">
          {[...activeClient.messages].sort((a, b) => {
            const timeA = new Date(a.platform_timestamp || a.sent_at || a.createdAt || 0).getTime();
            const timeB = new Date(b.platform_timestamp || b.sent_at || b.createdAt || 0).getTime();
            if (timeA !== timeB) return timeA - timeB;
            
            // Tie-breaker using actual database insertion time
            const sentA = new Date(a.sent_at || a.createdAt || 0).getTime();
            const sentB = new Date(b.sent_at || b.createdAt || 0).getTime();
            return sentA - sentB;
          }).map((msg) => {
            const config = senderConfig[msg.sender_type] || senderConfig["user"];
            const Icon = config.icon;
            const isAgent = msg.sender_type === "agent";

            return (
              <div key={msg.id} className="flex flex-col">
                {/* Sender label — inline with bubble, very compact */}
                <div className={cn("flex items-center gap-1 mb-0.5", getLabelAlignment(msg.sender_type))}>
                  <Icon className={cn("w-2.5 h-2.5", config.labelColor)} />
                  <span className={cn("text-[9px] font-medium", config.labelColor, rtl && "font-arabic")}>
                    {rtl ? config.labelAr : config.label}
                  </span>
                </div>

                {/* Message bubble — aligned via margin-auto */}
                <div
                  className={cn(
                    "flex flex-col max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed break-words whitespace-pre-wrap",
                    isAgent && "max-w-[90%]",
                    config.bubbleBg,
                    config.bubbleText,
                    getMessageAlignment(msg.sender_type)
                  )}
                  dir={rtl ? "rtl" : "ltr"}
                >
                  {msg.attachment_url && msg.attachment_url.trim() !== "" && (
                    <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="mb-2 block max-w-full">
                      {msg.content_type === "audio" ? (
                        <audio controls src={msg.attachment_url} className="max-w-full" />
                      ) : msg.content_type === "video" ? (
                        <video controls src={msg.attachment_url} className="max-w-full max-h-64 rounded-lg" />
                      ) : msg.content_type === "document" ? (
                        <div className="flex items-center gap-2 p-2 bg-black/5 dark:bg-white/5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                          <span className="text-xl">📄</span>
                          <span className="text-xs truncate font-medium underline">{msg.attachment_url.split('/').pop() || 'View Document'}</span>
                        </div>
                      ) : (
                        <img 
                          src={msg.attachment_url} 
                          alt="Attachment" 
                          className="max-w-full h-auto rounded-lg max-h-64 object-contain bg-black/5 dark:bg-white/5" 
                        />
                      )}
                    </a>
                  )}
                  {msg.text_content && msg.text_content.trim() !== "" && (
                    <p className={rtl ? "font-arabic" : ""}>
                      {msg.text_content}
                    </p>
                  )}
                  <span 
                    className="text-[9px] opacity-70 tabular-nums mt-1" 
                    dir="ltr"
                    style={{ textAlign: rtl ? 'left' : 'right' }}
                  >
                    {new Date(msg.platform_timestamp || msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input — compact, disabled when blocked */}
      <div className="p-2 border-t shrink-0">
        <div className="flex items-center gap-2">
          <Input
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder={
              t(locale, "chat.typeHere")
            }
            className={cn("flex-1", rtl && "font-arabic")}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            dir={rtl ? "rtl" : "ltr"}
          />
          <Button
            onClick={handleSendMessage}
            size="icon"
            className="shrink-0"
            disabled={!messageInput.trim() || isSending}
          >
            <Send className={cn("w-4 h-4", rtl && "rotate-180")} />
            <span className="sr-only">{t(locale, "chat.send")}</span>
          </Button>
        </div>
      </div>
    </div>
  ) : (
    /* Empty State */
    <div className="flex items-center justify-center h-full">
      <div className={cn("text-center text-muted-foreground", rtl && "font-arabic")} dir={rtl ? "rtl" : "ltr"}>
        <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">{t(locale, "chat.selectConversation")}</p>
      </div>
    </div>
  );

  // ─── Main Render ──────────────────────────────────────────────────────────

  return (
    <div
      className="flex flex-col h-full min-h-0 overflow-hidden"
      dir={rtl ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="space-y-1 shrink-0 mb-4">
        <h2 className={cn("text-2xl font-bold tracking-tight", rtl && "font-arabic text-right")}>
          {t(locale, "chat.title")}
        </h2>
        <p className={cn("text-muted-foreground text-sm", rtl && "font-arabic text-right")}>
          {t(locale, "chat.subtitle")}
        </p>
      </div>

      {/* Chat Layout */}
      <Card className="py-0 overflow-hidden flex-1 min-h-0">
        <CardContent className="p-0 h-full">
          <div className="flex h-full">
            {/* Conversation List — Hidden on mobile when chat is shown */}
            <div
              className={cn(
                "w-full md:w-64 shrink-0 h-full",
                rtl ? "border-l border-r-0" : "border-r",
                mobileShowChat && "hidden md:block"
              )}
            >
              {conversationListPanel}
            </div>

            {/* Chat Area — Hidden on mobile when list is shown */}
            <div
              className={cn(
                "flex-1 min-w-0 h-full",
                !mobileShowChat && "hidden md:block"
              )}
            >
              {chatAreaPanel}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Block/Unblock AlertDialog */}
      {blockAlertDialog}
      {deleteChatAlertDialog}
    </div>
  );
}
