import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Icon } from "@/components/Icon";
import { useColors } from "@/hooks/useColors";

/**
 * ReorderStrip — home screen quick-reorder banner.
 * Shows above bestsellers when the user has a previous order.
 * Designed in mockup #01.
 */

interface Props {
  /** Short summary, e.g. "Café El Indio + 2 más" */
  summary?: string;
  onPress?: () => void;
  visible?: boolean;
}

export function ReorderStrip({ summary, onPress, visible = true }: Props) {
  const colors = useColors();
  if (!visible) return null;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.wrap,
        {
          backgroundColor: colors.secondary,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel="Volver a pedir tu último pedido"
    >
      <View style={[styles.iconBubble, { backgroundColor: colors.primary }]}>
        <Icon name="rotate-cw" size={18} color={colors.gold} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.foreground }]}>Volver a pedir</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]} numberOfLines={1}>
          {summary ?? "Tu último pedido"}
        </Text>
      </View>
      <Icon name="chevron-right" size={20} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 999,
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
