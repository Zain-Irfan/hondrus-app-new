import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { useColors } from "@/hooks/useColors";

function SkeletonBox({ width, height, style }: { width: number | string; height: number; style?: object }) {
  const colors = useColors();
  const anim = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.8, duration: 1000, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.2, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          backgroundColor: colors.border,
          borderRadius: 8,
          opacity: anim,
        },
        style,
      ]}
    />
  );
}

export function ProductCardSkeleton() {
  const colors = useColors();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: colors.radii.lg },
      ]}
    >
      <SkeletonBox width={"100%" as unknown as number} height={150} style={{ borderRadius: 0 }} />
      <View style={styles.info}>
        <SkeletonBox width={"80%" as unknown as number} height={13} />
        <SkeletonBox width={60} height={16} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  info: {
    padding: 10,
    gap: 8,
  },
});
