"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { t, isRTL } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  CalendarCheck,
  Clock,
  CreditCard,
  CheckCircle2,
  XCircle,
  Search,
  Eye,
  RefreshCw,
  MessageCircle,
  Phone,
  MapPin,
  Hash,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Users,
  Globe,
  UserCheck,
  UserX,
  Plus,
  Loader2,
  SlidersHorizontal,
  AlertCircle,
  Pencil,
  Trash2,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
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

// ─── Types ────────────────────────────────────────────────────────────────────

type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed" | "waiting_payment";
type ChannelSource = "whatsapp" | "facebook" | "instagram" | "website" | "manual";

export interface Booking {
  id: string;
  client_id: string;
  client?: {
    id: string;
    name: string;
    phone: string;
    address?: string;
    avatar_url?: string;
    auth_user_id?: string | null;
  };
  staff?: {
    id: string;
    name: string;
  } | null;
  serviceSummary: string;
  channelType: ChannelSource;
  bookingDate: string;
  status: BookingStatus;
  bookingCode?: string;
  depositStatus?: string;
  depositAmount?: number;
  createdAt?: string;
  serviceId?: string;
  staff_id?: string | null;
  branchId?: string;
  bookingTime?: string | null;
  location?: string;
  notes?: string | null;
}

// ─── Config Maps ──────────────────────────────────────────────────────────────

const statusConfig: Record<
  BookingStatus,
  {
    label: string;
    labelAr: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
    icon: typeof Clock;
  }
> = {
  pending: {
    label: "Pending",
    labelAr: "قيد الانتظار",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    textColor: "text-amber-700 dark:text-amber-400",
    borderColor: "border-amber-200 dark:border-amber-800/40",
    icon: Clock,
  },
  confirmed: {
    label: "Confirmed",
    labelAr: "مؤكد",
    bgColor: "bg-sage-50 dark:bg-sage-900/20",
    textColor: "text-sage-700 dark:text-sage-400",
    borderColor: "border-sage-200 dark:border-sage-800/40",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    labelAr: "ملغي",
    bgColor: "bg-red-50 dark:bg-red-900/20",
    textColor: "text-red-700 dark:text-red-400",
    borderColor: "border-red-200 dark:border-red-800/40",
    icon: XCircle,
  },
  completed: {
    label: "Completed",
    labelAr: "مكتمل",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    textColor: "text-blue-700 dark:text-blue-400",
    borderColor: "border-blue-200 dark:border-blue-800/40",
    icon: CheckCircle2,
  },
  waiting_payment: {
    label: "Waiting Payment",
    labelAr: "بانتظار الدفع",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
    textColor: "text-orange-700 dark:text-orange-400",
    borderColor: "border-orange-200 dark:border-orange-800/40",
    icon: CreditCard,
  },
};

const channelConfig: Record<
  ChannelSource,
  {
    label: string;
    labelAr: string;
    bgColor: string;
    textColor: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  whatsapp: {
    label: "WhatsApp",
    labelAr: "واتساب",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    textColor: "text-emerald-700 dark:text-emerald-400",
    icon: MessageCircle,
  },
  facebook: {
    label: "Facebook",
    labelAr: "ماسنجر",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    textColor: "text-blue-700 dark:text-blue-400",
    icon: MessageCircle,
  },
  instagram: {
    label: "Instagram",
    labelAr: "انستجرام",
    bgColor: "bg-pink-50 dark:bg-pink-900/20",
    textColor: "text-pink-700 dark:text-pink-400",
    icon: MessageCircle,
  },
  website: {
    label: "Website",
    labelAr: "الموقع",
    bgColor: "bg-violet-50 dark:bg-violet-900/20",
    textColor: "text-violet-700 dark:text-violet-400",
    icon: Globe,
  },
  manual: {
    label: "Manual",
    labelAr: "يدوي",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    textColor: "text-amber-700 dark:text-amber-400",
    icon: CalendarCheck,
  },
};

const statCardConfig = [
  {
    key: "total",
    labelKey: "dashboard.totalBookings",
    labelKeyAr: "dashboard.totalBookings",
    icon: CalendarCheck,
    colorClass: "primary" as const,
  },
  {
    key: "pending",
    labelKey: "pending",
    labelKeyAr: "pending",
    icon: Clock,
    colorClass: "amber" as const,
  },
  {
    key: "confirmed",
    labelKey: "confirmed",
    labelKeyAr: "confirmed",
    icon: CheckCircle2,
    colorClass: "sage" as const,
  },
  {
    key: "cancelled",
    labelKey: "cancelled",
    labelKeyAr: "cancelled",
    icon: XCircle,
    colorClass: "red" as const,
  },
  {
    key: "waiting_payment",
    labelKey: "waiting_payment",
    labelKeyAr: "waiting_payment",
    icon: CreditCard,
    colorClass: "orange" as const,
  },
];

