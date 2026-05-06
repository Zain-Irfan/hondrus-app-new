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

      {/* Info Card */}
      <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.infoRow}>
          <Icon name="mail" size={20} color={colors.primary} />
          <View>
            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{t.confirmationLabel}</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>{t.confirmationValue}</Text>
          </View>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.infoRow}>
          <Icon name="truck" size={20} color={colors.primary} />
          <View>
            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{t.shippingLabel}</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>{t.shippingVia}</Text>
          </View>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.infoRow}>
          <Icon name="search" size={20} color={colors.primary} />
          <View>
            <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{t.trackingLabel}</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>
              {t.trackingValue(orderId ?? "")}
            </Text>
          </View>
        </View>
      </View>

      {/* Honduran Pride Banner */}
      <View style={[styles.prideBanner, { backgroundColor: colors.primary }]}>
        <Text style={styles.prideFlag}>🇭🇳</Text>
        <View>
          <Text style={styles.prideTitle}>{t.thanksTitle}</Text>
          <Text style={styles.prideSub}>{t.thanksSub}</Text>
        </View>
      </View>

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
