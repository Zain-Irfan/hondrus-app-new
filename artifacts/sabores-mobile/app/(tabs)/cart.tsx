import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/Icon";
import { BagPlusIcon, MailFillIcon, PhoneFillIcon } from "@/components/SvgIcons";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

export default function CartScreen() {
  const colors = useColors();
  const { t } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { items, itemCount, subtotal, removeItem, updateQuantity, clearCart } = useCart();

  const progressPercent = Math.min(100, (subtotal / 75) * 100);

  if (items.length === 0) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={[
          styles.emptyContainer,
          { paddingBottom: tabBarHeight + 24, minHeight: "100%" },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.emptyTop}>
          <BagPlusIcon size={88} color={colors.mutedForeground} strokeWidth={1.6} />
          <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>{t.emptyCart}</Text>
          <Pressable
            style={[styles.backHomeBtn, { borderColor: colors.foreground }]}
            onPress={() => router.push("/")}
          >
            <Text style={[styles.backHomeText, { color: colors.foreground }]}>
              {(t as any).backToHome ?? "BACK TO HOME"}
            </Text>
          </Pressable>
        </View>

        <View style={[styles.helpCard, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.helpTitle, { color: colors.foreground }]}>{(t as any).needHelp}</Text>
          <Text style={[styles.helpSub, { color: colors.mutedForeground }]}>
            {(t as any).needHelpSub}
          </Text>
          <View style={styles.helpRow}>
            <Pressable
              style={[styles.helpBox, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => Linking.openURL("tel:+50400000000")}
            >
              <PhoneFillIcon size={22} color={colors.foreground} />
              <Text style={[styles.helpBoxText, { color: colors.foreground }]}>
                {(t as any).contactPhone}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.helpBox, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => Linking.openURL("mailto:hello@sabores.com")}
            >
              <MailFillIcon size={22} color={colors.foreground} />
              <Text style={[styles.helpBoxText, { color: colors.foreground }]}>
                {(t as any).contactEmail}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: tabBarHeight + 120 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              {t.cartTitle(itemCount)}
            </Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                clearCart();
              }}
            >
              <Text style={[styles.clearText, { color: colors.destructive }]}>{t.clearAll}</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.cartItem, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: colors.primary, borderLeftWidth: 4 }]}>
            <Image source={{ uri: item.productImageUrl }} style={styles.itemImage} />
            <View style={styles.itemInfo}>
              <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={2}>
                {item.productName}
              </Text>
              <Text style={[styles.itemPrice, { color: colors.primary }]}>
                ${item.price.toFixed(2)} {t.perUnit2}
              </Text>
              <View style={styles.qtyRow}>
                <Pressable
                  style={[styles.qtyBtn, { backgroundColor: colors.secondary }]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    updateQuantity(item.productId, item.quantity - 1);
                  }}
                >
                  <Icon name="minus" size={16} color={colors.primary} />
                </Pressable>
                <Text style={[styles.qtyText, { color: colors.foreground }]}>{item.quantity}</Text>
                <Pressable
                  style={[styles.qtyBtn, { backgroundColor: colors.secondary }]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    updateQuantity(item.productId, item.quantity + 1);
                  }}
                >
                  <Icon name="plus" size={16} color={colors.primary} />
                </Pressable>
                <Text style={[styles.subtotal, { color: colors.foreground }]}>
                  {t.subtotalLine(item.subtotal.toFixed(2))}
                </Text>
              </View>
            </View>
            <Pressable
              style={styles.removeBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                removeItem(item.productId);
              }}
            >
              <Icon name="x" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>
        )}
        ListFooterComponent={
          <View style={[styles.summaryCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{t.subtotal}</Text>
              <Text style={[styles.summaryValue, { color: colors.foreground }]}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{t.shippingLabel}</Text>
              <Text style={[styles.summaryValue, { color: subtotal >= 75 ? colors.success : colors.foreground }]}>
                {subtotal >= 75 ? t.free : t.shippingCalculated}
              </Text>
            </View>

            {/* Free shipping progress */}
            <View style={styles.progressContainer}>
              <View style={[styles.freeShipRow, { backgroundColor: colors.goldLight }]}>
                <Icon name="truck" size={16} color={colors.gold} />
                <Text style={[styles.freeShipText, { color: colors.primary }]}>
                  {subtotal >= 75
                    ? t.freeShippingCongrats
                    : t.freeShippingProgress((75 - subtotal).toFixed(2))}
                </Text>
              </View>
              <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                <View style={[styles.progressBarFill, { backgroundColor: subtotal >= 75 ? colors.success : colors.gold, width: `${progressPercent}%` }]} />
              </View>
            </View>
          </View>
        }
      />

      {/* Checkout Bar — lifted above the tab bar */}
      <View style={[
        styles.checkoutBar,
        {
          bottom: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
          elevation: 12,
        }
      ]}>
        <View style={styles.checkoutBarInner}>
          <View>
            <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>{t.estimatedTotal}</Text>
            <Text style={[styles.totalAmount, { color: colors.primary }]}>${subtotal.toFixed(2)}</Text>
          </View>
          <Pressable
            testID="checkout-btn"
            style={[styles.checkoutBtn, { backgroundColor: colors.primary, borderColor: colors.gold, borderWidth: 2 }]}
            onPress={() => router.push("/checkout")}
          >
            <Text style={styles.checkoutBtnText}>{t.payNow}</Text>
            <Icon name="arrow-right" size={20} color={colors.gold} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 40, paddingBottom: 24 },
  emptyTop: { alignItems: "center", justifyContent: "center", gap: 18, paddingTop: 60, paddingBottom: 40 },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_500Medium", textAlign: "center" },
  backHomeBtn: {
    marginTop: 6,
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1.2,
    minWidth: 220,
    alignItems: "center",
  },
  backHomeText: { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 1.2, textTransform: "uppercase" },
  helpCard: { borderRadius: 12, padding: 22, gap: 12, marginTop: "auto", marginBottom: 12 },
  helpTitle: { fontSize: 17, fontFamily: "Inter_700Bold", textAlign: "center" },
  helpSub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  helpRow: { flexDirection: "row", gap: 12, marginTop: 6 },
  helpBox: {
    flex: 1,
    paddingVertical: 22,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  helpBoxText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  listHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  clearText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  cartItem: { flexDirection: "row", borderRadius: 16, borderWidth: 1, overflow: "hidden", marginBottom: 14, padding: 10, alignItems: "center" },
  itemImage: { width: 80, height: 80, borderRadius: 12, resizeMode: "cover" },
  itemInfo: { flex: 1, paddingLeft: 14, gap: 6 },
  itemName: { fontSize: 15, fontFamily: "Inter_600SemiBold", lineHeight: 20 },
  itemPrice: { fontSize: 14, fontFamily: "Inter_700Bold" },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 },
  qtyBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  qtyText: { fontSize: 16, fontFamily: "Inter_700Bold", minWidth: 24, textAlign: "center" },
  subtotal: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginLeft: 4 },
  removeBtn: { padding: 10, alignSelf: "flex-start", marginTop: -6, marginRight: -6 },
  summaryCard: { borderRadius: 16, borderWidth: 1, padding: 20, gap: 12, marginTop: 12 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { fontSize: 15, fontFamily: "Inter_500Medium" },
  summaryValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  progressContainer: { marginTop: 8 },
  freeShipRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  freeShipText: { fontSize: 13, fontFamily: "Inter_600SemiBold", flex: 1 },
  progressBarBg: { height: 6, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, overflow: "hidden" },
  progressBarFill: { height: "100%" },
  checkoutBar: { position: "absolute", bottom: 0, left: 0, right: 0, borderTopWidth: 1 },
  checkoutBarInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  totalLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  totalAmount: { fontSize: 26, fontFamily: "Inter_700Bold" },
  checkoutBtn: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 28, paddingVertical: 16, borderRadius: 50 },
  checkoutBtnText: { color: "#fff", fontSize: 17, fontFamily: "Inter_700Bold" },
});