const statColorMap = {
  primary: {
    bg: "bg-primary/5",
    iconBg: "bg-primary/10",
    iconText: "text-primary",
    border: "border-primary/20",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    iconBg: "bg-amber-100 dark:bg-amber-800/30",
    iconText: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800/40",
  },
  sage: {
    bg: "bg-sage-50 dark:bg-sage-900/20",
    iconBg: "bg-sage-100 dark:bg-sage-800/30",
    iconText: "text-sage-600 dark:text-sage-400",
    border: "border-sage-200 dark:border-sage-800/40",
  },
  red: {
    bg: "bg-red-50 dark:bg-red-900/20",
    iconBg: "bg-red-100 dark:bg-red-800/30",
    iconText: "text-red-600 dark:text-red-400",
    border: "border-red-200 dark:border-red-800/40",
  },
  orange: {
    bg: "bg-orange-50 dark:bg-orange-900/20",
    iconBg: "bg-orange-100 dark:bg-orange-800/30",
    iconText: "text-orange-600 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-800/40",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function BookingsSection() {
  const router = useRouter();
  const { locale, setActiveChatId } = useAppStore();
  const rtl = isRTL(locale);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("bookings_visible_columns");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return {
      clientName: true,
      clientPhone: true,
      serviceSummary: true,
      staff: true,
      channelSource: true,
      bookingDate: true,
      createdAt: false,
      depositAmount: false,
      bookingCode: false,
      bookingStatus: true,
    };
  });

  useEffect(() => {
    localStorage.setItem("bookings_visible_columns", JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  const activeColumnsCount = Object.values(visibleColumns).filter(Boolean).length + 1;

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [staffFilter, setStaffFilter] = useState<string>("all");
  const [clientTypeFilter, setClientTypeFilter] = useState<string>("all");
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [updateStatusDialogOpen, setUpdateStatusDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [newStatus, setNewStatus] = useState<BookingStatus>("pending");

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [channels, setChannels] = useState<{ id: string; name: string; type: string }[]>([]);
  const [staffList, setStaffList] = useState<{ id: string; name: string }[]>([]);
  const [branchList, setBranchList] = useState<{ id: string; name: string }[]>([]);
  const [serviceList, setServiceList] = useState<{ id: string; name: string }[]>([]);

  // ─── Manual Booking Dialog State ──────────────────────────────────────
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [manualSaving, setManualSaving] = useState(false);
  const [mbError, setMbError] = useState<string | null>(null);
  const [mbClientName, setMbClientName] = useState("");
  const [mbClientPhone, setMbClientPhone] = useState("");
  const [mbServiceId, setMbServiceId] = useState("");
  const [mbStaffId, setMbStaffId] = useState("");
  const [mbBranchId, setMbBranchId] = useState("");
  const [mbDate, setMbDate] = useState("");
  const [mbTime, setMbTime] = useState("");
  const [mbLocation, setMbLocation] = useState("salon");
  const [mbNotes, setMbNotes] = useState("");

  // ─── Edit Booking Dialog State ────────────────────────────────────────
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [ebError, setEbError] = useState<string | null>(null);
  const [ebClientName, setEbClientName] = useState("");
  const [ebClientPhone, setEbClientPhone] = useState("");
  const [ebServiceId, setEbServiceId] = useState("");
  const [ebStaffId, setEbStaffId] = useState("");
  const [ebBranchId, setEbBranchId] = useState("");
  const [ebDate, setEbDate] = useState("");
  const [ebTime, setEbTime] = useState("");
  const [ebLocation, setEbLocation] = useState("salon");
  const [ebNotes, setEbNotes] = useState("");
  const [ebStatus, setEbStatus] = useState<BookingStatus>("pending");

  // ─── Delete Confirmation State ────────────────────────────────────────
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSaving, setDeleteSaving] = useState(false);

  useEffect(() => {
    fetch('/api/channels')
      .then(r => r.json())
      .then(data => setChannels(Array.isArray(data) ? data : []))
      .catch(console.error);
    fetch('/api/staff')
      .then(r => r.json())
      .then(data => setStaffList(Array.isArray(data) ? data : []))
      .catch(console.error);
    fetch('/api/branches')
      .then(r => r.json())
      .then(data => setBranchList(Array.isArray(data) ? data : []))
      .catch(console.error);
    fetch('/api/products?type=service')
      .then(r => r.json())
      .then(data => setServiceList(Array.isArray(data) ? data.filter((p: { type?: string }) => p.type === 'service') : []))
      .catch(console.error);
  }, []);

  // ─── Pagination ──────────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, cancelled: 0, waiting_payment: 0 });

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // ─── Fetch Data ───────────────────────────────────────────────────────────
  const fetchBookings = useCallback(async (p: number, limit: number, search: string, channel: string, status: string, staff: string, from: string, to: string) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: String(p),
        limit: String(limit),
        search,
        channel,
        status,
        staff,
      });
      if (from) params.set("dateFrom", from);
      if (to) params.set("dateTo", to);
      const res = await fetch(`/api/bookings?${params}`);
      const json = await res.json();
      setBookings(json.data || []);
      setTotalCount(json.total ?? 0);
      if (json.stats) setStats(json.stats);
    } catch (err) {
      console.error("Failed to fetch bookings", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce search input
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  // Reset to page 1 when filters change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [channelFilter, statusFilter, staffFilter, clientTypeFilter, dateFrom, dateTo]);

  // Fetch on param change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBookings(page, pageSize, debouncedSearch, channelFilter, statusFilter, staffFilter, dateFrom, dateTo);
  }, [page, pageSize, debouncedSearch, channelFilter, statusFilter, staffFilter, dateFrom, dateTo, fetchBookings]);

  const filteredBookings = clientTypeFilter === "all"
    ? bookings
    : bookings.filter((b) => {
        const isRegistered = !!b.client?.auth_user_id;
        return clientTypeFilter === "registered" ? isRegistered : !isRegistered;
      });

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setDetailDialogOpen(true);
  };

  const handleUpdateStatus = (booking: Booking) => {
    setSelectedBooking(booking);
    setNewStatus(booking.status);
    setUpdateStatusDialogOpen(true);
  };

  const handleViewChat = (booking: Booking) => {
    setActiveChatId(booking.client_id);
    router.push('/chat');
  };

  const handleManualBookingSave = async () => {
    if (!mbClientName || !mbClientPhone || !mbServiceId || !mbDate) return;
    setManualSaving(true);
    setMbError(null);
    try {
      const selectedService = serviceList.find(s => s.id === mbServiceId);
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: mbClientName,
          clientPhone: mbClientPhone,
          serviceId: mbServiceId,
          serviceSummary: selectedService?.name || '',
          bookingDate: mbDate,
          bookingTime: mbTime,
          staff_id: (mbStaffId === "none" || !mbStaffId) ? undefined : mbStaffId,
          branchId: mbBranchId || undefined,
          location: mbLocation,
          notes: mbNotes,
          paymentMethod: 'cash',
          source: 'manual',
          channelType: 'manual',
          status: 'confirmed',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.error || (rtl ? "حدث خطأ أثناء حفظ الحجز" : "An error occurred while saving the booking");
        setMbError(errorMessage);
        toast.error(errorMessage);
      } else {
        toast.success(rtl ? "تم حفظ الحجز بنجاح" : "Booking saved successfully");
        setManualDialogOpen(false);
        setMbClientName(''); setMbClientPhone(''); setMbServiceId('');
        setMbStaffId(''); setMbBranchId(''); setMbDate(''); setMbTime('');
        setMbLocation('salon'); setMbNotes('');
        setMbError(null);
        fetchBookings(page, pageSize, debouncedSearch, channelFilter, statusFilter, staffFilter, dateFrom, dateTo);
      }
    } catch (err) {
      console.error('Failed to create manual booking', err);
      const catchMessage = rtl ? "فشل الاتصال بالخادم" : "Failed to connect to the server";
      setMbError(catchMessage);
      toast.error(catchMessage);
    } finally {
      setManualSaving(false);
    }
  };

  const confirmStatusUpdate = async () => {
    if (!selectedBooking) return;

    try {
      const res = await fetch(`/api/bookings/${selectedBooking.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (res.ok) {
        toast.success(rtl ? "تم تحديث حالة الحجز بنجاح" : "Booking status updated successfully");
        fetchBookings(page, pageSize, debouncedSearch, channelFilter, statusFilter, staffFilter, dateFrom, dateTo);
        setUpdateStatusDialogOpen(false);
        setSelectedBooking(null);
      } else {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.error || (rtl ? "فشل تحديث حالة الحجز" : "Failed to update booking status");
        toast.error(errorMessage);
      }
    } catch (err) {
      console.error("Failed to update status", err);
      const catchMessage = rtl ? "فشل الاتصال بالخادم" : "Failed to connect to the server";
      toast.error(catchMessage);
    }
  };

  const handleEditBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setEbClientName(booking.client?.name || "");
    setEbClientPhone(booking.client?.phone || "");
    setEbServiceId(booking.serviceId || "");
    setEbStaffId(booking.staff_id || "none");
    setEbBranchId(booking.branchId || "");
    setEbDate(booking.bookingDate ? booking.bookingDate.split('T')[0] : "");
    setEbTime(booking.bookingTime || "");
    setEbLocation(booking.location || "salon");
    setEbNotes(booking.notes || "");
    setEbStatus(booking.status || "pending");
    setEbError(null);
    setEditDialogOpen(true);
  };

  const handleEditBookingSave = async () => {
    if (!selectedBooking) return;
    if (!ebClientName || !ebClientPhone || !ebServiceId || !ebDate) return;

    setEditSaving(true);
    setEbError(null);
    try {
      const selectedService = serviceList.find(s => s.id === ebServiceId);
      const res = await fetch(`/api/bookings/${selectedBooking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: ebClientName,
          clientPhone: ebClientPhone,
          serviceId: ebServiceId,
          serviceSummary: selectedService?.name || '',
          bookingDate: ebDate,
          bookingTime: ebTime || undefined,
          staff_id: (ebStaffId === "none" || !ebStaffId) ? undefined : ebStaffId,
          branchId: ebBranchId || undefined,
          location: ebLocation,
          notes: ebNotes,
          status: ebStatus,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.error || (rtl ? "حدث خطأ أثناء تعديل الحجز" : "An error occurred while editing the booking");
        setEbError(errorMessage);
        toast.error(errorMessage);
      } else {
        toast.success(rtl ? "تم تعديل الحجز بنجاح" : "Booking updated successfully");
        setEditDialogOpen(false);
        setEbError(null);
        fetchBookings(page, pageSize, debouncedSearch, channelFilter, statusFilter, staffFilter, dateFrom, dateTo);
      }
    } catch (err) {
      console.error('Failed to save edited booking', err);
      const catchMessage = rtl ? "فشل الاتصال بالخادم" : "Failed to connect to the server";
      setEbError(catchMessage);
      toast.error(catchMessage);
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedBooking) return;
    setDeleteSaving(true);
    try {
      const res = await fetch(`/api/bookings/${selectedBooking.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(rtl ? "تم حذف الحجز بنجاح" : "Booking deleted successfully");
        setDeleteDialogOpen(false);
        fetchBookings(page, pageSize, debouncedSearch, channelFilter, statusFilter, staffFilter, dateFrom, dateTo);
      } else {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.error || (rtl ? "فشل حذف الحجز" : "Failed to delete booking");
        toast.error(errorMessage);
      }
    } catch (err) {
      console.error("Failed to delete booking", err);
      toast.error(rtl ? "حدث خطأ أثناء الاتصال بالخادم" : "An error occurred while connecting to the server");
    } finally {
      setDeleteSaving(false);
      setSelectedBooking(null);
    }
  };

  // ─── Render Helpers ───────────────────────────────────────────────────────

  const renderStatusBadge = (status: BookingStatus) => {
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <Badge
        variant="outline"
        className={cn(
          "gap-1 text-[11px] font-medium border",
          config.bgColor,
          config.textColor,
          config.borderColor
        )}
      >
        <Icon className="w-3 h-3" />
        {rtl ? config.labelAr : config.label}
      </Badge>
    );
  };

  const formatBookingDate = (dateStr: string | undefined) => {
    if (!dateStr) return { dayName: "", date: "", time: "" };
    const d = new Date(dateStr);
    const tz = "UTC";
    const dayName = rtl
      ? d.toLocaleDateString("ar-SA", { weekday: "long", timeZone: tz })
      : d.toLocaleDateString("en-US", { weekday: "long", timeZone: tz });
    const date = d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: tz,
    });
    const time = d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: tz,
    });
    return { dayName, date, time };
  };

  const renderChannelBadge = (channel: ChannelSource) => {
    const config = channelConfig[channel] || channelConfig.whatsapp;
    const Icon = config.icon;
    return (
      <Badge
        variant="outline"
        className={cn(
          "gap-1 text-[11px] font-medium border",
          config.bgColor,
          config.textColor
        )}
      >
        <Icon className="w-3 h-3" />
        {rtl ? config.labelAr : config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6" dir={rtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2
            className={cn(
              "text-2xl font-bold tracking-tight",
              rtl && "font-arabic text-right"
            )}
          >
            {t(locale, "bookings.title")}
          </h2>
          <p
            className={cn(
              "text-muted-foreground text-sm",
              rtl && "font-arabic text-right"
            )}
          >
            {t(locale, "bookings.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <DropdownMenu dir={rtl ? "rtl" : "ltr"}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 shrink-0">
                <SlidersHorizontal className="w-4 h-4" />
                <span className={cn(rtl && "font-arabic")}>
                  {rtl ? "الأعمدة" : "Columns"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={rtl ? "start" : "end"} className="w-56">
              <DropdownMenuLabel className={cn(rtl && "font-arabic", rtl && "text-right")}>
                {rtl ? "تخصيص الأعمدة" : "Customize Columns"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={visibleColumns.clientName}
                onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, clientName: !!checked }))}
                className={cn(rtl && "font-arabic justify-start text-right")}
              >
                {t(locale, "bookings.clientName")}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.clientPhone}
                onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, clientPhone: !!checked }))}
                className={cn(rtl && "font-arabic justify-start text-right")}
              >
                {t(locale, "bookings.clientPhone")}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.serviceSummary}
                onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, serviceSummary: !!checked }))}
                className={cn(rtl && "font-arabic justify-start text-right")}
              >
                {t(locale, "bookings.serviceSummary")}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.staff}
                onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, staff: !!checked }))}
                className={cn(rtl && "font-arabic justify-start text-right")}
              >
                {rtl ? "العاملة" : "Staff"}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.channelSource}
                onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, channelSource: !!checked }))}
                className={cn(rtl && "font-arabic justify-start text-right")}
              >
                {t(locale, "bookings.channelSource")}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.bookingDate}
                onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, bookingDate: !!checked }))}
                className={cn(rtl && "font-arabic justify-start text-right")}
              >
                {t(locale, "bookings.bookingDate")}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.createdAt}
                onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, createdAt: !!checked }))}
                className={cn(rtl && "font-arabic justify-start text-right")}
              >
                {t(locale, "bookings.createdAt")}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.depositAmount}
                onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, depositAmount: !!checked }))}
                className={cn(rtl && "font-arabic justify-start text-right")}
              >
                {rtl ? "العربون" : "Deposit"}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.bookingCode}
                onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, bookingCode: !!checked }))}
                className={cn(rtl && "font-arabic justify-start text-right")}
              >
                {rtl ? "رمز الحجز" : "Booking Code"}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.bookingStatus}
                onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, bookingStatus: !!checked }))}
                className={cn(rtl && "font-arabic justify-start text-right")}
              >
                {t(locale, "bookings.bookingStatus")}
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => { setMbError(null); setManualDialogOpen(true); }} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            <span className={cn(rtl && "font-arabic")}>{t(locale, "bookings.addBooking")}</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="space-y-3">
        <div
          className={cn(
            "flex flex-col sm:flex-row gap-3",
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
              className={cn(rtl ? "pr-9 pl-3" : "pl-9 pr-3", rtl && "font-arabic text-right")}
            />
          </div>

          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className={cn("w-full sm:w-[180px]", rtl && "font-arabic")}>
              <SelectValue placeholder={t(locale, "bookings.allChannels")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className={rtl ? "font-arabic" : ""}>
                {t(locale, "bookings.allChannels")}
              </SelectItem>
              <SelectItem value="manual" className={rtl ? "font-arabic" : ""}>
                {rtl ? "يدوي" : "Manual"}
              </SelectItem>
              {channels.map((ch) => (
                <SelectItem key={ch.id} value={ch.id} className={rtl ? "font-arabic" : ""}>
                  {ch.name} ({ch.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className={cn("w-full sm:w-[180px]", rtl && "font-arabic")}>
              <SelectValue placeholder={t(locale, "bookings.allStatuses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className={rtl ? "font-arabic" : ""}>
                {t(locale, "bookings.allStatuses")}
              </SelectItem>
              <SelectItem value="pending" className={rtl ? "font-arabic" : ""}>
                {t(locale, "pending")}
              </SelectItem>
              <SelectItem value="confirmed" className={rtl ? "font-arabic" : ""}>
                {t(locale, "confirmed")}
              </SelectItem>
              <SelectItem value="cancelled" className={rtl ? "font-arabic" : ""}>
                {t(locale, "cancelled")}
              </SelectItem>
              <SelectItem value="completed" className={rtl ? "font-arabic" : ""}>
                {t(locale, "completed")}
              </SelectItem>
              <SelectItem value="waiting_payment" className={rtl ? "font-arabic" : ""}>
                {rtl ? "بانتظار الدفع" : "Waiting Payment"}
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={staffFilter} onValueChange={setStaffFilter}>
            <SelectTrigger className={cn("w-full sm:w-[180px]", rtl && "font-arabic")}>
              <SelectValue placeholder={rtl ? "كل العاملات" : "All Staff"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className={rtl ? "font-arabic" : ""}>
                {rtl ? "كل العاملات" : "All Staff"}
              </SelectItem>
              {staffList.map((s) => (
                <SelectItem key={s.id} value={s.id} className={rtl ? "font-arabic" : ""}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={clientTypeFilter} onValueChange={setClientTypeFilter}>
            <SelectTrigger className={cn("w-full sm:w-[180px]", rtl && "font-arabic")}>
              <SelectValue placeholder={rtl ? "الكل" : "All Types"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className={rtl ? "font-arabic" : ""}>
                {rtl ? "الكل" : "All Types"}
              </SelectItem>
              <SelectItem value="registered" className={rtl ? "font-arabic" : ""}>
                {rtl ? "مسجّل" : "Registered"}
              </SelectItem>
              <SelectItem value="guest" className={rtl ? "font-arabic" : ""}>
                {rtl ? "ضيف" : "Guest"}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Filter */}
        <div className={cn("flex items-center gap-2")}>
          <CalendarCheck className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className={cn("text-sm text-muted-foreground shrink-0", rtl && "font-arabic")}>
            {rtl ? "من" : "From"}
          </span>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full sm:w-[150px] text-sm"
          />
          <span className={cn("text-sm text-muted-foreground shrink-0", rtl && "font-arabic")}>
            {rtl ? "إلى" : "To"}
          </span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full sm:w-[150px] text-sm"
          />
          {(dateFrom || dateTo) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => { setDateFrom(""); setDateTo(""); }}
            >
              <XCircle className="w-4 h-4 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCardConfig.map((stat) => {
          const Icon = stat.icon;
          const colors = statColorMap[stat.colorClass];
          const value =
            stat.key === "total"
              ? stats.total
              : stats[stat.key as keyof typeof stats];
          return (
            <Card
              key={stat.key}
              className={cn(
                "border hover:shadow-md transition-shadow duration-200 cursor-default py-0",
                colors.border,
                colors.bg
              )}
            >
              <CardContent className="p-4">
                <div className={cn("flex items-center gap-3", "")}>
                  <div
                    className={cn(
                      "p-2 rounded-xl shrink-0",
                      colors.iconBg
                    )}
                  >
                    <Icon className={cn("w-4 h-4", colors.iconText)} />
                  </div>
                  <div className={cn("min-w-0", rtl && "text-right")}>
                    <p
                      className={cn(
                        "text-xs font-medium text-muted-foreground truncate",
                        rtl && "font-arabic"
                      )}
                    >
                      {stat.key === "total"
                        ? t(locale, "dashboard.totalBookings")
                        : t(locale, stat.key)}
                    </p>
                    <p className="text-xl font-bold tabular-nums">
                      {isLoading ? "..." : value}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bookings Table */}
      <Card className="py-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleColumns.clientName && (
                    <TableHead className={cn(rtl && "text-right font-arabic")}>
                      {t(locale, "bookings.clientName")}
                    </TableHead>
                  )}
                  {visibleColumns.clientPhone && (
                    <TableHead className={cn(rtl && "text-right font-arabic")}>
                      {t(locale, "bookings.clientPhone")}
                    </TableHead>
                  )}
                  {visibleColumns.serviceSummary && (
                    <TableHead className={cn(rtl && "text-right font-arabic")}>
                      {t(locale, "bookings.serviceSummary")}
                    </TableHead>
                  )}
                  {visibleColumns.staff && (
                    <TableHead className={cn(rtl && "text-right font-arabic")}>
                      {rtl ? "العاملة" : "Staff"}
                    </TableHead>
                  )}
                  {visibleColumns.channelSource && (
                    <TableHead className={cn(rtl && "text-right font-arabic")}>
                      {t(locale, "bookings.channelSource")}
                    </TableHead>
                  )}
                  {visibleColumns.bookingDate && (
                    <TableHead className={cn(rtl && "text-right font-arabic")}>
                      {t(locale, "bookings.bookingDate")}
                    </TableHead>
                  )}
                  {visibleColumns.createdAt && (
                    <TableHead className={cn(rtl && "text-right font-arabic")}>
                      {t(locale, "bookings.createdAt")}
                    </TableHead>
                  )}
                  {visibleColumns.depositAmount && (
                    <TableHead className={cn(rtl && "text-right font-arabic")}>
                      {rtl ? "العربون" : "Deposit"}
                    </TableHead>
                  )}
                  {visibleColumns.bookingCode && (
                    <TableHead className={cn(rtl && "text-right font-arabic")}>
                      {rtl ? "رمز الحجز" : "Booking Code"}
                    </TableHead>
                  )}
                  {visibleColumns.bookingStatus && (
                    <TableHead className={cn(rtl && "text-right font-arabic")}>
                      {t(locale, "bookings.bookingStatus")}
                    </TableHead>
                  )}
                  <TableHead className={cn(rtl && "text-right font-arabic")}>
                    {t(locale, "actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={activeColumnsCount}
                      className={cn(
                        "h-24 text-center text-muted-foreground",
                        rtl && "font-arabic"
                      )}
                    >
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredBookings.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={activeColumnsCount}
                      className={cn(
                        "h-24 text-center text-muted-foreground",
                        rtl && "font-arabic"
                      )}
                    >
                      {t(locale, "noData")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBookings.map((booking) => (
                    <TableRow key={booking.id} className="hover:bg-muted/50">
                      {visibleColumns.clientName && (
                        <TableCell
                          className={cn(
                            "font-medium",
                            rtl && "text-right font-arabic"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span>{booking.client?.name || 'Unknown'}</span>
                            {booking.client?.auth_user_id ? (
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
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.clientPhone && (
                        <TableCell
                          className={cn(
                            "tabular-nums text-muted-foreground",
                            rtl && "text-right"
                          )}
                        >
                          {booking.client?.phone || 'N/A'}
                        </TableCell>
                      )}
                      {visibleColumns.serviceSummary && (
                        <TableCell
                          className={cn(
                            "max-w-[200px] truncate",
                            rtl && "text-right font-arabic"
                          )}
                        >
                          {booking.serviceSummary}
                        </TableCell>
                      )}
                      {visibleColumns.staff && (
                        <TableCell
                          className={cn(
                            rtl && "text-right font-arabic"
                          )}
                        >
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-sm">{booking.staff?.name || (rtl ? 'غير محدد' : 'Unassigned')}</span>
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.channelSource && (
                        <TableCell className={rtl ? "text-right" : ""}>
                          {renderChannelBadge(booking.channelType)}
                        </TableCell>
                      )}
                      {visibleColumns.bookingDate && (
                        <TableCell
                          className={cn(
                            "tabular-nums",
                            rtl && "text-right font-arabic"
                          )}
                        >
                          {(() => {
                            const fmt = formatBookingDate(booking.bookingDate);
                            if (!fmt.date) return "";
                            return (
                              <div className="space-y-0.5">
                                <div className="text-sm font-medium">{fmt.dayName}</div>
                                <div className="text-xs text-muted-foreground">{fmt.date}</div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {fmt.time}
                                </div>
                              </div>
                            );
                          })()}
                        </TableCell>
                      )}
                      {visibleColumns.createdAt && (
                        <TableCell
                          className={cn(
                            "tabular-nums text-muted-foreground",
                            rtl && "text-right font-arabic"
                          )}
                        >
                          {(() => {
                            const fmt = formatBookingDate(booking.createdAt);
                            if (!fmt.date) return "";
                            return (
                              <div className="space-y-0.5">
                                <div className="text-sm font-medium">{fmt.date}</div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {fmt.time}
                                </div>
                              </div>
                            );
                          })()}
                        </TableCell>
                      )}
                      {visibleColumns.depositAmount && (
                        <TableCell
                          className={cn(
                            "tabular-nums text-muted-foreground",
                            rtl && "text-right font-arabic"
                          )}
                        >
                          {booking.depositAmount !== undefined && booking.depositAmount !== null ? `${booking.depositAmount} ${rtl ? "ر.س" : "SAR"}` : (rtl ? "لا يوجد" : "None")}
                        </TableCell>
                      )}
                      {visibleColumns.bookingCode && (
                        <TableCell
                          className={cn(
                            "font-mono text-xs text-muted-foreground",
                            rtl && "text-right"
                          )}
                        >
                          {booking.bookingCode || 'N/A'}
                        </TableCell>
                      )}
                      {visibleColumns.bookingStatus && (
                        <TableCell className={rtl ? "text-right" : ""}>
                          {renderStatusBadge(booking.status)}
                        </TableCell>
                      )}
                      <TableCell className={rtl ? "text-right" : ""}>
                        <DropdownMenu dir={rtl ? "rtl" : "ltr"}>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">
                                {t(locale, "actions")}
                              </span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={rtl ? "start" : "end"}>
                            <DropdownMenuLabel className={rtl ? "font-arabic" : ""}>
                              {t(locale, "actions")}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleViewDetails(booking)}
                              className={cn("gap-2", rtl && "font-arabic")}
                            >
                              <Eye className="w-4 h-4" />
                              {t(locale, "bookings.viewDetails")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(booking)}
                              className={cn("gap-2", rtl && "font-arabic")}
                            >
                              <RefreshCw className="w-4 h-4" />
                              {t(locale, "bookings.updateStatus")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleViewChat(booking)}
                              className={cn("gap-2", rtl && "font-arabic")}
                            >
                              <MessageCircle className="w-4 h-4" />
                              {rtl ? "عرض المحادثة" : "View Chat"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditBooking(booking)}
                              className={cn("gap-2", rtl && "font-arabic")}
                            >
                              <Pencil className="w-4 h-4" />
                              {rtl ? "تعديل الحجز" : "Edit Booking"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteBooking(booking)}
                              className={cn(
                                "gap-2 text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer",
                                rtl && "font-arabic"
                              )}
                            >
                              <Trash2 className="w-4 h-4" />
                              {t(locale, "bookings.deleteBooking")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        {/* Pagination Controls */}
        <div
          className={cn(
            "flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t",
            rtl && "flex-row-reverse"
          )}
        >
          <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", rtl && "font-arabic")}>
            <Select value={String(pageSize)} onValueChange={(val) => { setPageSize(Number(val)); setPage(1); }}>
              <SelectTrigger className="w-[70px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>{t(locale, "bookings.showPerPage")}</span>
          </div>

          <div className={cn("flex items-center gap-2", rtl && "flex-row-reverse")}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
              className="h-8 gap-1"
            >
              {rtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <span className={cn("text-xs", rtl && "font-arabic")}>{t(locale, "bookings.previous")}</span>
            </Button>

            <span className={cn("text-sm tabular-nums px-2", rtl && "font-arabic")}>
              {t(locale, "bookings.pageOf")
                .replace("{page}", String(page))
                .replace("{total}", String(totalPages))}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoading}
              className="h-8 gap-1"
            >
              <span className={cn("text-xs", rtl && "font-arabic")}>{t(locale, "bookings.next")}</span>
              {rtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </Card>

      {/* Booking Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent
          className={cn("sm:max-w-lg", rtl && "font-arabic")}
          dir={rtl ? "rtl" : "ltr"}
        >
          <DialogHeader className={cn(rtl && "text-right items-end")}>
            <DialogTitle className={cn(rtl && "font-arabic text-right")}>
              {t(locale, "bookings.viewDetails")}
            </DialogTitle>
            <DialogDescription className={cn(rtl && "font-arabic text-right")}>
              {rtl ? "تفاصيل الحجز" : "Booking details"}
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4 mt-4">
              {/* Booking ID */}
              {/* <div
                className={cn(
                  "flex items-center gap-2 text-sm text-muted-foreground",
                  ""
                )}
              >
                <Hash className="w-4 h-4 shrink-0" />
                <span className="font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap">#{selectedBooking.id}</span>
              </div>

              <Separator /> */}

              {/* Client Info */}
              <div className="space-y-3">
                <div
                  className={cn(
                    "flex items-start gap-3",
                    ""
                  )}
                >
                  <div className="p-2 rounded-lg bg-sage-50 dark:bg-sage-900/20 shrink-0">
                    <CalendarCheck className="w-4 h-4 text-sage-600 dark:text-sage-400" />
                  </div>
                  <div className={cn("min-w-0", rtl && "text-right")}>
                    <p className="font-semibold">
                      {selectedBooking.client?.name || 'Unknown'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedBooking.serviceSummary}
                    </p>
                  </div>
                </div>

                <div
                  className={cn(
                    "flex items-center gap-3",
                    ""
                  )}
                >
                  <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm tabular-nums">
                    {selectedBooking.client?.phone || 'N/A'}
                  </span>
                </div>

                <div
                  className={cn(
                    "flex items-start gap-3",
                    ""
                  )}
                >
                  <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-sm">
                    {selectedBooking.client?.address || 'No address provided'}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Booking Meta */}
              <div className="grid grid-cols-2 gap-3">
                <div className={cn(rtl && "text-right")}>
                  <p
                    className={cn(
                      "text-xs text-muted-foreground mb-1",
                      rtl && "font-arabic"
                    )}
                  >
                    {t(locale, "bookings.bookingDate")}
                  </p>
                  {(() => {
                    const fmt = formatBookingDate(selectedBooking.bookingDate || selectedBooking.createdAt);
                    return (
                      <div className="space-y-0.5">
                        <p className={cn("text-sm font-semibold", rtl && "font-arabic")}>{fmt.dayName}</p>
                        <p className="text-sm font-medium tabular-nums">{fmt.date}</p>
                      </div>
                    );
                  })()}
                </div>
                <div className={cn(rtl && "text-right")}>
                  <p
                    className={cn(
                      "text-xs text-muted-foreground mb-1",
                      rtl && "font-arabic"
                    )}
                  >
                    {t(locale, "bookings.bookingTime")}
                  </p>
                  <div className="flex items-center gap-1.5 text-sm font-medium tabular-nums">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    {formatBookingDate(selectedBooking.bookingDate || selectedBooking.createdAt).time}
                  </div>
                </div>
                <div className={cn(rtl && "text-right")}>
                  <p
                    className={cn(
                      "text-xs text-muted-foreground mb-1",
                      rtl && "font-arabic"
                    )}
                  >
                    {t(locale, "bookings.channelSource")}
                  </p>
                  <div className={cn(rtl && "flex")}>
                    {renderChannelBadge(selectedBooking.channelType)}
                  </div>
                </div>
                <div className={cn(rtl && "text-right")}>
                  <p
                    className={cn(
                      "text-xs text-muted-foreground mb-1",
                      rtl && "font-arabic"
                    )}
                  >
                    {t(locale, "bookings.bookingStatus")}
                  </p>
                  <div className={cn(rtl && "flex")}>
                    {renderStatusBadge(selectedBooking.status)}
                  </div>
                </div>
                {selectedBooking.createdAt && (
                  <div className={cn(rtl && "text-right")}>
                    <p
                      className={cn(
                        "text-xs text-muted-foreground mb-1",
                        rtl && "font-arabic"
                      )}
                    >
                      {t(locale, "bookings.createdAt")}
                    </p>
                    {(() => {
                      const fmt = formatBookingDate(selectedBooking.createdAt);
                      return (
                        <p className="text-sm tabular-nums text-muted-foreground">
                          {fmt.date} - {fmt.time}
                        </p>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter
            className={cn("")}
          >
            <Button
              variant="outline"
              onClick={() => setDetailDialogOpen(false)}
              className={rtl ? "font-arabic" : ""}
            >
              {t(locale, "close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog
        open={updateStatusDialogOpen}
        onOpenChange={setUpdateStatusDialogOpen}
      >
        <DialogContent
          className={cn("sm:max-w-md", rtl && "font-arabic")}
          dir={rtl ? "rtl" : "ltr"}
        >
          <DialogHeader className={cn(rtl && "text-right items-end")}>
            <DialogTitle className={cn(rtl && "font-arabic text-right")}>
              {t(locale, "bookings.updateStatus")}
            </DialogTitle>
            <DialogDescription className={cn(rtl && "font-arabic text-right")}>
              {selectedBooking
                ? rtl
                  ? `تحديث حالة الحجز #${selectedBooking.id}`
                  : `Update status for booking #${selectedBooking.id}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              {/* Current Status */}
              <div
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg bg-muted/50",
                  ""
                )}
              >
                <span
                  className={cn(
                    "text-sm text-muted-foreground",
                    rtl && "font-arabic"
                  )}
                >
                  {rtl ? "الحالة الحالية:" : "Current status:"}
                </span>
                {renderStatusBadge(selectedBooking.status)}
              </div>

              {/* New Status Select */}
              <div className="space-y-2">
                <label
                  className={cn(
                    "text-sm font-medium",
                    rtl && "font-arabic text-right block"
                  )}
                >
                  {rtl ? "الحالة الجديدة" : "New Status"}
                </label>
                <Select
                  value={newStatus}
                  onValueChange={(val) => setNewStatus(val as BookingStatus)}
                >
                  <SelectTrigger
                    className={cn("w-full", rtl && "font-arabic")}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending" className={rtl ? "font-arabic" : ""}>
                      {t(locale, "pending")}
                    </SelectItem>
                    <SelectItem value="confirmed" className={rtl ? "font-arabic" : ""}>
                      {t(locale, "confirmed")}
                    </SelectItem>
                    <SelectItem value="cancelled" className={rtl ? "font-arabic" : ""}>
                      {t(locale, "cancelled")}
                    </SelectItem>
                    <SelectItem value="completed" className={rtl ? "font-arabic" : ""}>
                      {t(locale, "completed")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Preview */}
              <div
                className={cn(
                  "flex items-center gap-3",
                  ""
                )}
              >
                <span
                  className={cn(
                    "text-sm text-muted-foreground",
                    rtl && "font-arabic"
                  )}
                >
                  {rtl ? "بعد التحديث:" : "After update:"}
                </span>
                {renderStatusBadge(newStatus)}
              </div>
            </div>
          )}
          <DialogFooter
            className={cn("")}
          >
            <Button
              variant="outline"
              onClick={() => setUpdateStatusDialogOpen(false)}
              className={rtl ? "font-arabic" : ""}
            >
              {t(locale, "cancel")}
            </Button>
            <Button onClick={confirmStatusUpdate} className={rtl ? "font-arabic" : ""}>
              {t(locale, "confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Booking Dialog */}
      <Dialog open={manualDialogOpen} onOpenChange={(open) => {
        setMbError(null);
        setManualDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-[500px]" dir={rtl ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className={cn(rtl && "font-arabic text-right")}>
              {t(locale, "bookings.manualBooking")}
            </DialogTitle>
            <DialogDescription className={cn(rtl && "font-arabic text-right")}>
              {t(locale, "bookings.manualBookingDesc")}
            </DialogDescription>
          </DialogHeader>
          
          {mbError && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className={cn(rtl && "font-arabic text-right")}>
                {mbError}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={cn(rtl && "font-arabic")}>{t(locale, "name")}</Label>
                <Input value={mbClientName} onChange={(e) => setMbClientName(e.target.value)} className={cn(rtl && "text-right font-arabic")} />
              </div>
              <div className="space-y-2">
                <Label className={cn(rtl && "font-arabic")}>{t(locale, "phone")}</Label>
                <Input value={mbClientPhone} onChange={(e) => setMbClientPhone(e.target.value)} dir="ltr" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className={cn(rtl && "font-arabic")}>{t(locale, "bookings.selectService")}</Label>
              <Select value={mbServiceId} onValueChange={setMbServiceId}>
                <SelectTrigger className={cn(rtl && "font-arabic")}><SelectValue placeholder={t(locale, "bookings.selectService")} /></SelectTrigger>
                <SelectContent>{serviceList.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={cn(rtl && "font-arabic")}>{t(locale, "bookings.selectStaff")}</Label>
                <Select value={mbStaffId} onValueChange={setMbStaffId}>
                  <SelectTrigger className={cn(rtl && "font-arabic")}><SelectValue placeholder={t(locale, "bookings.selectStaff")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{rtl ? "بدون عاملة" : "No staff"}</SelectItem>
                    {staffList.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className={cn(rtl && "font-arabic")}>{t(locale, "bookings.selectBranch")}</Label>
                <Select value={mbBranchId} onValueChange={setMbBranchId}>
                  <SelectTrigger className={cn(rtl && "font-arabic")}><SelectValue placeholder={t(locale, "bookings.selectBranch")} /></SelectTrigger>
                  <SelectContent>{branchList.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={cn(rtl && "font-arabic")}>{t(locale, "date")}</Label>
                <Input type="date" value={mbDate} onChange={(e) => setMbDate(e.target.value)} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label className={cn(rtl && "font-arabic")}>{t(locale, "bookings.bookingTime")}</Label>
                <Input type="time" value={mbTime} onChange={(e) => setMbTime(e.target.value)} dir="ltr" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={cn(rtl && "font-arabic")}>{t(locale, "bookings.selectLocation")}</Label>
                <Select value={mbLocation} onValueChange={setMbLocation}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salon">{t(locale, "bookings.salon")}</SelectItem>
                    <SelectItem value="home">{t(locale, "bookings.home")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className={cn(rtl && "font-arabic")}>{t(locale, "bookings.paymentCash")}</Label>
                <Input value={rtl ? "كاش" : "Cash"} disabled className="bg-muted" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className={cn(rtl && "font-arabic")}>{t(locale, "notes")}</Label>
              <Input value={mbNotes} onChange={(e) => setMbNotes(e.target.value)} className={cn(rtl && "text-right font-arabic")} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualDialogOpen(false)} className={cn(rtl && "font-arabic")}>{t(locale, "cancel")}</Button>
            <Button onClick={handleManualBookingSave} disabled={manualSaving || !mbClientName || !mbClientPhone || !mbServiceId || !mbDate}>
              {manualSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              <span className={cn(rtl && "font-arabic")}>{t(locale, "save")}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Booking Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEbError(null);
        setEditDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-[500px]" dir={rtl ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className={cn(rtl && "font-arabic text-right")}>
              {rtl ? "تعديل الحجز" : "Edit Booking"}
            </DialogTitle>
            <DialogDescription className={cn(rtl && "font-arabic text-right")}>
              {rtl ? "تعديل تفاصيل هذا الحجز" : "Modify the details of this booking"}
            </DialogDescription>
          </DialogHeader>
          
          {ebError && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className={cn(rtl && "font-arabic text-right")}>
                {ebError}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={cn(rtl && "font-arabic")}>{t(locale, "name")}</Label>
                <Input value={ebClientName} onChange={(e) => setEbClientName(e.target.value)} className={cn(rtl && "text-right font-arabic")} />
              </div>
              <div className="space-y-2">
                <Label className={cn(rtl && "font-arabic")}>{t(locale, "phone")}</Label>
                <Input value={ebClientPhone} onChange={(e) => setEbClientPhone(e.target.value)} dir="ltr" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={cn(rtl && "font-arabic")}>{t(locale, "bookings.selectService")}</Label>
                <Select value={ebServiceId} onValueChange={setEbServiceId}>
                  <SelectTrigger className={cn(rtl && "font-arabic")}><SelectValue placeholder={t(locale, "bookings.selectService")} /></SelectTrigger>
                  <SelectContent>{serviceList.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className={cn(rtl && "font-arabic")}>{t(locale, "bookings.bookingStatus")}</Label>
                <Select value={ebStatus} onValueChange={(val: BookingStatus) => setEbStatus(val)}>
                  <SelectTrigger className={cn(rtl && "font-arabic")}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">{rtl ? "معلق" : "Pending"}</SelectItem>
                    <SelectItem value="confirmed">{rtl ? "مؤكد" : "Confirmed"}</SelectItem>
                    <SelectItem value="cancelled">{rtl ? "ملغي" : "Cancelled"}</SelectItem>
                    <SelectItem value="completed">{rtl ? "مكتمل" : "Completed"}</SelectItem>
                    <SelectItem value="waiting_payment">{rtl ? "في انتظار الدفع" : "Waiting Payment"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={cn(rtl && "font-arabic")}>{t(locale, "bookings.selectStaff")}</Label>
                <Select value={ebStaffId} onValueChange={setEbStaffId}>
                  <SelectTrigger className={cn(rtl && "font-arabic")}><SelectValue placeholder={t(locale, "bookings.selectStaff")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{rtl ? "بدون عاملة" : "No staff"}</SelectItem>
                    {staffList.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className={cn(rtl && "font-arabic")}>{t(locale, "bookings.selectBranch")}</Label>
                <Select value={ebBranchId} onValueChange={setEbBranchId}>
                  <SelectTrigger className={cn(rtl && "font-arabic")}><SelectValue placeholder={t(locale, "bookings.selectBranch")} /></SelectTrigger>
                  <SelectContent>{branchList.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={cn(rtl && "font-arabic")}>{t(locale, "date")}</Label>
                <Input type="date" value={ebDate} onChange={(e) => setEbDate(e.target.value)} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label className={cn(rtl && "font-arabic")}>{t(locale, "bookings.bookingTime")}</Label>
                <Input type="time" value={ebTime} onChange={(e) => setEbTime(e.target.value)} dir="ltr" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={cn(rtl && "font-arabic")}>{t(locale, "bookings.selectLocation")}</Label>
                <Select value={ebLocation} onValueChange={setEbLocation}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salon">{t(locale, "bookings.salon")}</SelectItem>
                    <SelectItem value="home">{t(locale, "bookings.home")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className={cn(rtl && "font-arabic")}>{t(locale, "notes")}</Label>
                <Input value={ebNotes} onChange={(e) => setEbNotes(e.target.value)} className={cn(rtl && "text-right font-arabic")} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className={cn(rtl && "font-arabic")}>{t(locale, "cancel")}</Button>
            <Button onClick={handleEditBookingSave} disabled={editSaving || !ebClientName || !ebClientPhone || !ebServiceId || !ebDate}>
              {editSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              <span className={cn(rtl && "font-arabic")}>{t(locale, "save")}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Booking Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir={rtl ? "rtl" : "ltr"} className={cn(rtl && "font-arabic")}>
          <AlertDialogHeader className={cn(rtl && "text-right items-end")}>
            <AlertDialogTitle className={cn(rtl && "text-right")}>
              {t(locale, "bookings.deleteBooking")}
            </AlertDialogTitle>
            <AlertDialogDescription className={cn(rtl && "text-right")}>
              {t(locale, "bookings.deleteBookingConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={cn(rtl && "sm:flex-row-reverse sm:justify-start gap-2")}>
            <AlertDialogCancel disabled={deleteSaving} className={cn(rtl && "font-arabic")}>
              {t(locale, "cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault(); // Prevents Radix from closing automatically until request succeeds
                handleDeleteConfirm();
              }}
              disabled={deleteSaving}
              className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700"
            >
              {deleteSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {rtl ? "جاري الحذف..." : "Deleting..."}
                </>
              ) : (
                t(locale, "delete")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
