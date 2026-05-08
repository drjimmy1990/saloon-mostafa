"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Scissors, ShoppingBag, CalendarDays, Package, User } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const tabs = [
  { label: "الرئيسية", href: "/", icon: Home },
  { label: "الخدمات", href: "/services", icon: Scissors },
  { label: "المنتجات", href: "/products", icon: Package },
  { label: "السلة", href: "/cart", icon: ShoppingBag },
  { label: "احجزي", href: "/booking", icon: CalendarDays },
  { label: "حسابي", href: "/account", icon: User, authAware: true },
];

export function BottomNav() {
  const pathname = usePathname();
  const itemCount = useCartStore((s) => s.getItemCount());
  const { user, initialize } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    initialize();
  }, [initialize]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass-strong border-t border-border/30 pb-safe-bottom">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isCart = tab.href === "/cart";
          
          // For the account tab, redirect to login if not authenticated
          let targetHref = tab.href;
          if (tab.authAware && !user) {
            targetHref = "/login";
          }

          const isActive = pathname === targetHref || 
            (targetHref !== "/" && pathname.startsWith(targetHref)) ||
            (tab.authAware && (pathname === "/account" || pathname === "/login"));

          return (
            <Link
              key={tab.label}
              href={targetHref}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors relative",
                isActive ? "text-terracotta" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} strokeWidth={isActive ? 2.5 : 1.8} />
                {/* Cart badge */}
                {isCart && mounted && itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] rounded-full bg-terracotta text-white text-[9px] font-bold flex items-center justify-center px-1 animate-bounce-subtle">
                    {itemCount}
                  </span>
                )}
                {/* Auth dot */}
                {tab.authAware && mounted && user && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-500 border border-white" />
                )}
              </div>
              <span className={cn("text-[10px] font-medium", isActive && "font-bold")}>
                {tab.authAware && !user ? "دخول" : tab.label}
              </span>
              {/* Active indicator dot */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-terracotta" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
