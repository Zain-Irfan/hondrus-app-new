import React from "react";
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { useColors } from "@/hooks/useColors";

interface Props {
  label: string;
  imageUrl: string;
  /** Legacy size — ignored when `tile` is true */
  size?: number;
  /** Large image tile (editorial Home strip) */
  tile?: boolean;
  tileWidth?: number;
  onPress: () => void;
}

export function CategoryCard({
  label,
  imageUrl,
  size = 76,
  tile = false,
  tileWidth,
  onPress,
}: Props) {
  const colors = useColors();
  const { width: winW } = useWindowDimensions();
  const tw = tileWidth ?? Math.min(148, Math.round(winW * 0.38));
  const th = Math.round(tw * 1.15);

  if (tile) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={({ pressed }) => [
          styles.tile,
          {
            width: tw,
            height: th,
            borderRadius: colors.radii.lg,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <Image source={{ uri: imageUrl }} style={styles.tileImage} resizeMode="cover" />
        <View style={styles.tileScrim} />
        <Text style={styles.tileLabel} numberOfLines={2}>
          {label}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.wrap,
        {
          width: size + 4,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.imageWrap,
          {
            width: size,
            height: size,
            backgroundColor: colors.v2.bg.brandSoft,
            borderRadius: colors.radii.lg,
          },
        ]}
      >
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
      </View>
      <Text numberOfLines={2} style={[styles.label, { color: colors.foreground }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function CategoryCardSkeleton({
  size = 76,
  tile = false,
  tileWidth,
}: {
  size?: number;
  tile?: boolean;
  tileWidth?: number;
}) {
  const colors = useColors();
  const { width: winW } = useWindowDimensions();
  const tw = tileWidth ?? Math.min(148, Math.round(winW * 0.38));
  const th = Math.round(tw * 1.15);

  if (tile) {
    return (
      <View
        style={{
          width: tw,
          height: th,
          borderRadius: colors.radii.lg,
          backgroundColor: colors.border,
          opacity: 0.35,
        }}
      />
    );
  }

  return (
    <View style={[styles.wrap, { width: size + 4 }]}>
      <View
        style={[
          styles.imageWrap,
          { width: size, height: size, backgroundColor: colors.border, opacity: 0.35 },
        ]}
      />
      <View
        style={{
          marginTop: 8,
          width: size * 0.65,
          height: 10,
          borderRadius: 5,
          backgroundColor: colors.border,
          opacity: 0.35,
          alignSelf: "center",
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
  },
  imageWrap: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  label: {
    marginTop: 8,
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    lineHeight: 14,
  },
  tile: {
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  tileImage: {
    ...StyleSheet.absoluteFillObject,
  },
  tileScrim: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "45%",
    backgroundColor: "rgba(0, 20, 60, 0.55)",
  },
  tileLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.2,
    paddingHorizontal: 12,
    paddingBottom: 12,
    zIndex: 1,
  },
});
