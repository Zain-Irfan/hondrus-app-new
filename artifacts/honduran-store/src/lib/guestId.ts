const STORAGE_KEY = "sabores.guestId.v1";

function generateGuestId(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/**
 * Returns the browser's persistent guest token, generating one on first call.
 * Stored in localStorage so the same device can re-fetch guest orders, and
 * later claim them on sign-in. Safe to call during SSR — falls back to a
 * fresh value when localStorage is unavailable.
 */
export function getGuestId(): string {
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing && existing.length > 0) return existing;
    const fresh = generateGuestId();
    window.localStorage.setItem(STORAGE_KEY, fresh);
    return fresh;
  } catch {
    return generateGuestId();
  }
}
