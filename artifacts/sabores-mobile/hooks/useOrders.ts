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
  const { isSignedIn, email, getToken, loading: userLoading } = useUser();
  const guestId = useGuestId();
  // Wait for guest id OR signed-in session; don't fetch while auth is still resolving.
  const enabled = !userLoading && (isSignedIn || !!guestId);

  return useQuery<OrderSummary[]>({
    queryKey: ["orders", isSignedIn ? `user:${email ?? ""}` : `guest:${guestId ?? ""}`],
    queryFn: async () => {
      const qs = !isSignedIn && guestId ? `?guestToken=${encodeURIComponent(guestId)}` : "";
      try {
        const res = await apiFetch(`/orders${qs}`, { method: "GET" }, getToken);
        if (!res.ok) {
          // Guests with no orders often get an empty/unauthorized response — treat as empty list.
          if (res.status === 401 || res.status === 403 || res.status === 404) return [];
          throw new Error("Failed to load orders");
        }
        const json = await res.json();
        return Array.isArray(json) ? json : [];
      } catch (err: any) {
        // Aborted / network hang → surface as empty for guests so UI can leave the spinner.
        if (!isSignedIn) return [];
        throw err;
      }
    },
    enabled,
    staleTime: 30_000,
    refetchOnMount: "always",
    retry: 1,
  });
}
