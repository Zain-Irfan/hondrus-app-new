import { Stack, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { EmptyState } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

export default function NotFoundScreen() {
  const colors = useColors();
  const { t } = useLanguage();
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: (t as any).notFoundTitle ?? "Not found" }} />
      <View style={[styles.container, { backgroundColor: colors.canvas }]}>
        <EmptyState
          icon={
            <MaterialCommunityIcons name="map-marker-question-outline" size={36} color={colors.primary} />
          }
          title={(t as any).notFoundMessage ?? "This screen doesn't exist."}
          actionLabel={(t as any).backToHome ?? t.backHome ?? "Go home"}
          onAction={() => router.replace("/")}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
});
