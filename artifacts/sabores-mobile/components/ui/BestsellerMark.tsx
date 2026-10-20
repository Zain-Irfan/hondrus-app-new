import React from "react";
import { StyleSheet, Text, View, ViewStyle, StyleProp } from "react-native";

import { fonts } from "@/constants/fonts";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  style?: StyleProp<ViewStyle>;
  /** Compact overlay for product images */
  overlay?: boolean;
}

/** Unified bestseller mark — gold accent bar + restrained label. */
export function BestsellerMark({ style, overlay = false }: Props) {
  const colors = useColors();
  const { t } = useLanguage();

  // Product-image overlay: compact navy pill (redesign).
  if (overlay) {
    return (
      <View style={[styles.pill, { backgroundColor: colors.primary }, style]}>
        <Text style={styles.pillText} numberOfLines={1}>
          {t.bestseller.toUpperCase()}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: colors.v2.bg.accentSoft },
        style,
      ]}
    >
      <View style={[styles.bar, { backgroundColor: colors.gold }]} />
      <Text style={[styles.label, { color: colors.primary }]} numberOfLines={1}>
        {t.bestseller}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  pill: {
    position: "absolute",
    top: 8,
    left: 8,
    zIndex: 2,
    height: 22,
    paddingHorizontal: 8,
    borderRadius: 11,
    justifyContent: "center",
  },
  pillText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: fonts.bold,
    letterSpacing: 0.4,
  },
  bar: {
    width: 3,
    height: 11,
    borderRadius: 1.5,
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.2,
  },
});
