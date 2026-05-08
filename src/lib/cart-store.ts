import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  qty: number;
  stock: number | null;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "qty">) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const existing = get().items.find((i) => i.productId === item.productId);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.productId === item.productId
                ? { ...i, qty: Math.min(i.qty + 1, i.stock ?? 999) }
                : i
            ),
          });
        } else {
          set({ items: [...get().items, { ...item, qty: 1 }] });
        }
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
      },

      updateQty: (productId, qty) => {
        if (qty <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.productId === productId
              ? { ...i, qty: Math.min(qty, i.stock ?? 999) }
              : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      getTotal: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),

      getItemCount: () => get().items.reduce((sum, i) => sum + i.qty, 0),
    }),
    { name: "Noon-cart" }
  )
);
