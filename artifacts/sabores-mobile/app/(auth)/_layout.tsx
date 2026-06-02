import { useAuth } from "@clerk/expo";
import { Redirect, Stack } from "expo-router";

export default function AuthLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  // Only redirect when Clerk has positively confirmed an active session.
  // If Clerk hasn't loaded (e.g. proxy unreachable in dev), still render the
  // auth screens rather than returning null (blank screen).
  if (isLoaded && isSignedIn) return <Redirect href="/(tabs)/cuenta" />;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#ffffff" } }}>
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
