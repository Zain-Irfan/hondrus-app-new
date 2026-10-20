import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  FlatList,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BagPlusIcon, MailFillIcon } from "@/components/SvgIcons";
import { Card, EmptyState } from "@/components/ui";
import { fonts } from "@/constants/fonts";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { useShippingConfig } from "@/hooks/useShippingConfig";

const SUPPORT_EMAIL = "support@hngrocers.com";

export default function CartScreen() {
  const colors = useColors();
  const { t } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = Platform.OS === "web" ? 84 : 65 + insets.bottom;
  const { items, itemCount, subtotal, removeItem, updateQuantity, clearCart } = useCart();
  const { standardRate, freeShippingThreshold } = useShippingConfig();

  const qualifiesFreeShipping = subtotal >= freeShippingThreshold;
  const shippingCost = qualifiesFreeShipping ? 0 : standardRate;
  const estimatedTotal = subtotal + shippingCost;
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const remaining = Math.max(freeShippingThreshold - subtotal, 0);
  const green = colors.v2.state.success;

  if (items.length === 0) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.canvas }}
        contentContainerStyle={[
          styles.emptyContainer,
          { paddingTop: insets.top + 24, paddingBottom: tabBarHeight + 24, minHeight: "100%" },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <EmptyState
          icon={<BagPlusIcon size={36} color={colors.primary} strokeWidth={1.6} />}
          title={t.emptyCart}
          subtitle={(t as any).emptyCartSub ?? "Browse the store and add authentic Honduran products."}
          actionLabel={(t as any).shopNow ?? (t as any).backToHome ?? "Shop now"}
          onAction={() => router.push("/catalogo")}
        />

        <Card style={styles.helpCard}>
          <Text style={[styles.helpTitle, { color: colors.foreground }]}>{(t as any).needHelp}</Text>
          <Text style={[styles.helpSub, { color: colors.mutedForeground }]}>
            {(t as any).needHelpSub}
          </Text>
          <Pressable
            style={[styles.helpBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          >
            <MailFillIcon size={20} color={colors.primary} />
            <Text style={[styles.helpBoxText, { color: colors.primary }]}>{SUPPORT_EMAIL}</Text>
          </Pressable>
        </Card>
      </ScrollView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      {/* White title bar: "Cart · 4 items" + Clear all */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 12, backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.headerTitleRow}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]} accessibilityRole="header">
            {t.tabCart ?? "Cart"}
          </Text>
          <Text style={[styles.headerCount, { color: colors.mutedForeground }]}>
            {(t as any).cartItemsCount?.(itemCount) ?? `${itemCount}`}
          </Text>
        </View>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            clearCart();
          }}
          hitSlop={10}
          accessibilityRole="button"
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Text style={[styles.clearText, { color: colors.destructive }]}>{t.clearAll}</Text>
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + 150 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          // Free-shipping progress card
          <View style={[styles.shipCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.shipRow}>
              <MaterialCommunityIcons
                name={qualifiesFreeShipping ? "check-circle-outline" : "truck-outline"}
                size={20}
                color={green}
              />
              <Text style={[styles.shipText, { color: colors.v2.text.secondary }]}>
                {qualifiesFreeShipping ? t.freeShippingCongrats : t.freeShippingProgress(remaining.toFixed(2))}
              </Text>
            </View>
            <View style={[styles.progressBg, { backgroundColor: colors.v2.bg.muted }]}>
              <View style={[styles.progressFill, { backgroundColor: green, width: `${progressPercent}%` }]} />
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.itemCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Image
              source={{ uri: item.productImageUrl }}
              style={[styles.itemImage, { backgroundColor: colors.v2.bg.accentSoft }]}
            />
            <View style={styles.itemInfo}>
              <View style={styles.itemTop}>
                <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={2}>
                    {item.productName}
                  </Text>
                  <Text style={[styles.itemUnit, { color: colors.mutedForeground }]}>
                    ${item.price.toFixed(2)} {(t as any).eachShort ?? t.perUnit2}
                  </Text>
                </View>
                <Pressable
                  style={({ pressed }) => [styles.removeBtn, { opacity: pressed ? 0.6 : 1 }]}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel={`${t.clearAll} ${item.productName}`}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    removeItem(item.productId);
                  }}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.mutedForeground} />
                </Pressable>
              </View>
              <View style={styles.itemBottom}>
                <Text style={[styles.lineTotal, { color: colors.foreground }]}>${item.subtotal.toFixed(2)}</Text>
                <View style={[styles.stepper, { borderColor: colors.border }]}>
                  <Pressable
                    style={styles.qtyBtn}
                    accessibilityRole="button"
                    accessibilityLabel="−"
                    onPress={() => {
                      Haptics.selectionAsync();
                      updateQuantity(item.productId, item.quantity - 1);
                    }}
                  >
                    <MaterialCommunityIcons name="minus" size={18} color={colors.foreground} />
                  </Pressable>
                  <Text style={[styles.qtyText, { color: colors.foreground }]}>{item.quantity}</Text>
                  <Pressable
                    style={styles.qtyBtn}
                    accessibilityRole="button"
                    accessibilityLabel="+"
                    onPress={() => {
                      Haptics.selectionAsync();
                      updateQuantity(item.productId, item.quantity + 1);
                    }}
                  >
                    <MaterialCommunityIcons name="plus" size={18} color={colors.foreground} />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        )}
        ListFooterComponent={
          <View style={[styles.ledger, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{t.subtotal}</Text>
              <Text style={[styles.summaryValue, { color: colors.foreground }]}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{t.shippingLabel}</Text>
              <Text style={[styles.summaryValue, { color: qualifiesFreeShipping ? green : colors.foreground }]}>
                {qualifiesFreeShipping ? t.free : `$${standardRate.toFixed(2)}`}
              </Text>
            </View>
          </View>
        }
      />

      {/* Checkout bar above the tab bar */}
      <View
        style={[
          styles.checkoutBar,
          { bottom: tabBarHeight, backgroundColor: colors.surface, borderTopColor: colors.border },
        ]}
      >
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>{t.estimatedTotal}</Text>
          <Text style={[styles.totalAmount, { color: colors.foreground }]}>${estimatedTotal.toFixed(2)}</Text>
        </View>
        <Pressable
          testID="checkout-btn"
          onPress={() => router.push("/checkout")}
          accessibilityRole="button"
          style={({ pressed }) => [styles.checkoutBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 }]}
        >
          <MaterialCommunityIcons name="lock-outline" size={18} color="#FFFFFF" />
          <Text style={styles.checkoutBtnText}>{t.payNow}</Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color={colors.gold} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Empty state
  emptyContainer: { flexGrow: 1, paddingHorizontal: 20 },
  helpCard: { marginTop: "auto", marginBottom: 12, gap: 10 },
  helpTitle: { fontSize: 16, fontFamily: fonts.bold, textAlign: "center" },
  helpSub: { fontSize: 13, fontFamily: fonts.regular, textAlign: "center", lineHeight: 19 },
  helpBox: {
    marginTop: 6,
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  helpBoxText: { fontSize: 14, fontFamily: fonts.semibold },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitleRow: { flexDirection: "row", alignItems: "baseline", gap: 10 },
  headerTitle: { fontSize: 28, fontFamily: fonts.display, letterSpacing: -0.4 },
  headerCount: { fontSize: 14, fontFamily: fonts.regular },
  clearText: { fontSize: 14, fontFamily: fonts.semibold },

  list: { paddingHorizontal: 20, paddingTop: 16, gap: 12 },

  // Free-shipping card
  shipCard: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  shipRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  shipText: { flex: 1, fontSize: 14, fontFamily: fonts.medium },
  progressBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },

  // Item card
  itemCard: { flexDirection: "row", gap: 12, padding: 12, borderWidth: 1, borderRadius: 16 },
  itemImage: { width: 84, height: 84, borderRadius: 12, resizeMode: "cover" },
  itemInfo: { flex: 1, minWidth: 0, justifyContent: "space-between", gap: 8 },
  itemTop: { flexDirection: "row", alignItems: "flex-start", gap: 4 },
  itemName: { fontSize: 15, lineHeight: 20, fontFamily: fonts.semibold },
  itemUnit: { fontSize: 12, fontFamily: fonts.regular },
  removeBtn: { width: 32, height: 32, marginTop: -6, marginRight: -6, alignItems: "center", justifyContent: "center" },
  itemBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  lineTotal: { fontSize: 16, fontFamily: fonts.bold },
  stepper: { flexDirection: "row", alignItems: "center", height: 36, borderWidth: 1, borderRadius: 10 },
  qtyBtn: { width: 36, height: 34, alignItems: "center", justifyContent: "center" },
  qtyText: { minWidth: 22, textAlign: "center", fontSize: 15, fontFamily: fonts.bold },

  // Summary
  ledger: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  summaryLabel: { fontSize: 14, fontFamily: fonts.regular },
  summaryValue: { fontSize: 15, fontFamily: fonts.semibold },

  // Checkout bar
  checkoutBar: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  totalRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  totalLabel: { fontSize: 13, fontFamily: fonts.regular },
  totalAmount: { fontSize: 24, fontFamily: fonts.display },
  checkoutBtn: {
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  checkoutBtnText: { color: "#FFFFFF", fontSize: 16, fontFamily: fonts.bold },
});
