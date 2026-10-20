import { Redirect, Stack } from "expo-router";

import { useUser } from "@/context/UserContext";

/**
 * Uses UserContext instead of Clerk's useAuth so this layout works both with
 * ClerkProvider (production) and GuestUserProvider (local design testing
 * without EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY).
 */
export default function AuthLayout() {
  const { isSignedIn, loading } = useUser();

  // Only redirect once a signed-in session is confirmed. While auth is still
  // loading, keep rendering the auth screens instead of a blank screen.
  if (!loading && isSignedIn) return <Redirect href="/(tabs)/cuenta" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#F7F8FA" },
      }}
    >
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
