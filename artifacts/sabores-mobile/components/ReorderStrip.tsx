import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { fonts } from "@/constants/fonts";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  /** Short summary, e.g. "Café El Indio + 2 más" */
  summary?: string;
  onPress?: () => void;
  visible?: boolean;
}

export function ReorderStrip({ summary, onPress, visible = true }: Props) {
  const colors = useColors();
  const { t } = useLanguage();
  if (!visible) return null;

  const title = (t as any).reorderTitle ?? t.reorder ?? "Order again";
  const fallbackSub = (t as any).reorderSub ?? "Your last order";
  const viewLabel = (t as any).reorderView ?? "View";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.wrap,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${summary ?? fallbackSub}`}
    >
      <View style={[styles.iconTile, { backgroundColor: colors.v2.bg.accentSoft }]}>
        <MaterialCommunityIcons name="refresh" size={22} color={colors.v2.text.accent} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]} numberOfLines={1}>
          {summary ?? fallbackSub}
        </Text>
      </View>
      <View style={[styles.pill, { backgroundColor: colors.v2.bg.brandSoft }]}>
        <Text style={[styles.pillText, { color: colors.primary }]}>{viewLabel}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontFamily: fonts.bold,
  },
  sub: {
    fontSize: 13,
    fontFamily: fonts.regular,
  },
  pill: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  pillText: { fontSize: 13, fontFamily: fonts.bold },
});
