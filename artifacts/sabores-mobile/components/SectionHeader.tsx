import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { fonts } from "@/constants/fonts";
import { useColors } from "@/hooks/useColors";

interface Props {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, actionLabel, onAction }: Props) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      <Text style={[styles.title, { color: colors.foreground }]} accessibilityRole="header">
        {title}
      </Text>
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          hitSlop={12}
          accessibilityRole="button"
          style={({ pressed }) => [styles.action, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={[styles.actionText, { color: colors.primary }]}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  title: {
    flex: 1,
    paddingRight: 12,
    fontSize: 20,
    fontFamily: fonts.display,
    letterSpacing: -0.2,
  },
  action: { paddingVertical: 4, paddingHorizontal: 2 },
  actionText: {
    fontSize: 14,
    fontFamily: fonts.semibold,
  },
});
