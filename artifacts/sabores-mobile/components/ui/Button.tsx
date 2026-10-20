import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
  TextStyle,
  StyleProp,
} from "react-native";

import { fonts } from "@/constants/fonts";
import { useColors } from "@/hooks/useColors";

export type ButtonVariant = "primary" | "secondary" | "outline" | "danger" | "ghost" | "gold";

interface Props {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  icon,
  iconRight,
  style,
  textStyle,
  accessibilityLabel,
  testID,
}: Props) {
  const colors = useColors();
  const isDisabled = disabled || loading;

  const bg =
    variant === "primary"
      ? colors.primary
      : variant === "secondary"
        ? colors.v2.bg.brandSoft
        : variant === "gold"
          ? colors.gold
          : variant === "danger"
            ? colors.destructive
            : "transparent";

  const borderColor =
    variant === "outline"
      ? colors.border
      : variant === "ghost"
        ? "transparent"
        : bg === "transparent"
          ? colors.border
          : bg;

  // Gold CTAs use navy text for readability on gold fill
  const textColor =
    variant === "gold"
      ? colors.primary
      : variant === "primary" || variant === "danger"
        ? colors.primaryForeground
        : variant === "secondary"
          ? colors.primary
          : colors.foreground;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg,
          borderColor,
          borderWidth: variant === "outline" || variant === "ghost" ? 1 : 0,
          opacity: isDisabled ? 0.55 : pressed ? 0.88 : 1,
          borderRadius: colors.radii.md,
        },
        variant === "ghost" && { borderWidth: 0 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon}
          <Text style={[styles.label, { color: textColor }, textStyle]}>{title}</Text>
          {iconRight}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    paddingHorizontal: 20,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  label: {
    fontSize: 16,
    fontFamily: fonts.bold,
  },
});
