import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const STORAGE_KEY = "sabores.guestId.v1";

function generateGuestId(): string {
  // RFC4122-ish v4. Avoids importing a heavy uuid lib.
  const bytes = new Uint8Array(16);
  for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

let cachedId: string | null = null;
let inflight: Promise<string> | null = null;

/**
 * Returns the device's persistent guest token, generating one on first call.
 * Used so guest checkout orders can be re-fetched on the same device, and
 * later claimed when the user signs in.
 */
export async function getGuestId(): Promise<string> {
  if (cachedId) return cachedId;
  if (inflight) return inflight;
  inflight = (async () => {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored && stored.length > 0) {
      cachedId = stored;
      return stored;
    }
    const fresh = generateGuestId();
    await AsyncStorage.setItem(STORAGE_KEY, fresh);
    cachedId = fresh;
    return fresh;
  })();
  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

/** React hook variant — returns null until the id has been loaded/created. */
export function useGuestId(): string | null {
  const [id, setId] = useState<string | null>(cachedId);
  useEffect(() => {
    let cancelled = false;
    if (cachedId) {
      setId(cachedId);
      return;
    }
    getGuestId().then((value) => {
      if (!cancelled) setId(value);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return id;
}
