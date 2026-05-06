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
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <SkeletonBox width={170} height={160} style={{ borderRadius: 0 }} />
      <View style={styles.info}>
        <SkeletonBox width={60} height={10} />
        <SkeletonBox width={140} height={14} />
        <SkeletonBox width={100} height={14} />
        <SkeletonBox width={70} height={20} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 170,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginRight: 16,
  },
  info: {
    padding: 14,
    gap: 8,
  },
});
