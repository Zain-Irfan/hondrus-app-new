import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { fonts } from "@/constants/fonts";
import { useColors } from "@/hooks/useColors";

interface Props {
  message: string;
}

export function ErrorBanner({ message }: Props) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: colors.v2.state.dangerSoft,
          borderColor: colors.v2.state.danger,
          borderRadius: colors.radii.md,
        },
      ]}
    >
      <MaterialCommunityIcons name="alert-circle-outline" size={18} color={colors.destructive} />
      <Text style={[styles.text, { color: colors.destructive }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  text: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.medium,
    lineHeight: 19,
  },
});
