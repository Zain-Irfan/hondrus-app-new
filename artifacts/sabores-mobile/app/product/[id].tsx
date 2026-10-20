import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, EmptyState } from "@/components/ui";
import { fonts } from "@/constants/fonts";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { useShippingConfig } from "@/hooks/useShippingConfig";
import { localizeCategoryName } from "@/utils/categoryLabel";

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "/api";

async function fetchProduct(id: string) {
  const res = await fetch(`${API_BASE}/products/${id}`);
  if (!res.ok) throw new Error("Producto no encontrado");
  return res.json();
}

// Darker than the gold token so small text keeps 4.5:1 on its soft fill
const ORIGIN_TEXT = "#6B5A2A";

export default function ProductDetailScreen() {
  const colors = useColors();
  const { t } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addItem, itemCount, subtotal } = useCart();
  const { freeShippingThreshold } = useShippingConfig();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const { data: product, isLoading, error, refetch } = useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProduct(id!),
  });

  const handleAddToCart = () => {
    if (!product) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        price: product.price,
      });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const bottomPad = Platform.OS === "web" ? 50 : insets.bottom + 16;
  const barHeight = 52 + 12 + bottomPad;
  const photoHeight = Math.min(Math.round(windowWidth * 1.08), 460);

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.canvas }]}>
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>{t.loading}</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.canvas }]}>
        <EmptyState
          icon={<MaterialCommunityIcons name="alert-circle-outline" size={32} color={colors.destructive} />}
          title={t.productNotFound}
          actionLabel={(t as any).retry ?? "Retry"}
          onAction={() => refetch()}
        />
        <Button title={t.goBack} variant="ghost" onPress={() => router.back()} />
      </View>
    );
  }

  const categoryLabel = localizeCategoryName(t as any, product.categoryName);

  // Free-shipping hint: what's left after adding this item at the chosen quantity
  const threshold = freeShippingThreshold || (t as any).freeShippingThreshold || 75;
  const leftAfterAdd = threshold - subtotal - product.price * quantity;
  const shipHint =
    leftAfterAdd > 0
      ? (t as any).productShipAway?.(leftAfterAdd.toFixed(2)) ?? `Add $${leftAfterAdd.toFixed(2)} more for free shipping`
      : (t as any).productShipFree ?? "With this item your order ships free";

  const reviewsLabel = t.reviews(product.reviewCount).replace(/[()]/g, "");

  const details = [
    product.origin ? { label: (t as any).detailOrigin ?? "Origin", value: product.origin } : null,
    { label: (t as any).detailCategory ?? "Category", value: categoryLabel },
    { label: (t as any).detailShips ?? "Ships", value: (t as any).detailShipsValue ?? "UPS / FedEx with tracking" },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Full-bleed photo */}
        <View style={[styles.photo, { height: photoHeight, backgroundColor: colors.v2.bg.accentSoft }]}>
          <Image source={{ uri: product.imageUrl }} style={styles.fill} resizeMode="cover" />
          {!product.inStock && (
            <View style={styles.outOfStock}>
              <Text style={styles.outOfStockText}>{t.outOfStock}</Text>
            </View>
          )}
        </View>

        {/* Details sheet overlapping the photo */}
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={styles.chipsRow}>
            {!!product.origin && (
              <View style={[styles.chip, { backgroundColor: colors.v2.bg.accentSoft }]}>
                <MaterialCommunityIcons name="map-marker-outline" size={14} color={ORIGIN_TEXT} />
                <Text style={[styles.chipText, { color: ORIGIN_TEXT }]}>{product.origin}</Text>
              </View>
            )}
            {product.inStock ? (
              <View style={[styles.chip, { backgroundColor: colors.v2.state.successSoft }]}>
                <View style={[styles.dot, { backgroundColor: colors.v2.state.success }]} />
                <Text style={[styles.chipText, { color: colors.v2.state.success }]}>
                  {(t as any).inStockLabel ?? "In stock"}
                </Text>
              </View>
            ) : (
              <View style={[styles.chip, { backgroundColor: colors.v2.state.dangerSoft }]}>
                <Text style={[styles.chipText, { color: colors.v2.state.danger }]}>{t.outOfStock}</Text>
              </View>
            )}
            {product.isBestseller && (
              <View style={[styles.chip, { backgroundColor: colors.primary }]}>
                <Text style={[styles.chipText, { color: "#FFFFFF", letterSpacing: 0.4 }]}>
                  {t.bestseller.toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <Text style={[styles.name, { color: colors.foreground }]} accessibilityRole="header">
            {product.name}
          </Text>

          {product.rating > 0 && (
            <View style={styles.ratingRow}>
              <MaterialCommunityIcons name="star" size={16} color={colors.gold} />
              <Text style={[styles.ratingValue, { color: colors.foreground }]}>{product.rating.toFixed(1)}</Text>
              <Text style={[styles.ratingMeta, { color: colors.mutedForeground }]}>· {reviewsLabel}</Text>
            </View>
          )}

          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: colors.primary }]}>${product.price.toFixed(2)}</Text>
            <Text style={[styles.priceMeta, { color: colors.mutedForeground }]}>{categoryLabel}</Text>
          </View>

          {product.inStock && (
            <View style={[styles.shipHint, { backgroundColor: colors.canvas }]}>
              <MaterialCommunityIcons
                name={leftAfterAdd > 0 ? "truck-outline" : "check-circle-outline"}
                size={20}
                color={colors.v2.state.success}
              />
              <Text style={[styles.shipHintText, { color: colors.v2.text.secondary }]}>{shipHint}</Text>
            </View>
          )}

          {product.inStock && product.stockQuantity > 0 && product.stockQuantity <= 6 && (
            <View style={[styles.lowStock, { backgroundColor: colors.v2.state.warningSoft }]}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={colors.v2.state.warning} />
              <Text style={[styles.lowStockText, { color: colors.v2.state.warning }]}>
                {typeof (t as any).lowStock === "function"
                  ? (t as any).lowStock(product.stockQuantity)
                  : `Only ${product.stockQuantity} left`}
              </Text>
            </View>
          )}

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {(t as any).aboutProduct ?? "About this product"}
          </Text>
          <Text style={[styles.description, { color: colors.v2.text.secondary }]}>{product.description}</Text>

          {product.tags?.length > 0 && (
            <View style={styles.tagsRow}>
              {product.tags.map((tag: string) => (
                <View key={tag} style={[styles.tag, { borderColor: colors.border }]}>
                  <Text style={[styles.tagText, { color: colors.v2.text.secondary }]}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={[styles.details, { borderColor: colors.border }]}>
            {details.map((d, i) => (
              <View
                key={d.label}
                style={[
                  styles.detailRow,
                  i < details.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.v2.bg.muted },
                ]}
              >
                <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{d.label}</Text>
                <Text style={[styles.detailValue, { color: colors.foreground }]} numberOfLines={1}>
                  {d.value}
                </Text>
              </View>
            ))}
          </View>

          <View style={{ height: barHeight }} />
        </View>
      </ScrollView>

      {/* Floating back + cart buttons over the photo */}
      <View style={[styles.topBar, { top: insets.top + 8 }]} pointerEvents="box-none">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.goBack}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.roundBtn, { backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1 }]}
        >
          <MaterialCommunityIcons name="chevron-left" size={26} color={colors.foreground} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.tabCart ?? "Cart"}
          onPress={() => router.push("/cart")}
          style={({ pressed }) => [styles.roundBtn, { backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1 }]}
        >
          <MaterialCommunityIcons name="cart-outline" size={22} color={colors.foreground} />
          {itemCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.gold, borderColor: colors.surface }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>{itemCount > 99 ? "99+" : itemCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Sticky add-to-cart bar */}
      <View
        style={[
          styles.bottomBar,
          { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: bottomPad },
        ]}
      >
        <View style={[styles.qtySelector, { backgroundColor: colors.v2.bg.muted }]}>
          <Pressable
            style={styles.qtyBtn}
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
            accessibilityRole="button"
            accessibilityLabel="−"
            hitSlop={4}
          >
            <MaterialCommunityIcons name="minus" size={20} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.qtyText, { color: colors.foreground }]}>{quantity}</Text>
          <Pressable
            style={styles.qtyBtn}
            onPress={() => setQuantity(Math.min(product.stockQuantity || 99, quantity + 1))}
            accessibilityRole="button"
            accessibilityLabel="+"
            hitSlop={4}
          >
            <MaterialCommunityIcons name="plus" size={20} color={colors.foreground} />
          </Pressable>
        </View>

        <Pressable
          testID="add-to-cart-btn"
          style={({ pressed }) => [
            styles.addBtn,
            {
              backgroundColor: added ? colors.success : product.inStock ? colors.primary : colors.muted,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
          onPress={handleAddToCart}
          disabled={!product.inStock}
        >
          <MaterialCommunityIcons
            name={added ? "check" : "shopping-outline"}
            size={20}
            color={product.inStock ? "#FFFFFF" : colors.mutedForeground}
          />
          <Text style={[styles.addBtnText, !product.inStock && { color: colors.mutedForeground }]}>
            {added ? t.added : t.addToCart((product.price * quantity).toFixed(2))}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fill: { width: "100%", height: "100%" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, padding: 24 },
  loadingText: { fontSize: 15, fontFamily: fonts.regular },

  photo: { width: "100%", position: "relative", overflow: "hidden" },
  outOfStock: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(22,27,38,0.55)",
  },
  outOfStockText: { color: "#fff", fontSize: 16, fontFamily: fonts.bold },

  topBar: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 5,
  },
  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#121826",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  badge: {
    position: "absolute",
    top: -3,
    right: -3,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontSize: 10, fontFamily: fonts.bold },

  sheet: {
    marginTop: -24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  chipText: { fontSize: 12, fontFamily: fonts.bold },
  dot: { width: 6, height: 6, borderRadius: 3 },

  name: {
    fontSize: 28,
    lineHeight: 32,
    fontFamily: fonts.display,
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  ratingValue: { fontSize: 14, fontFamily: fonts.bold },
  ratingMeta: { fontSize: 14, fontFamily: fonts.regular },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 10, marginTop: 4, marginBottom: 20 },
  price: { fontSize: 30, fontFamily: fonts.display },
  priceMeta: { fontSize: 13, fontFamily: fonts.regular },

  shipHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 16,
  },
  shipHintText: { flex: 1, fontSize: 13, lineHeight: 18, fontFamily: fonts.medium },

  lowStock: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
  },
  lowStockText: { fontSize: 12, fontFamily: fonts.semibold },

  sectionTitle: { fontSize: 16, fontFamily: fonts.bold, marginBottom: 8, marginTop: 4 },
  description: { fontSize: 15, lineHeight: 24, fontFamily: fonts.regular, marginBottom: 14 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  tag: { height: 30, paddingHorizontal: 12, borderRadius: 15, borderWidth: 1, justifyContent: "center" },
  tagText: { fontSize: 13, fontFamily: fonts.semibold },

  details: { borderWidth: 1, borderRadius: 16, marginBottom: 8 },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  detailLabel: { fontSize: 14, fontFamily: fonts.regular },
  detailValue: { flexShrink: 1, fontSize: 14, fontFamily: fonts.bold, textAlign: "right" },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 12,
    paddingHorizontal: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  qtySelector: { flexDirection: "row", alignItems: "center", height: 52, borderRadius: 14 },
  qtyBtn: { width: 44, height: 52, alignItems: "center", justifyContent: "center" },
  qtyText: { minWidth: 24, textAlign: "center", fontSize: 16, fontFamily: fonts.bold },
  addBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: 14,
  },
  addBtnText: { color: "#fff", fontSize: 16, fontFamily: fonts.bold },
});
