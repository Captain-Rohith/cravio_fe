import { create } from "zustand";
import type { MenuItem } from "@/types/dto";

export interface CartItem {
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

interface CartState {
  restaurantId: string | null;
  items: CartItem[];
  setRestaurant: (restaurantId: string) => void;
  addItem: (item: MenuItem) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  restaurantId: null,
  items: [],
  setRestaurant: (restaurantId) => {
    if (get().restaurantId !== restaurantId) {
      set({ restaurantId, items: [] });
    }
  },
  addItem: (item) => {
    const current = get().items;
    const existing = current.find((cartItem) => cartItem.menuItemId === item.id);
    if (existing) {
      set({
        items: current.map((cartItem) =>
          cartItem.menuItemId === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem,
        ),
      });
      return;
    }

    set({
      items: [
        ...current,
        {
          menuItemId: item.id,
          name: item.name,
          quantity: 1,
          unitPrice: item.price,
        },
      ],
    });
  },
  updateQuantity: (menuItemId, quantity) => {
    if (quantity <= 0) {
      set({ items: get().items.filter((item) => item.menuItemId !== menuItemId) });
      return;
    }

    set({
      items: get().items.map((item) =>
        item.menuItemId === menuItemId ? { ...item, quantity } : item,
      ),
    });
  },
  clearCart: () => set({ items: [], restaurantId: null }),
}));
