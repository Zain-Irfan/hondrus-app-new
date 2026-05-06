import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useUser as useClerkUser, useClerk } from "@clerk/react";
import { getGuestId } from "@/lib/guestId";

// Module-level pub/sub so any component can trigger the sign-in flow
// without prop drilling. The Header registers a navigator that pushes the
// user to /sign-in.
let _openSignInHandler: (() => void) | null = null;
export function registerOpenSignIn(fn: () => void) { _openSignInHandler = fn; }
export function unregisterOpenSignIn() { _openSignInHandler = null; }
export function openSignIn() {
  if (_openSignInHandler) {
    _openSignInHandler();
  } else {
    // Fallback if no handler is registered yet (e.g. on first paint).
    const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
    window.location.href = `${base}/sign-in`;
  }
}

const API_BASE = (() => {
  const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
  return base + "/../api";
})();

export interface WebUserProfile {
  id: number;
  name: string;
  email: string;
  phone?: string;
  defaultAddress?: {
    fullName: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
  };
  orderCount: number;
  joinedAt: string;
}

interface UserContextValue {
  email: string | null;
  user: WebUserProfile | null;
  loading: boolean;
  /** Deprecated — kept for backwards-compat with old callers. Triggers the sign-in page. */
  login: (email?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  email: null,
  user: null,
  loading: false,
  login: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
});

async function fetchProfile(): Promise<WebUserProfile | null> {
  try {
    const res = await fetch(`${API_BASE}/account/profile`, {
      credentials: "include",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user: clerkUser } = useClerkUser();
  const { signOut } = useClerk();
  const [user, setUser] = useState<WebUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const email =
    clerkUser?.primaryEmailAddress?.emailAddress?.trim().toLowerCase() ?? null;

  useEffect(() => {
    if (!isLoaded) return;
    let cancelled = false;
    (async () => {
      if (isSignedIn && email) {
        const profile = await fetchProfile();
        if (!cancelled) {
          setUser(profile);
          setLoading(false);
        }
      } else {
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn, email]);

  // Claim guest orders that were placed on this device once the user signs in.
  // The endpoint is idempotent — orders without a guest token are unaffected.
  // We only mark the user as "claimed" after a successful response so a
  // transient network failure can be retried on the next render/sign-in.
  const lastClaimedFor = useRef<string | null>(null);
  const claimInFlightFor = useRef<string | null>(null);
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !clerkUser?.id) return;
    if (lastClaimedFor.current === clerkUser.id) return;
    if (claimInFlightFor.current === clerkUser.id) return;
    claimInFlightFor.current = clerkUser.id;
    (async () => {
      try {
        const guestToken = getGuestId();
        const res = await fetch(`${API_BASE}/orders/claim`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guestToken }),
        });
        if (res.ok) {
          lastClaimedFor.current = clerkUser.id;
        }
      } catch {
        // Best-effort: leave lastClaimedFor unset so a future render
        // (or refresh of the orders page) will retry.
      } finally {
        claimInFlightFor.current = null;
      }
    })();
  }, [isLoaded, isSignedIn, clerkUser?.id]);

  const login = useCallback(async () => {
    openSignIn();
  }, []);

  const logout = useCallback(async () => {
    await signOut();
    setUser(null);
  }, [signOut]);

  const refreshProfile = useCallback(async () => {
    if (!email) return;
    const profile = await fetchProfile();
    if (profile) setUser(profile);
  }, [email]);

  return (
    <UserContext.Provider value={{ email, user, loading, login, logout, refreshProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
