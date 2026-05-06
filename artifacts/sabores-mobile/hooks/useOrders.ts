import { useQuery } from "@tanstack/react-query";

import { useUser } from "@/context/UserContext";
import { apiFetch } from "@/lib/api";
import { useGuestId } from "@/lib/guestId";

export interface OrderSummary {
  id: number;
  orderNumber: string;
  status: string;
  total: number;
  subtotal: number;
  shippingCost: number;
  createdAt: string;
  trackingNumber?: string;
  shippingCarrier?: string;
  items: {
    productName: string;
    quantity: number;
    price: number;
    productImageUrl?: string | null;
  }[];
}

/**
 * Single source of truth for the current viewer's orders.
 * - Signed-in users → matched by email server-side.
 * - Guests → matched by per-device guestToken.
 *
 * Both `cuenta` (Account screen counter) and `mis-pedidos` (orders list)
 * use this hook so they always show the same count from the same cache.
 */
export function useOrders() {
  const { isSignedIn, email, getToken } = useUser();
  const guestId = useGuestId();
  const enabled = isSignedIn || !!guestId;

  return useQuery<OrderSummary[]>({
    queryKey: ["orders", isSignedIn ? `user:${email ?? ""}` : `guest:${guestId ?? ""}`],
    queryFn: async () => {
      const qs = !isSignedIn && guestId ? `?guestToken=${encodeURIComponent(guestId)}` : "";
      const res = await apiFetch(`/orders${qs}`, { method: "GET" }, getToken);
      if (!res.ok) return [];
      const json = await res.json();
      return Array.isArray(json) ? json : [];
    },
    enabled,
    staleTime: 30_000,
    refetchOnMount: "always",
  });
}
