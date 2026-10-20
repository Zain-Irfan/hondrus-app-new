import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { BestsellerMark } from "@/components/ui";
import { fonts } from "@/constants/fonts";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  imageUrl: string;
  categoryName: string;
  isBestseller: boolean;
  isFeatured: boolean;
  inStock: boolean;
  rating: number;
  origin: string;
}

interface Props {
  product: Product;
  /** Larger type for feature placements */
  featured?: boolean;
  /** Horizontal list row (thumbnail + text + add) */
  horizontal?: boolean;
  /** Optional rank number rendered in the horizontal row (1-based) */
  rank?: number;
  cardWidth?: number;
}

export function ProductCard({
  product,
  featured = false,
  horizontal = false,
  rank,
  cardWidth,
}: Props) {
  const colors = useColors();
  const router = useRouter();
  const { addItem } = useCart();
  const { t } = useLanguage();
  const { width: windowWidth } = useWindowDimensions();
  const [justAdded, setJustAdded] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const numColumns = windowWidth >= 768 ? 3 : 2;
  const HORIZONTAL_PADDING = 20 * 2;
  const GAP = 12 * (numColumns - 1);
  const computedCardWidth =
    cardWidth ?? Math.floor((windowWidth - HORIZONTAL_PADDING - GAP) / numColumns);
  // Square image inset in a padded white card
  const CARD_PAD = 8;
  const IMAGE_HEIGHT = computedCardWidth - CARD_PAD * 2;

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  const handleAdd = (e?: any) => {
    e?.stopPropagation?.();
    if (!product.inStock) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addItem({
      id: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      price: product.price,
    });
    setJustAdded(true);
    Animated.timing(toastOpacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      Animated.timing(toastOpacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() =>
        setJustAdded(false),
      );
    }, 1100);
  };

  const addedLabel = (t as any).addedToCart ?? "Added!";
  const goToProduct = () => router.push(`/product/${product.id}`);

  const AddControl = ({ size = 36, radius }: { size?: number; radius?: number }) => (
    <Pressable
      testID="add-to-cart-btn"
      onPress={handleAdd}
      disabled={!product.inStock}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`${(t as any).addToCartShort ?? "Add"} ${product.name}`}
      style={[
        styles.addBtn,
        {
          width: size,
          height: size,
          borderRadius: radius ?? size / 2,
          backgroundColor: justAdded
            ? colors.success
            : product.inStock
              ? colors.primary
              : colors.muted,
        },
      ]}
    >
      <MaterialCommunityIcons
        name={justAdded ? "check" : "plus"}
        size={size > 32 ? 20 : 16}
        color={product.inStock ? "#FFFFFF" : colors.mutedForeground}
      />
    </Pressable>
  );

  // ---------- Horizontal list row (ranked list / compact list) ----------
  if (horizontal) {
    return (
      <Pressable
        testID="product-card"
        onPress={goToProduct}
        style={({ pressed }) => [
          styles.row,
          { borderBottomColor: colors.border, opacity: pressed ? 0.92 : 1 },
        ]}
      >
        {typeof rank === "number" && (
          <Text style={[styles.rank, { color: colors.gold }]}>
            {String(rank).padStart(2, "0")}
          </Text>
        )}
        <View style={[styles.rowThumb, { backgroundColor: colors.v2.bg.brandSoft, borderRadius: colors.radii.md }]}>
          <Image source={{ uri: product.imageUrl }} style={styles.fill} resizeMode="cover" />
        </View>
        <View style={styles.rowInfo}>
          <Text style={[styles.rowName, { color: colors.foreground }]} numberOfLines={2}>
            {product.name}
          </Text>
          <View style={styles.rowMeta}>
            <Text style={[styles.rowPrice, { color: colors.primary }]}>
              ${product.price.toFixed(2)}
            </Text>
            {!!product.origin && (
              <Text style={[styles.rowOrigin, { color: colors.v2.text.tertiary }]} numberOfLines={1}>
                · {product.origin}
              </Text>
            )}
          </View>
        </View>
        <AddControl size={34} />
      </Pressable>
    );
  }

  // ---------- Portrait grid / carousel card ----------
  return (
    <Pressable
      testID="product-card"
      onPress={goToProduct}
      style={({ pressed }) => [
        styles.card,
        {
          width: computedCardWidth,
          padding: CARD_PAD,
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.94 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.imageWrap,
          { height: IMAGE_HEIGHT, backgroundColor: colors.v2.bg.accentSoft },
        ]}
      >
        <Image source={{ uri: product.imageUrl }} style={styles.fill} resizeMode="cover" />
        {product.isBestseller && <BestsellerMark overlay />}
        {!product.inStock && (
          <View style={styles.outOfStock}>
            <Text style={styles.outOfStockText}>{t.outOfStock}</Text>
          </View>
        )}
        {justAdded && (
          <Animated.View
            pointerEvents="none"
            style={[styles.addedToast, { backgroundColor: colors.primary, opacity: toastOpacity }]}
          >
            <Text style={styles.addedToastText}>✓ {addedLabel}</Text>
          </Animated.View>
        )}
      </View>

      <View style={styles.info}>
        {!!product.origin && (
          <Text style={styles.origin} numberOfLines={1}>
            {product.origin}
          </Text>
        )}
        <Text
          style={[styles.name, featured && styles.nameFeatured, { color: colors.foreground }]}
          numberOfLines={2}
        >
          {product.name}
        </Text>
      </View>
      <View style={styles.footer}>
        <Text style={[styles.price, featured && styles.priceFeatured, { color: colors.foreground }]}>
          ${product.price.toFixed(2)}
        </Text>
        <AddControl size={36} radius={12} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { width: "100%", height: "100%" },

  // Grid card
  card: { overflow: "hidden", borderWidth: 1, borderRadius: 18, gap: 10 },
  imageWrap: { position: "relative", width: "100%", overflow: "hidden", borderRadius: 12 },
  outOfStock: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(22,27,38,0.5)",
  },
  outOfStockText: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  info: { paddingHorizontal: 4, gap: 3 },
  // Darker than the gold token so 11px text keeps 4.5:1 on white
  origin: { fontSize: 11, fontFamily: fonts.semibold, color: "#6B5A2A" },
  name: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    lineHeight: 18,
    minHeight: 36,
  },
  nameFeatured: { fontSize: 15, lineHeight: 20, minHeight: 40 },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  price: {
    fontSize: 16,
    fontFamily: fonts.bold,
  },
  priceFeatured: { fontSize: 17 },
  addBtn: {
    alignItems: "center",
    justifyContent: "center",
  },
  addedToast: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignItems: "center",
  },
  addedToastText: { color: "#fff", fontSize: 11, fontFamily: fonts.bold },

  // Horizontal row
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rank: {
    width: 26,
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.4,
  },
  rowThumb: { width: 64, height: 64, overflow: "hidden" },
  rowInfo: { flex: 1, minWidth: 0, gap: 4 },
  rowName: { fontSize: 15, fontFamily: "Inter_600SemiBold", lineHeight: 20, letterSpacing: -0.2 },
  rowMeta: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  rowPrice: { fontSize: 15, fontFamily: "Inter_700Bold" },
  rowOrigin: { fontSize: 12, fontFamily: "Inter_400Regular", flexShrink: 1 },
});
