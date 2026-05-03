"use client";

import { ShoppingBag, Check } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
  product: {
    productId: string;
    name: string;
    price: number;
    image: string;
    stock: number | null;
  };
  disabled?: boolean;
  className?: string;
}

export function AddToCartButton({ product, disabled, className }: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    if (disabled) return;
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <button
      onClick={handleAdd}
      disabled={disabled}
      className={cn(
        "w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all",
        disabled
          ? "bg-muted text-muted-foreground cursor-not-allowed"
          : added
          ? "bg-green-500 text-white"
          : "gradient-terracotta text-white hover:shadow-lg hover:scale-[1.02]",
        className
      )}
    >
      {added ? (
        <>
          <Check className="w-4 h-4" />
          تمت الإضافة
        </>
      ) : disabled ? (
        "غير متوفر"
      ) : (
        <>
          <ShoppingBag className="w-4 h-4" />
          أضيفي للسلة
        </>
      )}
    </button>
  );
}
