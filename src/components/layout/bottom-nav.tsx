"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Scissors, ShoppingBag, CalendarDays, Package } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const tabs = [
  { label: "الرئيسية", href: "/", icon: Home },
  { label: "الخدمات", href: "/services", icon: Scissors },
  { label: "المنتجات", href: "/products", icon: Package },
  { label: "السلة", href: "/cart", icon: ShoppingBag },
  { label: "احجزي", href: "/booking", icon: CalendarDays },
];

export function BottomNav() {
  const pathname = usePathname();
  const itemCount = useCartStore((s) => s.getItemCount());
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass-strong border-t border-border/30 pb-safe-bottom">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href));
          const isCart = tab.href === "/cart";

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors relative",
                isActive ? "text-terracotta" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} strokeWidth={isActive ? 2.5 : 1.8} />
                {/* Cart badge */}
                {isCart && mounted && itemCount > 0 && (
                  <span className="absolute -top-1.5 -left-2 min-w-[18px] h-[18px] rounded-full bg-terracotta text-white text-[9px] font-bold flex items-center justify-center px-1 animate-bounce-subtle">
                    {itemCount}
                  </span>
                )}
              </div>
              <span className={cn("text-[10px] font-medium", isActive && "font-bold")}>
                {tab.label}
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
