import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/Icon";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "/api";

async function fetchProduct(id: string) {
  const res = await fetch(`${API_BASE}/products/${id}`);
  if (!res.ok) throw new Error("Producto no encontrado");
  return res.json();
}

export default function ProductDetailScreen() {
  const colors = useColors();
  const { t } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addItem, items } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProduct(id!),
  });

  const cartItem = items.find((i) => i.productId === product?.id);

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
  const barHeight = 56 + 16 + bottomPad;

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>{t.loading}</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Icon name="alert-circle" size={40} color={colors.destructive} />
        <Text style={[styles.errorText, { color: colors.foreground }]}>{t.productNotFound}</Text>
        <Pressable style={[styles.backBtn, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
          <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold" }}>{t.goBack}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image */}
        <View style={styles.imageWrap}>
          <Image source={{ uri: product.imageUrl }} style={styles.image} />
          {product.isBestseller && (
            <View style={[styles.badge, { backgroundColor: colors.gold }]}>
              <Text style={styles.badgeText}>{t.bestseller}</Text>
            </View>
          )}
          {!product.inStock && (
            <View style={[styles.outOfStock, { backgroundColor: "rgba(0,0,0,0.55)" }]}>
              <Text style={{ color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold" }}>{t.outOfStock}</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          {/* Category & Origin */}
          <View style={styles.metaRow}>
            <View style={[styles.catTag, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.catTagText, { color: colors.primary }]}>{product.categoryName}</Text>
            </View>
            <View style={[styles.catTag, { backgroundColor: colors.goldLight }]}>
              <Icon name="map-pin" size={11} color={colors.gold} />
              <Text style={[styles.catTagText, { color: colors.gold }]}>{product.origin}</Text>
            </View>
          </View>

          {/* Name & Price */}
          <Text style={[styles.name, { color: colors.foreground }]}>{product.name}</Text>
          <Text style={[styles.price, { color: colors.primary }]}>
            ${product.price.toFixed(2)}
          </Text>

          {/* Rating */}
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Text
                key={s}
                style={{ fontSize: 14, color: s <= Math.round(product.rating) ? colors.gold : colors.border }}
              >
                ★
              </Text>
            ))}
            <Text style={[styles.ratingText, { color: colors.mutedForeground }]}>
              {product.rating.toFixed(1)} {t.reviews(product.reviewCount)}
            </Text>
          </View>

          {/* Description */}
          <Text style={[styles.description, { color: colors.foreground }]}>{product.description}</Text>

          {/* Tags */}
          {product.tags?.length > 0 && (
            <View style={styles.tagsRow}>
              {product.tags.map((tag: string) => (
                <View key={tag} style={[styles.tag, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.tagText, { color: colors.mutedForeground }]}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Spacing for bottom bar */}
          <View style={{ height: barHeight }} />
        </View>
      </ScrollView>

      {/* Bottom Add to Cart Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: bottomPad }]}>
        {/* Quantity Selector */}
        <View style={[styles.qtySelector, { borderColor: colors.border }]}>
          <Pressable
            style={[styles.qtyBtn, { backgroundColor: colors.secondary }]}
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
          >
            <Icon name="minus" size={16} color={colors.primary} />
          </Pressable>
          <Text style={[styles.qtyText, { color: colors.foreground }]}>{quantity}</Text>
          <Pressable
            style={[styles.qtyBtn, { backgroundColor: colors.secondary }]}
            onPress={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
          >
            <Icon name="plus" size={16} color={colors.primary} />
          </Pressable>
        </View>

        {/* Add Button */}
        <Pressable
          testID="add-to-cart-btn"
          style={[
            styles.addBtn,
            { backgroundColor: added ? colors.success : (product.inStock ? colors.primary : colors.muted) },
          ]}
          onPress={handleAddToCart}
          disabled={!product.inStock}
        >
          <Icon name={added ? "check" : "shopping-bag"} size={18} color="#fff" />
          <Text style={styles.addBtnText}>
            {added ? t.added : t.addToCart((product.price * quantity).toFixed(2))}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  loadingText: { fontSize: 16, fontFamily: "Inter_400Regular" },
  errorText: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  backBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  imageWrap: { position: "relative" },
  image: { width: width, height: 280, resizeMode: "cover" },
  badge: { position: "absolute", top: 16, left: 16, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  badgeText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 12 },
  outOfStock: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  content: { padding: 20 },
  metaRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  catTag: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  catTagText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  name: { fontSize: 26, fontFamily: "Inter_700Bold", lineHeight: 32, marginBottom: 8 },
  price: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 10 },
  priceUnit: { fontSize: 14, fontFamily: "Inter_400Regular" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 16 },
  ratingText: { fontSize: 13, fontFamily: "Inter_400Regular", marginLeft: 4 },
  description: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 24, marginBottom: 16 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  tagText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  infoRow: { flexDirection: "row", borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  infoItem: { flex: 1, alignItems: "center", paddingVertical: 14, gap: 6 },
  infoDiv: { width: 1 },
  infoLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  infoValue: { fontSize: 13, fontFamily: "Inter_700Bold" },
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderTopWidth: 1 },
  qtySelector: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  qtyBtn: { padding: 10 },
  qtyText: { paddingHorizontal: 16, fontSize: 16, fontFamily: "Inter_700Bold" },
  addBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12 },
  addBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
});
