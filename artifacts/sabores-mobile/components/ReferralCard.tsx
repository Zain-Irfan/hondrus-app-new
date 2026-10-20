import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { fonts } from "@/constants/fonts";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

/**
 * ReferralCard — shown on order-success and account.
 * "Comparte HN Grocers · $10/$10" promo card.
 */

interface Props {
  onPress?: () => void;
}

export function ReferralCard({ onPress }: Props) {
  const colors = useColors();
  const { t } = useLanguage();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.wrap,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={(t as any).shareReferralCard ?? "Comparte HN Grocers"}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.v2.bg.accentSoft }]}>
        <MaterialCommunityIcons name="gift-outline" size={22} color={colors.v2.text.accent} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {(t as any).shareReferralCard ?? "Comparte HN Grocers"}
        </Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          {(t as any).shareReferralDesc ??
            "Tu amigo recibe $10 en su primer pedido. Vos recibís $10 cuando complete su compra."}
        </Text>
      </View>
      <MaterialCommunityIcons name="share-variant-outline" size={20} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1, minWidth: 0 },
  title: {
    fontSize: 15,
    fontFamily: fonts.bold,
    marginBottom: 2,
  },
  sub: {
    fontSize: 13,
    fontFamily: fonts.regular,
    lineHeight: 18,
  },
});
