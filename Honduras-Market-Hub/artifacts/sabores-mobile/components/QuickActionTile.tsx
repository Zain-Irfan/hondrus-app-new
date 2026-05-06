import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

/**
 * QuickActionTile — used on the redesigned account dashboard (mockup #11).
 * 2x2 grid of these on the account screen replaces the old long settings list.
 */

interface Props {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  tint?: "brand" | "gold";
}

export function QuickActionTile({ icon, title, subtitle, onPress, tint = "brand" }: Props) {
  const colors = useColors();
  const iconBg =
    tint === "gold" ? colors.goldLight : (colors as any).secondary ?? colors.muted;
  const iconColor = tint === "gold" ? colors.gold : colors.primary;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <View style={{ opacity: 1 }}>
          {React.isValidElement(icon)
            ? React.cloneElement(icon as React.ReactElement<any>, { color: iconColor, size: 18 })
            : icon}
        </View>
      </View>
      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.sub, { color: colors.mutedForeground }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 64,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  sub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
});
