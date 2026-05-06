import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function CategoryPill({ label, selected, onPress }: Props) {
  const colors = useColors();

  return (
    <Pressable
      style={[
        styles.pill,
        {
          backgroundColor: selected ? colors.primary : "transparent",
          borderColor: colors.primary,
          shadowColor: selected ? colors.primary : "transparent",
          elevation: selected ? 3 : 0,
          shadowOpacity: selected ? 0.25 : 0,
          shadowRadius: selected ? 4 : 0,
          shadowOffset: { width: 0, height: 2 },
        },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.label,
          { color: selected ? "#fff" : colors.primary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 50,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    height: 38,
  },
  label: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 18,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
});
