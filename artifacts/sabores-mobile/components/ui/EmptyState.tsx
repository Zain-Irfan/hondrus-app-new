import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { fonts } from "@/constants/fonts";
import { useColors } from "@/hooks/useColors";
import { Button } from "./Button";

interface Props {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, subtitle, actionLabel, onAction }: Props) {
  const colors = useColors();

  return (
    <View style={styles.wrap}>
      {icon ? (
        <View style={[styles.iconCircle, { backgroundColor: colors.v2.bg.brandSoft }]}>
          {icon}
        </View>
      ) : null}
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>{subtitle}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} style={styles.cta} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontFamily: fonts.bold,
    textAlign: "center",
    letterSpacing: -0.2,
  },
  sub: {
    fontSize: 14,
    fontFamily: fonts.regular,
    textAlign: "center",
    lineHeight: 21,
    marginTop: 8,
  },
  cta: {
    marginTop: 24,
    minWidth: 180,
  },
});
