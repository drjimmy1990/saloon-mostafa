"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { t, isRTL } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { getSaudiToday, addDaysToDateString } from "@/lib/booking-notice";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  Search,
  RefreshCw,
  UserCog,
  ChevronLeft,
  ChevronRight,
  Phone,
  Scissors,
  MapPin,
  Globe,
  MessageCircle,
  Loader2,
  CalendarCheck,
  Filter,
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
import { Separator } from "@/components/ui/separator";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScheduleBooking {
  id: string;
  client_id: string;
  client?: {
    id: string;
    name: string;
    phone: string;
    address?: string;
  };
  staff?: {
    id: string;
    name: string;
  } | null;
  branchId?: string;
  branch?: {
    id: string;
    name: string;
    nameAr?: string;
  } | null;
  serviceSummary: string;
  channelType: string;
  bookingDate: string;
  bookingTime?: string;
  status: string;
  location?: string;
  notes?: string;
  createdAt?: string;
  slotNumber?: number;
}

interface Branch {
  id: string;
  name: string;
  nameAr?: string;
}

interface StaffMember {
  id: string;
  name: string;
}

// ─── Channel Config ───────────────────────────────────────────────────────────

const channelIcons: Record<string, { icon: typeof MessageCircle; color: string; label: string; labelAr: string }> = {
  whatsapp: { icon: MessageCircle, color: "text-emerald-600 dark:text-emerald-400", label: "WhatsApp", labelAr: "واتساب" },
  facebook: { icon: MessageCircle, color: "text-blue-600 dark:text-blue-400", label: "Facebook", labelAr: "ماسنجر" },
  instagram: { icon: MessageCircle, color: "text-pink-600 dark:text-pink-400", label: "Instagram", labelAr: "انستجرام" },
  website: { icon: Globe, color: "text-violet-600 dark:text-violet-400", label: "Website", labelAr: "الموقع" },
  manual: { icon: CalendarCheck, color: "text-amber-600 dark:text-amber-400", label: "Manual", labelAr: "يدوي" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract comparable minute-of-day (0 - 1439) from a booking,
 * prioritizing bookingTime or the UTC time portion of bookingDate.
 */
function getBookingComparableMinutes(b: ScheduleBooking): number {
  if (b.bookingTime) {
    const parts = b.bookingTime.split(":");
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1] || "0", 10);
    if (!isNaN(h) && !isNaN(m)) {
      return h * 60 + m;
    }
  }
  if (b.bookingDate) {
    const d = new Date(b.bookingDate);
    if (!isNaN(d.getTime())) {
      return d.getUTCHours() * 60 + d.getUTCMinutes();
    }
  }
  return 9999;
}

/**
 * Format a booking's time consistently across manual, website, and bot bookings.
 * Converts to a UTC date object and uses Intl.DateTimeFormat (via toLocaleTimeString)
 * so that all bookings share the exact same locale, numeral system, and AM/PM symbols.
 */
