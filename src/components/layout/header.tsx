"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ShoppingBag, Menu, X, Flower2, ChevronLeft, User } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

const navLinks = [
  { label: "الرئيسية", href: "/" },
  { label: "الخدمات", href: "/services" },
  { label: "المنتجات", href: "/products" },
  { label: "المعرض", href: "/gallery" },
  { label: "من نحن", href: "/about" },
  { label: "تواصلي معنا", href: "/contact" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const itemCount = useCartStore((s) => s.getItemCount());
  const pathname = usePathname();
  const { user, initialize } = useAuthStore();

  useEffect(() => {
    setMounted(true);
    initialize();
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [initialize]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-500",
          scrolled
            ? "glass-strong shadow-sm"
            : "bg-transparent"
        )}
      >
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-terracotta to-terracotta/80 flex items-center justify-center shadow-lg shadow-terracotta/20 group-hover:shadow-terracotta/40 transition-all group-hover:scale-105">
                <Flower2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black text-dark leading-tight" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                  نون
                </span>
                <span className="text-[9px] text-muted-foreground -mt-0.5 tracking-[0.2em] uppercase font-medium">
                  SALOON NOON
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-0.5">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "relative px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300",
                      isActive
                        ? "text-terracotta bg-terracotta/8"
                        : "text-foreground/60 hover:text-terracotta hover:bg-terracotta/5"
                    )}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-terracotta" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Account — desktop only */}
              <Link
                href={user ? "/account" : "/login"}
                className="hidden md:flex relative p-2.5 rounded-xl hover:bg-muted/80 transition-colors"
                title={user ? "حسابي" : "تسجيل الدخول"}
              >
                <User className={cn("w-5 h-5", user ? "text-terracotta" : "text-foreground/60")} />
                {mounted && user && (
                  <span className="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />
                )}
              </Link>

              {/* Book CTA — desktop only */}
              <Link
                href="/booking"
                className="hidden md:inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl gradient-terracotta shadow-lg shadow-terracotta/20 hover:shadow-terracotta/40 transition-all hover:scale-105 active:scale-100"
              >
                <CalendarIcon className="w-4 h-4" />
                احجزي الآن
              </Link>

              {/* Cart — desktop only (mobile uses bottom nav) */}
              <Link href="/cart" className="hidden md:flex relative p-2.5 rounded-xl hover:bg-muted/80 transition-colors">
                <ShoppingBag className="w-5 h-5 text-foreground/60" />
                {mounted && itemCount > 0 && (
                  <span className="absolute -top-0.5 -left-0.5 min-w-[20px] h-5 rounded-full bg-terracotta text-white text-[10px] font-bold flex items-center justify-center px-1 animate-bounce-subtle shadow-sm shadow-terracotta/30">
                    {itemCount}
                  </span>
                )}
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2.5 rounded-xl hover:bg-muted/80 transition-colors"
                aria-label="القائمة"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile fullscreen overlay menu */}
      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden transition-all duration-400",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        {/* Backdrop */}
        <div
          className={cn(
            "absolute inset-0 bg-black/40 transition-opacity duration-400",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setMobileOpen(false)}
        />

        {/* Menu panel */}
        <div
          className={cn(
            "absolute top-0 right-0 w-[85%] max-w-sm h-full bg-white shadow-2xl transition-transform duration-400 ease-out",
            mobileOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="flex flex-col h-full">
            {/* Mobile header */}
            <div className="flex items-center justify-between p-5 border-b border-border/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl gradient-terracotta flex items-center justify-center shadow-sm">
                  <Flower2 className="w-4 h-4 text-white" />
                </div>
                <span className="font-black text-dark text-lg" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                  نون
                </span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-xl hover:bg-muted transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Mobile links */}
            <nav className="flex-1 p-5 space-y-1 overflow-y-auto">
              {navLinks.map((link, i) => {
                const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center justify-between px-4 py-3.5 text-base font-medium rounded-xl transition-all",
                      isActive
                        ? "text-terracotta bg-terracotta/8 font-bold"
                        : "text-foreground/70 hover:text-terracotta hover:bg-terracotta/5",
                      mobileOpen && "animate-slide-in-right"
                    )}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    {link.label}
                    <ChevronLeft className={cn("w-4 h-4 transition-colors", isActive ? "text-terracotta" : "text-muted-foreground/30")} />
                  </Link>
                );
              })}

              {/* Account link in mobile menu */}
              <Link
                href={user ? "/account" : "/login"}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center justify-between px-4 py-3.5 text-base font-medium rounded-xl transition-all",
                  pathname === "/account" || pathname === "/login"
                    ? "text-terracotta bg-terracotta/8 font-bold"
                    : "text-foreground/70 hover:text-terracotta hover:bg-terracotta/5",
                  mobileOpen && "animate-slide-in-right"
                )}
                style={{ animationDelay: `${navLinks.length * 50}ms` }}
              >
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {user ? "حسابي" : "تسجيل الدخول"}
                </span>
                <ChevronLeft className="w-4 h-4 text-muted-foreground/30" />
              </Link>
            </nav>

            {/* Mobile CTA */}
            <div className="p-5 border-t border-border/50 space-y-3">
              <Link
                href="/booking"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 w-full px-6 py-3.5 text-base font-bold text-white rounded-xl gradient-terracotta shadow-lg shadow-terracotta/20"
              >
                <CalendarIcon className="w-4 h-4" />
                احجزي الآن
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" />
    </svg>
  );
}
