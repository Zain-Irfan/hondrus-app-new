import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { Icon } from "@/components/Icon";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { useShippingConfig } from "@/hooks/useShippingConfig";

export function FreeShippingProgress() {
  const colors = useColors();
  const { t } = useLanguage();
  const { subtotal } = useCart();
  // Live admin-configurable threshold from the server; falls back to the
  // language pack value (then 75) if the call hasn't completed.
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

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={message}
      style={[
        styles.container,
        {
          backgroundColor: unlocked ? colors.goldLight : colors.card,
          borderColor: unlocked ? colors.gold : colors.border,
        },
      ]}
    >
      <View style={styles.row}>
        <Icon
          name={unlocked ? "check-circle" : "truck"}
          size={20}
          color={unlocked ? colors.gold : colors.primary}
        />
        <Text
          style={[styles.text, { color: unlocked ? colors.primary : colors.foreground }]}
          numberOfLines={2}
        >
          {message}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <Animated.View
          style={[
            styles.fill,
            {
              width: widthInterpolated,
              backgroundColor: unlocked ? colors.gold : colors.primary,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  text: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 18,
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 3 },
});
