import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { fonts } from "@/constants/fonts";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { useShippingConfig } from "@/hooks/useShippingConfig";

export function FreeShippingProgress() {
  const colors = useColors();
  const { t } = useLanguage();
  const { subtotal } = useCart();
  const { freeShippingThreshold } = useShippingConfig();
  const threshold = freeShippingThreshold || (t as any).freeShippingThreshold || 75;
  const progress = Math.min(subtotal / threshold, 1);
  const remaining = Math.max(threshold - subtotal, 0);

  const widthAnim = useRef(new Animated.Value(progress)).current;
  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progress,
      duration: 450,
      useNativeDriver: false,
    }).start();
  }, [progress, widthAnim]);

  const unlocked = remaining <= 0;
  const widthInterpolated = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  let message: string;
  if (subtotal === 0) {
    message = (t as any).freeShippingNudgeStart ?? `Free shipping on $${threshold}+`;
  } else if (unlocked) {
    message = (t as any).freeShippingUnlocked ?? "Free shipping unlocked!";
  } else {
    const fmt = remaining.toFixed(2);
    const fn = (t as any).freeShippingAway;
    message = typeof fn === "function" ? fn(fmt) : `$${fmt} away from free shipping`;
  }

  const green = colors.v2.state.success;

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={message}
      style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
    >
      <View style={[styles.iconTile, { backgroundColor: colors.v2.state.successSoft }]}>
        <MaterialCommunityIcons
          name={unlocked ? "check-circle-outline" : "truck-outline"}
          size={20}
          color={green}
        />
      </View>
      <View style={styles.body}>
        <Text style={[styles.text, { color: colors.foreground }]} numberOfLines={1}>
          {message}
        </Text>
        <View style={[styles.track, { backgroundColor: colors.v2.bg.muted }]}>
          <Animated.View style={[styles.fill, { width: widthInterpolated, backgroundColor: green }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Full-width white strip directly under the brand header
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, gap: 7 },
  text: {
    fontSize: 13,
    fontFamily: fonts.medium,
    lineHeight: 17,
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 3 },
});
