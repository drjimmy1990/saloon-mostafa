"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ShoppingBag, Menu, X, Flower2 } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

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

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-border/50"
          : "bg-transparent"
      )}
    >
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-terracotta to-terracotta/80 flex items-center justify-center shadow-lg group-hover:shadow-terracotta/30 transition-shadow">
              <Flower2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-dark leading-tight" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                جاردينيا
              </span>
              <span className="text-[10px] text-muted-foreground -mt-1 tracking-wider">
                GARDENIA SALON
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-terracotta transition-colors rounded-lg hover:bg-terracotta/5"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Book CTA — desktop only */}
            <Link
              href="/booking"
              className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl gradient-terracotta shadow-lg hover:shadow-terracotta/30 transition-all hover:scale-105"
            >
              احجزي الآن
            </Link>

            {/* Cart */}
            <Link href="/cart" className="relative p-2 rounded-lg hover:bg-muted transition-colors">
              <ShoppingBag className="w-5 h-5 text-foreground/70" />
              {mounted && itemCount > 0 && (
                <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-terracotta text-white text-[10px] font-bold flex items-center justify-center animate-fade-in-up">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                render={<button className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors" />}
              >
                <Menu className="w-5 h-5" />
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <SheetTitle className="sr-only">القائمة</SheetTitle>
                <div className="flex flex-col h-full">
                  {/* Mobile header */}
                  <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg gradient-terracotta flex items-center justify-center">
                        <Flower2 className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-bold text-dark" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                        جاردينيا
                      </span>
                    </div>
                    <button onClick={() => setMobileOpen(false)} className="p-1 rounded hover:bg-muted">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Mobile links */}
                  <nav className="flex-1 p-4 space-y-1">
                    {navLinks.map((link, i) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className="block px-4 py-3 text-base font-medium text-foreground/80 hover:text-terracotta hover:bg-terracotta/5 rounded-xl transition-colors animate-slide-in-right"
                        style={{ animationDelay: `${i * 50}ms` }}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </nav>

                  {/* Mobile CTA */}
                  <div className="p-4 border-t">
                    <Link
                      href="/booking"
                      onClick={() => setMobileOpen(false)}
                      className="block w-full text-center px-6 py-3 text-base font-bold text-white rounded-xl gradient-terracotta shadow-lg"
                    >
                      احجزي الآن ✨
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
