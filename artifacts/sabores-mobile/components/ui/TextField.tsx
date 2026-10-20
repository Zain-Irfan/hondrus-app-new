import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
  StyleProp,
} from "react-native";

import { fonts } from "@/constants/fonts";
import { useColors } from "@/hooks/useColors";

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  containerStyle?: StyleProp<ViewStyle>;
  /** Optional trailing control (e.g. password visibility toggle) */
  rightAccessory?: React.ReactNode;
}

export function TextField({
  label,
  error,
  helper,
  containerStyle,
  style,
  rightAccessory,
  ...rest
}: Props) {
  const colors = useColors();

  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? (
        <Text style={[styles.label, { color: colors.v2.text.secondary }]}>{label}</Text>
      ) : null}
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.surface,
            // No focus-state restyle: re-rendering the field on focus made Android
            // drop focus and close the keyboard right after it opened.
            borderColor: error ? colors.destructive : colors.v2.border.strong,
            borderWidth: 1,
          },
        ]}
      >
        <TextInput
          placeholderTextColor={colors.v2.text.tertiary}
          {...rest}
          style={[
            styles.input,
            {
              color: colors.foreground,
              paddingRight: rightAccessory ? 8 : 16,
            },
            style,
          ]}
        />
        {rightAccessory ? <View style={styles.accessory}>{rightAccessory}</View> : null}
      </View>
      {error ? (
        <Text style={[styles.helper, { color: colors.destructive }]}>{error}</Text>
      ) : helper ? (
        <Text style={[styles.helper, { color: colors.v2.text.tertiary }]}>{helper}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontFamily: fonts.semibold,
    marginBottom: 6,
    marginLeft: 2,
  },
  inputRow: {
    minHeight: 50,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: fonts.regular,
  },
  accessory: {
    paddingRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  helper: {
    fontSize: 12,
    fontFamily: fonts.regular,
    marginTop: 6,
    marginLeft: 2,
  },
});
