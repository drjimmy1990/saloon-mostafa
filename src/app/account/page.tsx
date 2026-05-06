"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  User,
  CalendarDays,
  Package,
  LogOut,
  Loader2,
  Pencil,
  Check,
  Phone,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BookingItem {
  id: string;
  serviceSummary: string;
  bookingDate: string;
  status: string;
  createdAt: string;
}

interface OrderItem {
  id: string;
  orderCode: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "قيد الانتظار", color: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "مؤكد", color: "bg-green-100 text-green-700" },
  completed: { label: "مكتمل", color: "bg-blue-100 text-blue-700" },
  cancelled: { label: "ملغي", color: "bg-red-100 text-red-700" },
  processing: { label: "قيد التحضير", color: "bg-purple-100 text-purple-700" },
  shipped: { label: "في الطريق", color: "bg-indigo-100 text-indigo-700" },
  delivered: { label: "تم التوصيل", color: "bg-green-100 text-green-700" },
};

export default function AccountPage() {
  const router = useRouter();
  const { user, client, isLoading, initialize, logout, refreshClient } = useAuthStore();

  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"bookings" | "orders">("bookings");

  // Profile editing
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (user) {
      fetchAccountData();
    }
  }, [user]);

  useEffect(() => {
    if (client) {
      setEditName(client.name || "");
      setEditAddress(client.address || "");
    }
  }, [client]);

  const fetchAccountData = async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      const res = await fetch(`/api/account?authUserId=${user.id}`);
      const data = await res.json();
      setBookings(data.bookings || []);
      setOrders(data.orders || []);
    } catch (err) {
      console.error("Failed to fetch account data:", err);
    } finally {
      setDataLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch("/api/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authUserId: user.id,
          name: editName,
          address: editAddress,
        }),
      });
      const data = await res.json();
      if (data.client) {
        await refreshClient();
        toast.success("تم تحديث بياناتك بنجاح ✨");
        setEditing(false);
      }
    } catch {
      toast.error("فشل تحديث البيانات");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/");
    toast.success("تم تسجيل الخروج");
  };

  if (isLoading || (!user && !isLoading)) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("ar-JO", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-cream py-12 md:py-20">
      <div className="container mx-auto max-w-2xl px-4 space-y-6">
        <h1
          className="text-3xl font-bold text-dark text-center"
          style={{ fontFamily: "'Tajawal', sans-serif" }}
        >
          حسابي
        </h1>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-border/50">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-terracotta/10 flex items-center justify-center">
                <User className="w-6 h-6 text-terracotta" />
              </div>
              <div>
                <h2 className="font-bold text-lg">
                  {client?.name || "زائرة جديدة"}
                </h2>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Phone className="w-3.5 h-3.5" />
                  <span dir="ltr">{client?.phone || user?.phone || ""}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Pencil className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {editing && (
            <div className="space-y-3 pt-3 border-t border-border/50">
              <div>
                <Label className="text-sm mb-1 block">الاسم</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="اسمك الكامل"
                />
              </div>
              <div>
                <Label className="text-sm mb-1 block">العنوان</Label>
                <Input
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="عنوان التوصيل"
                />
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="px-6 py-2.5 text-sm font-bold text-white rounded-xl gradient-terracotta shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                حفظ التغييرات
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("bookings")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all",
              activeTab === "bookings"
                ? "bg-terracotta text-white shadow-sm"
                : "bg-white text-muted-foreground border border-border/50 hover:bg-muted/50"
            )}
          >
            <CalendarDays className="w-4 h-4" />
            حجوزاتي ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all",
              activeTab === "orders"
                ? "bg-terracotta text-white shadow-sm"
                : "bg-white text-muted-foreground border border-border/50 hover:bg-muted/50"
            )}
          >
            <Package className="w-4 h-4" />
            طلباتي ({orders.length})
          </button>
        </div>

        {/* Content */}
        {dataLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-terracotta" />
          </div>
        ) : activeTab === "bookings" ? (
          <div className="space-y-3">
            {bookings.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-border/50">
                <CalendarDays className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">لا توجد حجوزات بعد</p>
              </div>
            ) : (
              bookings.map((b) => {
                const st = statusLabels[b.status] || statusLabels.pending;
                return (
                  <div
                    key={b.id}
                    className="bg-white rounded-2xl p-5 border border-border/50 shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-bold text-sm leading-relaxed flex-1">
                        {b.serviceSummary}
                      </p>
                      <Badge
                        className={cn(
                          "text-[10px] font-medium border-0 shrink-0",
                          st.color
                        )}
                      >
                        {st.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(b.bookingDate)}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-border/50">
                <Package className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">لا توجد طلبات بعد</p>
              </div>
            ) : (
              orders.map((o) => {
                const st = statusLabels[o.status] || statusLabels.pending;
                return (
                  <div
                    key={o.id}
                    className="bg-white rounded-2xl p-5 border border-border/50 shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold text-sm" dir="ltr">
                          #{o.orderCode}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {(o.items || []).map((i) => `${i.name} ×${i.qty}`).join("، ")}
                        </p>
                      </div>
                      <Badge
                        className={cn(
                          "text-[10px] font-medium border-0 shrink-0",
                          st.color
                        )}
                      >
                        {st.label}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                      <span>{formatDate(o.createdAt)}</span>
                      <span className="font-bold text-terracotta tabular-nums">
                        {o.total?.toFixed(2)} د.أ
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Logout */}
        <div className="pt-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-red-500 bg-red-50 hover:bg-red-100 transition-colors border border-red-100"
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );
}
