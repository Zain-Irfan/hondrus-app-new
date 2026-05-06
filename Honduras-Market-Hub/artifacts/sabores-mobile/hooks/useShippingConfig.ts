import { useEffect, useState } from "react";
import { AppState } from "react-native";

import { apiFetch } from "@/lib/api";

export interface ShippingConfig {
  standardRate: number;
  freeShippingThreshold: number;
}

const FALLBACK: ShippingConfig = { standardRate: 9.99, freeShippingThreshold: 75 };
const TTL_MS = 60_000; // 1 minute — admin changes propagate quickly without hammering the API.

let cache: ShippingConfig | null = null;
let cacheAt = 0;
let inFlight: Promise<ShippingConfig> | null = null;

function isFresh(): boolean {
  return cache !== null && Date.now() - cacheAt < TTL_MS;
}

async function loadConfig(force = false): Promise<ShippingConfig> {
  if (!force && isFresh()) return cache!;
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const res = await apiFetch("/store/shipping-config");
      if (!res.ok) throw new Error("bad response");
      const data: any = await res.json();
      if (typeof data?.standardRate === "number" && typeof data?.freeShippingThreshold === "number") {
        cache = { standardRate: data.standardRate, freeShippingThreshold: data.freeShippingThreshold };
        cacheAt = Date.now();
        return cache;
      }
      return cache ?? FALLBACK;
    } catch {
      return cache ?? FALLBACK;
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

/**
 * Returns the live shipping configuration (admin-configurable on the server).
 * Falls back to sensible defaults until the first load completes.
 *
 * The result is cached process-wide so that mounting multiple consumers does
 * not refetch.
 */
export function useShippingConfig(): ShippingConfig {
  const [config, setConfig] = useState<ShippingConfig>(cache ?? FALLBACK);

  useEffect(() => {
    let cancelled = false;
    const refresh = (force = false) => {
      loadConfig(force).then((c) => {
        if (!cancelled) setConfig(c);
      });
    };
    refresh();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh(true);
    });
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  return config;
}
