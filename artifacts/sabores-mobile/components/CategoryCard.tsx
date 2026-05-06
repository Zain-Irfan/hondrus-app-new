import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface Props {
  label: string;
  imageUrl: string;
  size?: number;
  onPress: () => void;
}

export function CategoryCard({ label, imageUrl, size = 120, onPress }: Props) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.wrap,
        {
          width: size,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.imageWrap,
          {
            width: size,
            height: size,
            backgroundColor: "#F5F5F5",
            borderColor: colors.border,
          },
        ]}
      >
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
      </View>
      <Text
        numberOfLines={1}
        style={[styles.label, { color: colors.foreground }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function CategoryCardSkeleton({ size = 120 }: { size?: number }) {
  const colors = useColors();
  return (
    <View style={[styles.wrap, { width: size }]}>
      <View
        style={[
          styles.imageWrap,
          { width: size, height: size, backgroundColor: colors.border, opacity: 0.5 },
        ]}
      />
      <View
        style={{
          marginTop: 8,
          width: size * 0.7,
          height: 12,
          borderRadius: 6,
          backgroundColor: colors.border,
          opacity: 0.5,
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
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 0,
  },
  image: {
    width: "82%",
    height: "82%",
    alignSelf: "center",
    marginTop: "9%",
  },
  label: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    letterSpacing: 1.2,
  },
});
