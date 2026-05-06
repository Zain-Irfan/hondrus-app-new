import { useAuth, useUser as useClerkUser } from "@clerk/expo";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

import { apiFetch } from "@/lib/api";
import { getGuestId } from "@/lib/guestId";

export interface SavedAddress {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  defaultAddress?: SavedAddress;
  orderCount: number;
  joinedAt: string;
}

interface UserContextType {
  user: UserProfile | null;
  email: string | null;
  loading: boolean;
  isSignedIn: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: { name?: string; phone?: string; defaultAddress?: SavedAddress }) => Promise<void>;
  getToken: () => Promise<string | null>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  email: null,
  loading: false,
  isSignedIn: false,
  logout: async () => {},
  refreshProfile: async () => {},
  updateProfile: async () => {},
  getToken: async () => null,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded: authLoaded, isSignedIn, signOut, getToken } = useAuth();
  const { user: clerkUser, isLoaded: userLoaded } = useClerkUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Keep latest getToken in a ref so callbacks remain stable across renders.
  // Clerk returns a new getToken function reference on every render — using
  // it directly in deps causes infinite render loops.
  const getTokenRef = useRef(getToken);
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const stableGetToken = useCallback(async () => {
    return getTokenRef.current ? await getTokenRef.current() : null;
  }, []);

  const email = clerkUser?.primaryEmailAddress?.emailAddress?.toLowerCase() ?? null;

  const fetchProfile = useCallback(async (): Promise<UserProfile | null> => {
    try {
      const res = await apiFetch("/account/profile", { method: "GET" }, stableGetToken);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }, [stableGetToken]);

  // Load profile whenever signed-in state changes
  useEffect(() => {
    let cancelled = false;
    if (!authLoaded || !userLoaded) return;
    if (!isSignedIn) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    fetchProfile()
      .then((p) => {
        if (cancelled) return;
        setProfile(p);
      })
      .finally(() => {
        if (cancelled) return;
        setProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authLoaded, userLoaded, isSignedIn, clerkUser?.id, fetchProfile]);

  // Claim any guest orders made on this device once the user signs in.
  // Idempotent: subsequent calls just return claimed=0 because the orders
  // no longer have the guest token attached. We only mark the claim as done
  // after a successful response so a transient failure can be retried.
  const lastClaimedFor = useRef<string | null>(null);
  const claimInFlightFor = useRef<string | null>(null);
  useEffect(() => {
    if (!isSignedIn || !clerkUser?.id) return;
    if (lastClaimedFor.current === clerkUser.id) return;
    if (claimInFlightFor.current === clerkUser.id) return;
    claimInFlightFor.current = clerkUser.id;
    (async () => {
      try {
        const guestToken = await getGuestId();
        const res = await apiFetch(
          "/orders/claim",
          { method: "POST", body: JSON.stringify({ guestToken }) },
          stableGetToken,
        );
        if (res.ok) {
          lastClaimedFor.current = clerkUser.id;
        }
      } catch {
        // Best-effort — leave lastClaimedFor unset so a future render
        // (or navigating to the orders tab) will retry.
      } finally {
        claimInFlightFor.current = null;
      }
    })();
  }, [isSignedIn, clerkUser?.id, stableGetToken]);

  const refreshProfile = useCallback(async () => {
    if (!isSignedIn) return;
    const p = await fetchProfile();
    if (p) setProfile(p);
  }, [isSignedIn, fetchProfile]);

  const updateProfile = useCallback(
    async (data: { name?: string; phone?: string; defaultAddress?: SavedAddress }) => {
      const res = await apiFetch(
        "/account/profile",
        { method: "PUT", body: JSON.stringify(data) },
        stableGetToken,
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? `Save failed (${res.status})`);
      }
      const updated = await res.json();
      setProfile(updated);
    },
    [stableGetToken],
  );

  const logout = useCallback(async () => {
    try {
      await signOut();
    } finally {
      setProfile(null);
    }
  }, [signOut]);

  const loading = !authLoaded || !userLoaded || profileLoading;

  return (
    <UserContext.Provider
      value={{
        user: profile,
        email,
        loading,
        isSignedIn: !!isSignedIn,
        logout,
        refreshProfile,
        updateProfile,
        getToken: stableGetToken,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