function formatScheduleTime(b: ScheduleBooking, rtl: boolean): string {
  let hours: number | null = null;
  let minutes: number | null = null;

  if (b.bookingTime) {
    const parts = b.bookingTime.split(":");
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1] || "0", 10);
    if (!isNaN(h) && !isNaN(m)) {
      hours = h;
      minutes = m;
    }
  }

  if (hours === null && b.bookingDate) {
    const d = new Date(b.bookingDate);
    if (!isNaN(d.getTime())) {
      hours = d.getUTCHours();
      minutes = d.getUTCMinutes();
    }
  }

  if (hours === null || minutes === null) {
    return rtl ? "بدون وقت" : "No time";
  }

  const d = new Date(Date.UTC(2026, 0, 1, hours, minutes, 0));
  return d.toLocaleTimeString(rtl ? "ar-SA" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ScheduleSection() {
  const { locale } = useAppStore();
  const rtl = isRTL(locale);

  // State
  const [bookings, setBookings] = useState<ScheduleBooking[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [branchList, setBranchList] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [staffFilter, setStaffFilter] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>(() => getSaudiToday());

  // Fetch staff list and branches
  useEffect(() => {
    fetch("/api/staff")
      .then((r) => r.json())
      .then((data) => setStaffList(Array.isArray(data) ? data : []))
      .catch(console.error);

    fetch("/api/branches")
      .then((r) => r.json())
      .then((data) => setBranchList(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  // Fetch bookings for selected date
  const fetchSchedule = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: "1",
        limit: "100",
        search: "",
        channel: "all",
        status: "confirmed",
        staff: staffFilter,
        branch: branchFilter,
        dateFrom: selectedDate,
        dateTo: selectedDate,
      });
      const res = await fetch(`/api/bookings?${params}`);
      const json = await res.json();
      setBookings(json.data || []);
    } catch (err) {
      console.error("Failed to fetch schedule", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, staffFilter, branchFilter]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  // Date navigation
  const goToPrevDay = () => {
    setSelectedDate((prev) => addDaysToDateString(prev, -1));
  };

  const goToNextDay = () => {
    setSelectedDate((prev) => addDaysToDateString(prev, 1));
  };

  const goToToday = () => {
    setSelectedDate(getSaudiToday());
  };

  const isToday = selectedDate === getSaudiToday();

  // Format the selected date for display without timezone shifting
  const displayDate = useMemo(() => {
    if (!selectedDate || !selectedDate.includes("-")) {
      return { dayName: "", dateStr: "" };
    }
    const [y, m, d] = selectedDate.split("-").map(Number);
    // Setting 12:00:00 UTC guarantees zero day-shift regardless of browser local timezone
    const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const dayName = dateObj.toLocaleDateString(rtl ? "ar-SA" : "en-US", {
      weekday: "long",
      timeZone: "UTC",
    });
    const dateStr = dateObj.toLocaleDateString(rtl ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
    return { dayName, dateStr };
  }, [selectedDate, rtl]);

  // Group bookings by staff
  const groupedByStaff = useMemo(() => {
    const groups: Record<string, { staffName: string; bookings: ScheduleBooking[] }> = {};
    const unassigned: ScheduleBooking[] = [];

    bookings.forEach((b) => {
      if (b.staff?.id) {
        if (!groups[b.staff.id]) {
          groups[b.staff.id] = { staffName: b.staff.name, bookings: [] };
        }
        groups[b.staff.id].bookings.push(b);
      } else {
        unassigned.push(b);
      }
    });

    // Sort each group chronologically by appointment time
    Object.values(groups).forEach((g) => {
      g.bookings.sort((a, b) => getBookingComparableMinutes(a) - getBookingComparableMinutes(b));
    });

    unassigned.sort((a, b) => getBookingComparableMinutes(a) - getBookingComparableMinutes(b));

    return { groups, unassigned };
  }, [bookings]);

  const getChannelInfo = (ch: string) => {
    return channelIcons[ch] || channelIcons.manual;
  };

  return (
    <div className="space-y-6" dir={rtl ? "rtl" : "ltr"}>
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2
            className={cn(
              "text-2xl font-bold tracking-tight",
              rtl && "font-arabic text-right"
            )}
          >
            {t(locale, "schedule.title")}
          </h2>
          <p
            className={cn(
              "text-muted-foreground text-sm",
              rtl && "font-arabic text-right"
            )}
          >
            {t(locale, "schedule.subtitle")}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => fetchSchedule()}
          disabled={isLoading}
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          <span className={cn(rtl && "font-arabic")}>{t(locale, "schedule.refresh")}</span>
        </Button>
      </div>

      {/* ─── Date Navigation & Staff Filter ────────────────────────────── */}
      <Card className="py-0">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Date navigation */}
            <div className="flex items-center gap-2 flex-1">
              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={goToPrevDay}>
                {rtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </Button>

              <div className="flex items-center gap-2 flex-1 justify-center">
                <CalendarDays className="w-5 h-5 text-primary shrink-0" />
                <div className={cn("text-center", rtl && "font-arabic")}>
                  <p className="text-lg font-bold leading-tight">{displayDate.dayName}</p>
                  <p className="text-sm text-muted-foreground">{displayDate.dateStr}</p>
                </div>
              </div>

              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={goToNextDay}>
                {rtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </Button>

              {!isToday && (
                <Button variant="secondary" size="sm" className={cn("gap-1 shrink-0", rtl && "font-arabic")} onClick={goToToday}>
                  {t(locale, "schedule.today")}
                </Button>
              )}
            </div>

            <Separator orientation="vertical" className="hidden sm:block h-10" />

            {/* Date picker */}
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full sm:w-[160px] text-sm"
            />

            <Separator orientation="vertical" className="hidden sm:block h-10" />

            {/* Branch filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger className={cn("w-full sm:w-[170px]", rtl && "font-arabic")}>
                  <SelectValue placeholder={t(locale, "schedule.allBranches")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className={rtl ? "font-arabic" : ""}>
                    {t(locale, "schedule.allBranches")}
                  </SelectItem>
                  {branchList.map((b) => (
                    <SelectItem key={b.id} value={b.id} className={rtl ? "font-arabic" : ""}>
                      {rtl ? (b.nameAr || b.name) : b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator orientation="vertical" className="hidden sm:block h-10" />

            {/* Staff filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
              <Select value={staffFilter} onValueChange={setStaffFilter}>
                <SelectTrigger className={cn("w-full sm:w-[170px]", rtl && "font-arabic")}>
                  <SelectValue placeholder={t(locale, "schedule.allStaff")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className={rtl ? "font-arabic" : ""}>
                    {t(locale, "schedule.allStaff")}
                  </SelectItem>
                  {staffList.map((s) => (
                    <SelectItem key={s.id} value={s.id} className={rtl ? "font-arabic" : ""}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Summary Stats ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Confirmed */}
        <Card className="border-primary/20 bg-primary/5 py-0">
          <CardContent className="p-4">
            <div className={cn("flex items-center gap-3")}>
              <div className="p-2 rounded-xl bg-primary/10 shrink-0">
                <CalendarCheck className="w-5 h-5 text-primary" />
              </div>
              <div className={cn("min-w-0", rtl && "text-right")}>
                <p className={cn("text-xs font-medium text-muted-foreground", rtl && "font-arabic")}>
                  {t(locale, "schedule.totalConfirmed")}
                </p>
                <p className="text-2xl font-bold tabular-nums">
                  {isLoading ? "..." : bookings.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Staff count */}
        <Card className="border-violet-200 dark:border-violet-800/40 bg-violet-50 dark:bg-violet-900/20 py-0">
          <CardContent className="p-4">
            <div className={cn("flex items-center gap-3")}>
              <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-800/30 shrink-0">
                <UserCog className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div className={cn("min-w-0", rtl && "text-right")}>
                <p className={cn("text-xs font-medium text-muted-foreground", rtl && "font-arabic")}>
                  {t(locale, "schedule.staffWorking")}
                </p>
                <p className="text-2xl font-bold tabular-nums">
                  {isLoading ? "..." : Object.keys(groupedByStaff.groups).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Unassigned */}
        <Card className="border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/20 py-0">
          <CardContent className="p-4">
            <div className={cn("flex items-center gap-3")}>
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-800/30 shrink-0">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className={cn("min-w-0", rtl && "text-right")}>
                <p className={cn("text-xs font-medium text-muted-foreground", rtl && "font-arabic")}>
                  {t(locale, "schedule.unassigned")}
                </p>
                <p className="text-2xl font-bold tabular-nums">
                  {isLoading ? "..." : groupedByStaff.unassigned.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Day indicator */}
        <Card className={cn(
          "py-0",
          isToday
            ? "border-sage-200 dark:border-sage-800/40 bg-sage-50 dark:bg-sage-900/20"
            : "border-slate-200 dark:border-slate-800/40 bg-slate-50 dark:bg-slate-900/20"
        )}>
          <CardContent className="p-4">
            <div className={cn("flex items-center gap-3")}>
              <div className={cn(
                "p-2 rounded-xl shrink-0",
                isToday ? "bg-sage-100 dark:bg-sage-800/30" : "bg-slate-100 dark:bg-slate-800/30"
              )}>
                <CalendarDays className={cn(
                  "w-5 h-5",
                  isToday ? "text-sage-600 dark:text-sage-400" : "text-slate-600 dark:text-slate-400"
                )} />
              </div>
              <div className={cn("min-w-0", rtl && "text-right")}>
                <p className={cn("text-xs font-medium text-muted-foreground", rtl && "font-arabic")}>
                  {isToday ? t(locale, "schedule.today") : t(locale, "schedule.selectedDay")}
                </p>
                <p className={cn("text-lg font-bold", rtl && "font-arabic")}>{displayDate.dayName}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Loading State ─────────────────────────────────────────────── */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* ─── Empty State ───────────────────────────────────────────────── */}
      {!isLoading && bookings.length === 0 && (
        <Card className="py-0">
          <CardContent className="p-12 text-center">
            <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className={cn("text-lg font-medium text-muted-foreground", rtl && "font-arabic")}>
              {t(locale, "schedule.noBookings")}
            </p>
            <p className={cn("text-sm text-muted-foreground/60 mt-1", rtl && "font-arabic")}>
              {t(locale, "schedule.noBookingsHint")}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ─── Bookings by Staff ─────────────────────────────────────────── */}
      {!isLoading && bookings.length > 0 && (
        <div className="space-y-4">
          {/* Staff groups */}
          {Object.entries(groupedByStaff.groups)
            .sort(([, a], [, b]) => a.staffName.localeCompare(b.staffName))
            .map(([staffId, group]) => (
              <Card key={staffId} className="py-0 overflow-hidden">
                <CardHeader className="pb-3 pt-4 px-5 bg-gradient-to-r from-primary/5 to-transparent">
                  <div className={cn("flex items-center gap-3", rtl && "flex-row")}>
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 shrink-0">
                      <UserCog className="w-5 h-5 text-primary" />
                    </div>
                    <div className={cn("flex-1", rtl && "text-right")}>
                      <CardTitle className={cn("text-base", rtl && "font-arabic")}>{group.staffName}</CardTitle>
                      <p className={cn("text-xs text-muted-foreground", rtl && "font-arabic")}>
                        {group.bookings.length} {t(locale, group.bookings.length === 1 ? "schedule.booking" : "schedule.bookings")}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {group.bookings.map((booking) => (
                      <BookingCard key={booking.id} booking={booking} rtl={rtl} locale={locale} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

          {/* Unassigned */}
          {groupedByStaff.unassigned.length > 0 && (
            <Card className="py-0 overflow-hidden">
              <CardHeader className="pb-3 pt-4 px-5 bg-gradient-to-r from-amber-500/10 to-transparent">
                <div className={cn("flex items-center gap-3", rtl && "flex-row")}>
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-800/30 shrink-0">
                    <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className={cn("flex-1", rtl && "text-right")}>
                    <CardTitle className={cn("text-base", rtl && "font-arabic")}>
                      {t(locale, "schedule.unassignedStaff")}
                    </CardTitle>
                    <p className={cn("text-xs text-muted-foreground", rtl && "font-arabic")}>
                      {groupedByStaff.unassigned.length} {t(locale, groupedByStaff.unassigned.length === 1 ? "schedule.booking" : "schedule.bookings")}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {groupedByStaff.unassigned.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} rtl={rtl} locale={locale} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Booking Card ─────────────────────────────────────────────────────────────

function BookingCard({
  booking,
  rtl,
  locale,
}: {
  booking: ScheduleBooking;
  rtl: boolean;
  locale: "ar" | "en";
}) {
  const channelInfo = channelIcons[booking.channelType] || channelIcons.manual;
  const ChannelIcon = channelInfo.icon;

  return (
    <div className={cn(
      "flex items-center gap-4 p-4 hover:bg-accent/30 transition-colors",
      rtl && "flex-row"
    )}>
      {/* Time */}
      <div className="flex flex-col items-center justify-center w-20 shrink-0">
        <div className="flex items-center gap-1 text-primary">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-sm font-bold tabular-nums">{formatScheduleTime(booking, rtl)}</span>
        </div>
        {booking.slotNumber && (
          <span className="text-[10px] text-muted-foreground mt-0.5">
            #{booking.slotNumber}
          </span>
        )}
      </div>

      <Separator orientation="vertical" className="h-10 shrink-0" />

      {/* Client info */}
      <div className={cn("flex-1 min-w-0", rtl && "text-right")}>
        <p className={cn("font-medium text-sm truncate", rtl && "font-arabic")}>
          {booking.client?.name || (rtl ? "عميل غير معروف" : "Unknown Client")}
        </p>
        <div className={cn("flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap", rtl && "flex-row-reverse justify-end")}>
          {booking.client?.phone && (
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              <span dir="ltr">{booking.client.phone}</span>
            </span>
          )}
        </div>
      </div>

      {/* Service */}
      <div className={cn("hidden sm:flex items-center gap-1.5 shrink-0", rtl && "flex-row-reverse")}>
        <Scissors className="w-3.5 h-3.5 text-muted-foreground" />
        <span className={cn("text-xs text-muted-foreground max-w-[150px] truncate", rtl && "font-arabic")}>
          {booking.serviceSummary || "—"}
        </span>
      </div>

      {/* Branch badge */}
      {(booking.branch?.name || booking.branch?.nameAr) && (
        <Badge
          variant="outline"
          className={cn(
            "hidden md:flex items-center gap-1 text-[10px] font-normal shrink-0 bg-slate-50 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800",
            rtl && "font-arabic"
          )}
        >
          <MapPin className="w-3 h-3 text-primary shrink-0" />
          <span>{rtl ? (booking.branch.nameAr || booking.branch.name) : booking.branch.name}</span>
        </Badge>
      )}

      {/* Channel badge */}
      <Badge
        variant="outline"
        className={cn(
          "gap-1 text-[10px] font-medium shrink-0",
          channelInfo.color
        )}
      >
        <ChannelIcon className="w-3 h-3" />
        {rtl ? channelInfo.labelAr : channelInfo.label}
      </Badge>

      {/* Status */}
      <Badge
        variant="outline"
        className="gap-1 text-[10px] font-medium bg-sage-50 dark:bg-sage-900/20 text-sage-700 dark:text-sage-400 border-sage-200 dark:border-sage-800/40 shrink-0"
      >
        <CheckCircle2 className="w-3 h-3" />
        {rtl ? "مؤكد" : "Confirmed"}
      </Badge>
    </div>
  );
}
