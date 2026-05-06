import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

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
      <View style={[styles.titleWrap, { borderLeftColor: colors.gold }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      </View>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} hitSlop={10} style={styles.action}>
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
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  titleWrap: {
    borderLeftWidth: 4,
    paddingLeft: 12,
  },
  title: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  action: { paddingVertical: 4, paddingHorizontal: 4 },
  actionText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
