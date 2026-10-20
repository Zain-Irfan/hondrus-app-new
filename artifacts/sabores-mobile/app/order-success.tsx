import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import React, { useEffect } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { OrderTimeline } from "@/components/OrderTimeline";
import { ReferralCard } from "@/components/ReferralCard";
import { fonts } from "@/constants/fonts";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

export default function OrderSuccessScreen() {
  const colors = useColors();
  const { t } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orderNumber } = useLocalSearchParams<{ orderId: string; orderNumber: string }>();

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  // Light status-bar icons over the navy hero
  useEffect(() => {
    setStatusBarStyle("light");
    return () => setStatusBarStyle("dark");
  }, []);

  const topPad = Platform.OS === "web" ? 67 + 40 : insets.top + 48;
  const bottomPad = Platform.OS === "web" ? 34 + 24 : insets.bottom + 24;

  const displayNumber = orderNumber ? `#${orderNumber}` : "";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.canvas }}
      contentContainerStyle={{ paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      {/* Navy hero */}
      <View style={[styles.hero, { backgroundColor: colors.primary, paddingTop: topPad }]}>
        <View pointerEvents="none" style={styles.ringLeft} />
        <View pointerEvents="none" style={styles.ringRight} />
        <View style={[styles.checkCircle, { backgroundColor: colors.gold }]}>
          <MaterialCommunityIcons name="check-bold" size={40} color={colors.primary} />
        </View>
        <Text style={styles.title} accessibilityRole="header">
          {t.orderConfirmed}
        </Text>
        <Text style={styles.subtitle}>{t.orderReceived(orderNumber ?? "")}</Text>
        {!!displayNumber && (
          <View style={styles.orderChip}>
            <Text style={styles.orderChipText}>{displayNumber}</Text>
          </View>
        )}
      </View>

      {/* Content overlapping the hero */}
      <View style={styles.body}>
        <View style={styles.timelineShadow}>
          <OrderTimeline current="confirmed" header={(t as any).timelineHeader ?? "Estado del pedido"} />
        </View>

        <ReferralCard
          onPress={async () => {
            try {
              await Share.share({
                message:
                  (t as any).shareReferralDesc ??
                  "Comparte HN Grocers — tu amigo recibe $10 en su primer pedido.",
              });
            } catch {}
          }}
        />

        <View style={styles.actions}>
          <Pressable
            onPress={() => router.replace("/(tabs)/mis-pedidos")}
            accessibilityRole="button"
            style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 }]}
          >
            <MaterialCommunityIcons name="package-variant" size={20} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>{(t as any).viewOrder ?? "Ver mis pedidos"}</Text>
          </Pressable>
          <Pressable
            onPress={() => router.replace("/(tabs)")}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.secondaryBtn,
              { backgroundColor: colors.surface, borderColor: colors.v2.border.strong, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <MaterialCommunityIcons name="home-outline" size={20} color={colors.foreground} />
            <Text style={[styles.secondaryBtnText, { color: colors.foreground }]}>{t.backHome}</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 72,
    gap: 14,
    overflow: "hidden",
  },
  ringLeft: {
    position: "absolute",
    left: -60,
    bottom: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 30,
    borderColor: "rgba(201,168,76,0.16)",
  },
  ringRight: {
    position: "absolute",
    right: -50,
    top: 30,
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 20,
    borderColor: "rgba(255,255,255,0.06)",
  },
  checkCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 30,
    fontFamily: fonts.display,
    textAlign: "center",
    letterSpacing: -0.4,
  },
  subtitle: {
    color: "#C3CEE6",
    fontSize: 15,
    fontFamily: fonts.regular,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 300,
  },
  orderChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  orderChipText: { color: "#FFFFFF", fontSize: 14, fontFamily: fonts.bold, letterSpacing: 0.3 },

  body: { marginTop: -44, paddingHorizontal: 20, gap: 16 },
  timelineShadow: {
    borderRadius: 18,
    shadowColor: "#121826",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },

  actions: { gap: 10, marginTop: 4 },
  primaryBtn: {
    height: 54,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryBtnText: { color: "#FFFFFF", fontSize: 16, fontFamily: fonts.bold },
  secondaryBtn: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryBtnText: { fontSize: 16, fontFamily: fonts.bold },
});
