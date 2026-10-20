import { router } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { AuthShell, Button, EmptyState } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

/** Shown when Clerk is not configured (local Expo without publishable key). */
export function AuthUnavailable() {
  const colors = useColors();
  const { t } = useLanguage();

  return (
    <AuthShell
      title={t.signInTitle ?? "Welcome back"}
      subtitle={
        (t as any).authUnavailableSub ??
        "Sign-in needs Clerk configuration. You can keep browsing as a guest."
      }
    >
      <View style={styles.wrap}>
        <EmptyState
          icon={
            <MaterialCommunityIcons name="account-off-outline" size={32} color={colors.primary} />
          }
          title={(t as any).authUnavailableTitle ?? "Sign-in unavailable"}
          subtitle={
            (t as any).authUnavailableHint ??
            "Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to enable account features."
          }
        />
        <Button title={t.backHome ?? "Back home"} onPress={() => router.replace("/(tabs)")} />
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
});
