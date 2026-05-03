"use client";

import React from "react";
import { useAppStore } from "@/lib/store";
import { t, isRTL } from "@/lib/i18n";
import {
  LayoutDashboard,
  Radio,
  Scissors,
  Package,
  CalendarCheck,
  Users,
  MessageSquare,
  ShieldBan,
  Bot,
  Globe,
  Moon,
  Sun,
  Menu,
  X,
  Settings,
  LogOut,
  UserCog,
  Percent,
  Image,
  ClipboardList,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { logout } from "@/app/login/actions";

const navItems: { id: string; path: string; icon: React.ElementType; labelKey: string; adminOnly?: boolean }[] = [
  { id: "dashboard", path: "/", icon: LayoutDashboard, labelKey: "nav.dashboard" },
  { id: "channels", path: "/channels", icon: Radio, labelKey: "nav.channels" },
  { id: "services", path: "/services", icon: Scissors, labelKey: "nav.services" },
  { id: "products", path: "/products", icon: Package, labelKey: "nav.products" },
  { id: "offers", path: "/offers", icon: Percent, labelKey: "nav.offers" },
  { id: "bookings", path: "/bookings", icon: CalendarCheck, labelKey: "nav.bookings" },
  { id: "orders", path: "/orders", icon: ClipboardList, labelKey: "nav.orders" },
  { id: "clients", path: "/clients", icon: Users, labelKey: "nav.clients" },
  { id: "staff", path: "/staff", icon: UserCog, labelKey: "nav.staff" },
  { id: "chat", path: "/chat", icon: MessageSquare, labelKey: "nav.chat" },
  { id: "gallery", path: "/gallery", icon: Image, labelKey: "nav.gallery" },
  { id: "pages", path: "/pages", icon: FileText, labelKey: "nav.pages", adminOnly: true },
  { id: "blacklist", path: "/blacklist", icon: ShieldBan, labelKey: "nav.blacklist" },
  { id: "settings", path: "/settings", icon: Settings, labelKey: "nav.settings", adminOnly: true },
];

export function AppSidebar() {
  const { locale, setLocale, userRole, userPermissions } = useAppStore();
  const rtl = isRTL(locale);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  const themeLabel =
    theme === "dark"
      ? rtl ? "الوضع الفاتح" : "Light Mode"
      : rtl ? "الوضع الداكن" : "Dark Mode";

  const langLabel = locale === "ar" ? "English" : "العربية";

  return (
    <aside
      dir={rtl ? "rtl" : "ltr"}
      className={cn(
        "flex flex-col h-full bg-card",
        rtl ? "border-l" : "border-r",
        "border-border w-64 shrink-0"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground shrink-0">
          <Bot className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className={cn("text-sm font-bold truncate", rtl && "font-arabic")}>
            {t(locale, "appTitle")}
          </h1>
          <p className="text-[10px] text-muted-foreground truncate">
            Sallon
          </p>
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <ScrollArea className="flex-1 py-3" dir={rtl ? "rtl" : "ltr"}>
        <nav className="px-3 space-y-1" dir={rtl ? "rtl" : "ltr"}>
          {navItems.filter(item => {
            if (item.adminOnly && userRole === 'team') return false;
            if (userRole === 'team' && item.id !== 'dashboard' && userPermissions.length > 0) {
              return userPermissions.includes(item.id);
            }
            return true;
          }).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path));
            return (
              <Link
                key={item.id}
                href={item.path}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className={cn("truncate", rtl && "font-arabic")}>
                  {t(locale, item.labelKey)}
                </span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />

      {/* Footer controls */}
      <div className="p-3 space-y-2">
        {/* <Button
          variant="ghost"
          size="sm"
          className="w-full flex items-center justify-start gap-3 px-3"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
          <span className={cn("text-xs", rtl && "font-arabic")}>
            {themeLabel}
          </span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="w-full flex items-center justify-start gap-3 px-3"
          onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
        >
          <Globe className="w-4 h-4 shrink-0" />
          <span className="text-xs">
            {langLabel}
          </span>
        </Button> */}
        {/* Logout */}
        <Button
          variant="ghost"
          className={cn(
            "w-full flex items-center justify-start gap-3 px-3 h-10 text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
            rtl && "font-arabic"
          )}
          onClick={() => logout()}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {rtl ? "تسجيل الخروج" : "Logout"}
        </Button>
      </div>
    </aside>
  );
}

export function MobileSidebar() {
  const { locale, setLocale, sidebarOpen, setSidebarOpen, userRole, userPermissions } = useAppStore();
  const rtl = isRTL(locale);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  if (!sidebarOpen) return null;

  const themeLabel =
    theme === "dark"
      ? rtl ? "الوضع الفاتح" : "Light Mode"
      : rtl ? "الوضع الداكن" : "Dark Mode";

  const langLabel = locale === "ar" ? "English" : "العربية";

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => setSidebarOpen(false)}
      />
      <aside
        dir={rtl ? "rtl" : "ltr"}
        className={cn(
          "fixed top-0 z-50 h-full w-64 bg-card shadow-xl transition-transform duration-300",
          rtl ? "right-0" : "left-0"
        )}
      >
        <div className="flex items-center gap-3 px-4 py-5">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className={cn("text-sm font-bold truncate", rtl && "font-arabic")}>
              {t(locale, "appTitle")}
            </h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 w-8 h-8"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <Separator />

        <ScrollArea className="py-3" style={{ height: "calc(100% - 180px)" }}>
          <nav className="px-3 space-y-1">
            {navItems.filter(item => {
              if (item.adminOnly && userRole === 'team') return false;
              if (userRole === 'team' && item.id !== 'dashboard' && userPermissions.length > 0) {
                return userPermissions.includes(item.id);
              }
              return true;
            }).map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path));
              return (
                <Link
                  key={item.id}
                  href={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className={cn("truncate", rtl && "font-arabic")}>
                    {t(locale, item.labelKey)}
                  </span>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border space-y-2">
          {/* <Button
            variant="ghost"
            size="sm"
            className="w-full flex items-center gap-3 px-3"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
            <span className={cn("text-xs", rtl && "font-arabic")}>
              {themeLabel}
            </span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full flex items-center gap-3 px-3"
            onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
          >
            <Globe className="w-4 h-4 shrink-0" />
            <span className="text-xs">
              {langLabel}
            </span>
          </Button> */}
          <Button
            variant="ghost"
            size="sm"
            className={cn("w-full flex items-center gap-3 px-3 text-destructive", rtl && "font-arabic")}
            onClick={() => {
              setSidebarOpen(false);
              logout();
            }}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="text-xs">
              {rtl ? "تسجيل الخروج" : "Logout"}
            </span>
          </Button>
        </div>
      </aside>
    </>
  );
}

export function MobileHeader() {
  const { locale, setSidebarOpen } = useAppStore();
  const rtl = isRTL(locale);

  return (
    <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card md:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu className="w-5 h-5" />
      </Button>
      <h1 className={cn("text-base font-bold", rtl && "font-arabic")}>
        {t(locale, "appTitle")}
      </h1>
    </header>
  );
}
