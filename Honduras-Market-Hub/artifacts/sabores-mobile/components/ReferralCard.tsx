import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Icon } from "@/components/Icon";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

/**
 * ReferralCard — shown on order-success and account.
 * "Compartí Sabores · $10/$10" promo card. Designed in mockup #09.
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
          backgroundColor: colors.primary,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={(t as any).shareReferralCard ?? "Compartí Sabores"}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.goldLight }]}>
        <Icon name="gift" size={22} color={colors.primary} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.gold }]}>
          {(t as any).shareReferralCard ?? "Compartí Sabores"}
        </Text>
        <Text style={styles.sub}>
          {(t as any).shareReferralDesc ??
            "Tu amigo recibe $10 en su primer pedido. Vos recibís $10 cuando complete su compra."}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
    borderRadius: 16,
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
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  sub: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
});
