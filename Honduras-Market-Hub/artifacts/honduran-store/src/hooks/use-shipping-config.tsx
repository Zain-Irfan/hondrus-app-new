import { useQuery } from "@tanstack/react-query";

export interface ShippingConfig {
  standardRate: number;
  freeShippingThreshold: number;
}

const FALLBACK: ShippingConfig = { standardRate: 9.99, freeShippingThreshold: 75 };

async function fetchShippingConfig(): Promise<ShippingConfig> {
  const res = await fetch("/api/store/shipping-config");
  if (!res.ok) throw new Error("Failed to load shipping config");
  const data = await res.json();
  if (typeof data?.standardRate !== "number" || typeof data?.freeShippingThreshold !== "number") {
    throw new Error("Invalid shipping config response");
  }
  return { standardRate: data.standardRate, freeShippingThreshold: data.freeShippingThreshold };
}

export function useShippingConfig(): ShippingConfig {
  const { data } = useQuery({
    queryKey: ["shipping-config"],
    queryFn: fetchShippingConfig,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  return data ?? FALLBACK;
}
