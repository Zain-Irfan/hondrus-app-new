import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface CartItem {
  id: number;
  productId: number;
  productName: string;
  productImageUrl: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (product: {
    id: number;
    name: string;
    imageUrl: string;
    price: number;
  }) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "sabores_cart";
let nextId = 1;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const saved: CartItem[] = JSON.parse(raw);
          setItems(saved);
          if (saved.length > 0) {
            nextId = Math.max(...saved.map((i) => i.id)) + 1;
          }
        } catch {
          // ignore
        }
      }
    });
  }, []);

  const persist = useCallback((newItems: CartItem[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
  }, []);

  const addItem = useCallback(
    (product: {
      id: number;
      name: string;
      imageUrl: string;
      price: number;
    }) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === product.id);
        let next: CartItem[];
        if (existing) {
          next = prev.map((i) =>
            i.productId === product.id
              ? {
                  ...i,
                  quantity: i.quantity + 1,
                  subtotal: (i.quantity + 1) * i.price,
                }
              : i
          );
        } else {
          const newItem: CartItem = {
            id: nextId++,
            productId: product.id,
            productName: product.name,
            productImageUrl: product.imageUrl,
            price: product.price,
            quantity: 1,
            subtotal: product.price,
          };
          next = [...prev, newItem];
        }
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const removeItem = useCallback(
    (productId: number) => {
      setItems((prev) => {
        const next = prev.filter((i) => i.productId !== productId);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const updateQuantity = useCallback(
    (productId: number, quantity: number) => {
      setItems((prev) => {
        let next: CartItem[];
        if (quantity <= 0) {
          next = prev.filter((i) => i.productId !== productId);
        } else {
          next = prev.map((i) =>
            i.productId === productId
              ? { ...i, quantity, subtotal: quantity * i.price }
              : i
          );
        }
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const clearCart = useCallback(() => {
    setItems([]);
    AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);

  return (
    <CartContext.Provider
      value={{ items, itemCount, subtotal, addItem, removeItem, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
