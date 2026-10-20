import React from "react";
import { StyleSheet, View, ViewProps, StyleProp, ViewStyle } from "react-native";

import { useColors } from "@/hooks/useColors";

interface Props extends ViewProps {
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, padded = true, style, ...rest }: Props) {
  const colors = useColors();

  return (
    <View
      {...rest}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: colors.radii.lg,
          padding: padded ? 16 : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
});
