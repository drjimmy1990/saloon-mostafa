"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { t, isRTL } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  ClipboardList,
  Search,
  Eye,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
}

interface Order {
  id: string;
  orderCode: string;
  client_id: string | null;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  notes: string;
  createdAt: string;
}

const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
const PAYMENT_STATUSES = ["unpaid", "paid", "refunded"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  processing: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const paymentColors: Record<string, string> = {
  unpaid: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  refunded: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function OrdersSection() {
  const { locale } = useAppStore();
  const rtl = isRTL(locale);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Detail dialog
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // ─── Fetch ───────────────────────────────────────────────────────────────────

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(filterStatus !== "all" ? { status: filterStatus } : {}),
        ...(searchQuery ? { search: searchQuery } : {}),
      });

      const res = await fetch(`/api/orders?${params}`);
      const json = await res.json();
      setOrders(json.data || []);
      setTotal(json.total || 0);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filterStatus, searchQuery]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const totalPages = Math.ceil(total / limit);

  const openDetail = (order: Order) => {
    setSelectedOrder(order);
    setDetailDialogOpen(true);
  };

  const updateOrderField = async (field: "status" | "paymentStatus", value: string) => {
    if (!selectedOrder) return;
    setUpdatingStatus(true);

    try {
      await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedOrder.id, [field]: value }),
      });

      setSelectedOrder((prev) => prev ? { ...prev, [field]: value } : prev);
      fetchOrders();
    } catch (err) {
      console.error("Failed to update order:", err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2 className={cn("text-2xl font-bold tracking-tight", rtl && "font-arabic text-right")}>
            {t(locale, "orders.title")}
          </h2>
          <p className={cn("text-muted-foreground text-sm", rtl && "font-arabic text-right")}>
            {t(locale, "orders.subtitle")}
          </p>
        </div>
        <Button variant="outline" onClick={() => fetchOrders()} className="gap-2">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", rtl ? "right-3" : "left-3")} />
          <Input
            placeholder={t(locale, "search")}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className={cn("h-10", rtl ? "pr-10 text-right font-arabic" : "pl-10")}
          />
        </div>
        <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
          <SelectTrigger className={cn("w-44", rtl && "font-arabic")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className={cn(rtl && "font-arabic")}>
              {rtl ? "جميع الحالات" : "All Statuses"}
            </SelectItem>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s} className={cn(rtl && "font-arabic")}>
                {t(locale, `orders.${s}`) || t(locale, s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={cn(rtl && "text-right font-arabic")}>{t(locale, "orders.orderCode")}</TableHead>
                  <TableHead className={cn(rtl && "text-right font-arabic")}>{t(locale, "orders.customer")}</TableHead>
                  <TableHead className={cn(rtl && "text-right font-arabic")}>{t(locale, "orders.items")}</TableHead>
                  <TableHead className={cn(rtl && "text-right font-arabic")}>{t(locale, "orders.total")}</TableHead>
                  <TableHead className={cn(rtl && "text-right font-arabic")}>{t(locale, "orders.paymentStatus")}</TableHead>
                  <TableHead className={cn(rtl && "text-right font-arabic")}>{t(locale, "orders.orderStatus")}</TableHead>
                  <TableHead className={cn(rtl && "text-right font-arabic")}>{t(locale, "date")}</TableHead>
                  <TableHead className={cn(rtl && "text-right font-arabic")}>{t(locale, "actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className={cn("text-center py-12 text-muted-foreground", rtl && "font-arabic")}>
                      {t(locale, "noData")}
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">{order.orderCode}</TableCell>
                      <TableCell className={cn("font-medium", rtl && "text-right font-arabic")}>
                        {order.customerName}
                      </TableCell>
                      <TableCell className={cn(rtl && "text-right")}>
                        <Badge variant="outline" className="gap-1">
                          <Package className="w-3 h-3" />
                          {order.items?.length || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className={cn("tabular-nums", rtl && "text-right")}>
                        {order.total} {rtl ? "ر.س" : "SAR"}
                      </TableCell>
                      <TableCell>
                        <Badge className={paymentColors[order.paymentStatus] || ""}>
                          {t(locale, `orders.${order.paymentStatus}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[order.status] || ""}>
                          {t(locale, `orders.${order.status}`) || t(locale, order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="tabular-nums text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(order)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <span className="text-sm text-muted-foreground">
                {rtl ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Order Detail Dialog ──────────────────────────────────────────────── */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-[600px]" dir={rtl ? "rtl" : "ltr"}>
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className={cn(rtl && "font-arabic text-right")}>
                  {t(locale, "orders.viewOrder")} — {selectedOrder.orderCode}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className={cn("text-muted-foreground text-xs", rtl && "font-arabic")}>{t(locale, "orders.customer")}</Label>
                    <p className={cn("font-medium", rtl && "font-arabic")}>{selectedOrder.customerName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">{t(locale, "phone")}</Label>
                    <p className="font-medium" dir="ltr">{selectedOrder.customerPhone}</p>
                  </div>
                </div>

                {selectedOrder.customerAddress && (
                  <div>
                    <Label className={cn("text-muted-foreground text-xs", rtl && "font-arabic")}>{t(locale, "address")}</Label>
                    <p className={cn("font-medium", rtl && "font-arabic")}>{selectedOrder.customerAddress}</p>
                  </div>
                )}

                <Separator />

                {/* Items */}
                <div>
                  <Label className={cn("text-muted-foreground text-xs mb-2 block", rtl && "font-arabic")}>{t(locale, "orders.items")}</Label>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                        <span className={cn("text-sm", rtl && "font-arabic")}>{item.name}</span>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-muted-foreground">×{item.qty}</span>
                          <span className="font-medium tabular-nums">{item.price} {rtl ? "ر.س" : "SAR"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className={cn("text-muted-foreground", rtl && "font-arabic")}>{t(locale, "orders.subtotal")}</span>
                    <span className="tabular-nums">{selectedOrder.subtotal} {rtl ? "ر.س" : "SAR"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={cn("text-muted-foreground", rtl && "font-arabic")}>{t(locale, "orders.deliveryFee")}</span>
                    <span className="tabular-nums">{selectedOrder.deliveryFee} {rtl ? "ر.س" : "SAR"}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-1">
                    <span className={cn(rtl && "font-arabic")}>{t(locale, "orders.total")}</span>
                    <span className="tabular-nums">{selectedOrder.total} {rtl ? "ر.س" : "SAR"}</span>
                  </div>
                </div>

                <Separator />

                {/* Status Controls */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className={cn("text-xs", rtl && "font-arabic")}>{t(locale, "orders.orderStatus")}</Label>
                    <Select value={selectedOrder.status} onValueChange={(v) => updateOrderField("status", v)} disabled={updatingStatus}>
                      <SelectTrigger className={cn(rtl && "font-arabic")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className={cn(rtl && "font-arabic")}>
                            {t(locale, `orders.${s}`) || t(locale, s)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className={cn("text-xs", rtl && "font-arabic")}>{t(locale, "orders.paymentStatus")}</Label>
                    <Select value={selectedOrder.paymentStatus} onValueChange={(v) => updateOrderField("paymentStatus", v)} disabled={updatingStatus}>
                      <SelectTrigger className={cn(rtl && "font-arabic")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className={cn(rtl && "font-arabic")}>
                            {t(locale, `orders.${s}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
                  {t(locale, "close")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
