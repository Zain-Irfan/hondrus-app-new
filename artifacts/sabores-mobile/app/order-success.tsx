import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/Icon";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { OrderTimeline } from "@/components/OrderTimeline";
import { ReferralCard } from "@/components/ReferralCard";

export default function OrderSuccessScreen() {
  const colors = useColors();
  const { t } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orderId, orderNumber } = useLocalSearchParams<{ orderId: string; orderNumber: string }>();

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const topPad = Platform.OS === "web" ? 67 + 40 : insets.top + 40;
  const bottomPad = Platform.OS === "web" ? 34 + 24 : insets.bottom + 24;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad, paddingBottom: bottomPad }]}>
      {/* Success Icon */}
      <View style={[styles.iconWrap, { backgroundColor: colors.success + "20" }]}>
        <Icon name="check-circle" size={64} color={colors.success} />
      </View>

      <Text style={[styles.title, { color: colors.foreground }]}>{t.orderConfirmed}</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        {t.orderReceived(orderNumber ?? "")}
      </Text>

      {/* v2 redesign: 5-stop status timeline replaces three static info rows */}
      <View style={{ width: "100%" }}>
        <OrderTimeline
          current="confirmed"
          estimateRange="12 – 14 de mayo"
          header={(t as any).timelineHeader ?? "Estado del pedido"}
        />
      </View>

      {/* Referral card — peak-happiness moment */}
      <ReferralCard onPress={() => router.push("/(tabs)/cuenta")} />

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          style={[styles.trackBtn, { backgroundColor: colors.secondary, borderColor: colors.primary }]}
          onPress={() => {
            router.replace("/(tabs)/mis-pedidos");
          }}
        >
          <Icon name="package" size={18} color={colors.primary} />
          <Text style={[styles.trackBtnText, { color: colors.primary }]}>
            {(t as any).viewOrder ?? "Ver mis pedidos"}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.homeBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.replace("/(tabs)")}
        >
          <Icon name="home" size={18} color="#fff" />
          <Text style={styles.homeBtnText}>{t.backHome}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", paddingHorizontal: 24, gap: 20 },
  iconWrap: { width: 110, height: 110, borderRadius: 55, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", textAlign: "center" },
  subtitle: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  infoCard: { width: "100%", borderRadius: 16, borderWidth: 1, padding: 16, gap: 16 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  infoLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  infoValue: { fontSize: 14, fontFamily: "Inter_500Medium", marginTop: 2 },
  divider: { height: 1 },
  prideBanner: { width: "100%", flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 14 },
  prideFlag: { fontSize: 32 },
  prideTitle: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  prideSub: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontFamily: "Inter_400Regular" },
  actions: { width: "100%", gap: 10 },
  trackBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5 },
  trackBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  homeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 14, borderRadius: 14 },
  homeBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
});
