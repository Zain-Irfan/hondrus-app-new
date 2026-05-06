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

import { useCart } from "@/context/CartContext";
import { useColors } from "@/hooks/useColors";
import { useLanguage } from "@/context/LanguageContext";

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
  horizontal?: boolean;
  cardWidth?: number;
}

export function ProductCard({ product, horizontal = false, cardWidth }: Props) {
  const colors = useColors();
  const router = useRouter();
  const { addItem } = useCart();
  const { t } = useLanguage();
  const { width: windowWidth } = useWindowDimensions();
  const [justAdded, setJustAdded] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const numColumns = windowWidth >= 768 ? 3 : 2;
  const HORIZONTAL_PADDING = 16 * 2;
  const GAP = 12 * (numColumns - 1);
  const computedCardWidth = cardWidth ?? Math.floor((windowWidth - HORIZONTAL_PADDING - GAP) / numColumns);
  const IMAGE_HEIGHT = 160;

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  const handleAdd = () => {
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

  const renderStars = () => {
    if (!product.rating || product.rating <= 0) return null;
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text
          key={i}
          style={[styles.star, { color: i <= product.rating ? colors.gold : colors.border }]}
        >
          ★
        </Text>
      );
    }
    return <View style={styles.starsRow}>{stars}</View>;
  };

  if (horizontal) {
    return (
      <Pressable
        testID="product-card"
        style={({ pressed }) => [
          styles.horizontal,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            opacity: pressed ? 0.85 : 1,
            shadowColor: colors.foreground,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 6,
            elevation: 2,
          },
        ]}
        onPress={() => router.push(`/product/${product.id}`)}
      >
        <View>
          <Image source={{ uri: product.imageUrl }} style={styles.horizImage} resizeMode="cover" />
          {justAdded && (
            <Animated.View
              pointerEvents="none"
              style={[styles.addedToast, { backgroundColor: colors.primary, opacity: toastOpacity }]}
            >
              <Text style={styles.addedToastText}>✓ {addedLabel}</Text>
            </Animated.View>
          )}
        </View>
        <View style={styles.horizContent}>
          {product.isBestseller && (
            <View style={[styles.badge, { backgroundColor: colors.goldLight }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>Más Vendido</Text>
            </View>
          )}
          <Text style={[styles.category, { color: colors.mutedForeground }]} numberOfLines={1}>
            {product.categoryName}
          </Text>
          <Text style={[styles.productName, { color: colors.foreground }]} numberOfLines={2}>
            {product.name}
          </Text>
          {renderStars()}
          <View style={styles.horizBottom}>
            <Text style={[styles.price, { color: colors.primary }]}>
              ${product.price.toFixed(2)}
            </Text>
            <Pressable
              testID="add-to-cart-btn"
              accessibilityRole="button"
              accessibilityLabel={`${(t as any).addToCart ?? "Add to cart"}: ${product.name}`}
              hitSlop={8}
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
              onPress={handleAdd}
            >
              <Text style={styles.addBtnText}>+</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      testID="product-card"
      style={({ pressed }) => [
        styles.card,
        {
          width: computedCardWidth,
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
          shadowColor: colors.foreground,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 3,
        },
      ]}
      onPress={() => router.push(`/product/${product.id}`)}
    >
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: product.imageUrl }}
          style={[styles.image, { height: IMAGE_HEIGHT }]}
          resizeMode="cover"
        />
        {product.isBestseller && (
          <View style={[styles.badge, styles.badgeAbsolute, { backgroundColor: colors.goldLight }]}>
            <Text style={[styles.badgeText, { color: colors.primary }]}>Más Vendido</Text>
          </View>
        )}
        {!product.inStock && (
          <View style={[styles.outOfStock, { backgroundColor: "rgba(0,0,0,0.6)" }]}>
            <Text style={styles.outOfStockText}>Agotado</Text>
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
        <Text style={[styles.category, { color: colors.mutedForeground }]} numberOfLines={1}>
          {product.categoryName}
        </Text>
        <Text style={[styles.productName, { color: colors.foreground }]} numberOfLines={2}>
          {product.name}
        </Text>
        {renderStars()}
        <View style={styles.footer}>
          <Text style={[styles.price, { color: colors.primary }]}>
            ${product.price.toFixed(2)}
          </Text>
          <Pressable
            testID="add-to-cart-btn"
            accessibilityRole="button"
            accessibilityLabel={`${(t as any).addToCart ?? "Add to cart"}: ${product.name}`}
            accessibilityState={{ disabled: !product.inStock }}
            hitSlop={8}
            style={[
              styles.addBtn,
              { backgroundColor: !product.inStock ? colors.muted : colors.primary },
            ]}
            onPress={handleAdd}
            disabled={!product.inStock}
          >
            <Text style={[styles.addBtnText, { color: product.inStock ? "#fff" : colors.mutedForeground }]}>+</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  imageWrap: {
    position: "relative",
  },
  image: {
    width: "100%",
    resizeMode: "cover",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  badgeAbsolute: {
    position: "absolute",
    top: 8,
    left: 8,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  outOfStock: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  outOfStockText: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  info: {
    padding: 14,
    gap: 6,
  },
  category: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
    opacity: 0.8,
  },
  productName: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    lineHeight: 19,
    minHeight: 38,
    marginBottom: 4,
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  star: {
    fontSize: 13,
    marginRight: 2,
    includeFontPadding: false,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  price: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: {
    color: "#fff",
    fontSize: 22,
    lineHeight: 26,
    fontFamily: "Inter_400Regular",
    includeFontPadding: false,
    textAlignVertical: "center",
    marginTop: -1,
  },
  horizontal: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 12,
  },
  horizImage: {
    width: 110,
    height: 110,
    resizeMode: "cover",
  },
  horizContent: {
    flex: 1,
    padding: 12,
    gap: 4,
    justifyContent: "space-between",
  },
  horizBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addedToast: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  addedToastText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
  },
});
