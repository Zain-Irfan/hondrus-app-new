import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { useLanguage } from "@/context/LanguageContext";
import {
  Dimensions,
  FlatList,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProductCard } from "@/components/ProductCard";
import { ProductCardSkeleton } from "@/components/LoadingSkeleton";
import { FreeShippingProgress } from "@/components/FreeShippingProgress";
import { SectionHeader } from "@/components/SectionHeader";
import { CategoryCard, CategoryCardSkeleton } from "@/components/CategoryCard";
import { ReorderStrip } from "@/components/ReorderStrip";
import { useColors } from "@/hooks/useColors";
import { useOrders } from "@/hooks/useOrders";

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "/api";

async function fetchFeatured() {
  const res = await fetch(`${API_BASE}/store/featured`);
  if (!res.ok) throw new Error("Error al cargar productos");
  return res.json();
}

async function fetchCategories() {
  const res = await fetch(`${API_BASE}/categories`);
  if (!res.ok) throw new Error("Error al cargar categorías");
  return res.json();
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const CAT_GRID_HPAD = 16;
const CAT_GRID_GAP = 12;
const CAT_CARD_SIZE = Math.floor(
  (SCREEN_WIDTH - CAT_GRID_HPAD * 2 - CAT_GRID_GAP) / 2,
);

export default function HomeScreen() {
  const colors = useColors();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [search, setSearch] = useState("");

  const CATEGORY_LABELS: Record<string, string> = {
    coffee: t.catCoffee,
    "baked-goods": t.catBaked,
    pantry: t.catPantry,
    dairy: t.catDairy,
    snacks: t.catSnacks,
    sweets: t.catSweets,
    beverages: t.catBeverages,
    sauces: t.catSauces,
  };
  const searchRef = useRef<TextInput>(null);

  const { data: featured, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["featured"],
    queryFn: fetchFeatured,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  // Reorder strip — show last order summary if available
  const { data: ordersData } = useOrders();
  const lastOrder = ordersData?.orders?.[0];
  const reorderSummary = lastOrder
    ? `${lastOrder.items?.[0]?.productName ?? "Tu último pedido"}${
        lastOrder.items && lastOrder.items.length > 1
          ? ` + ${lastOrder.items.length - 1} más`
          : ""
      }`
    : undefined;

  const handleSearch = () => {
    if (search.trim()) {
      router.push(`/catalogo?search=${encodeURIComponent(search.trim())}`);
    }
  };

  const topPad = Platform.OS === "web" ? 67 + 16 : 16;
  const bottomPad = Platform.OS === "web" ? 84 + 34 : 120;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad, paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
      }
    >
      {/* Hero Banner — redesigned: real coffee photo, no overlay-on-stock-photo, lighter bottom gradient */}
      <View style={styles.heroContainer}>
        <Image
          source={{ uri: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&q=80&w=900" }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: "transparent" },
          ]}
        />
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: "rgba(0,21,63,0.45)",
            },
          ]}
        />
        <View style={styles.heroContent}>
          <Text style={[styles.heroSmall, { color: colors.gold }]}>
            {(t as any).heroTaglineV2 ?? "DIRECTO DE MARCALA"}
          </Text>
          <Text style={styles.heroTitle}>
            {(t as any).heroTitleV2 ?? "Lo de casa,\nhasta tu puerta."}
          </Text>
          <Text style={styles.heroSub}>
            {(t as any).heroSubV2 ?? t.heroSub}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={(t as any).shopNow ?? "Comprar ahora"}
            onPress={() => router.push("/catalogo")}
            style={({ pressed }) => [
              styles.heroCta,
              { backgroundColor: colors.gold, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={[styles.heroCtaText, { color: colors.primary }]}>
              {(t as any).shopNow ?? "Comprar ahora"}
            </Text>
            <Icon name="chevron-right" size={18} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      {/* Free Shipping Progress (dynamic, based on cart subtotal) */}
      <FreeShippingProgress />

      {/* Reorder strip — biggest LTV win for grocery */}
      {lastOrder && (
        <ReorderStrip
          summary={reorderSummary}
          onPress={() => router.push("/(tabs)/mis-pedidos")}
        />
      )}

      {/* Search Bar */}
      <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Icon name="search" size={18} color={colors.mutedForeground} />
        <TextInput
          ref={searchRef}
          style={[styles.searchInput, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
          placeholder={t.searchPlaceholderHome}
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <Pressable
            onPress={() => setSearch("")}
            accessibilityRole="button"
            accessibilityLabel={(t as any).clearSearch ?? "Clear search"}
            hitSlop={12}
            style={{ minWidth: 32, minHeight: 32, alignItems: "center", justifyContent: "center" }}
          >
            <Icon name="x" size={18} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <SectionHeader title={t.categories} />
        <View style={styles.catsGrid}>
          {categories && categories.length > 0
            ? categories.map((cat: { id: number; slug: string; name: string; imageUrl: string }) => (
                <View key={cat.id} style={[styles.catGridItem, { width: CAT_CARD_SIZE }]}>
                  <CategoryCard
                    label={(CATEGORY_LABELS[cat.slug] ?? cat.name).toUpperCase()}
                    imageUrl={cat.imageUrl}
                    size={CAT_CARD_SIZE}
                    onPress={() => router.push(`/catalogo?category=${cat.slug}`)}
                  />
                </View>
              ))
            : Array.from({ length: 4 }).map((_, i) => (
                <View key={i} style={[styles.catGridItem, { width: CAT_CARD_SIZE }]}>
                  <CategoryCardSkeleton size={CAT_CARD_SIZE} />
                </View>
              ))}
        </View>
      </View>

      {/* Bestsellers */}
      <View style={styles.section}>
        <SectionHeader
          title={t.bestsellers}
          actionLabel={t.seeAll}
          onAction={() => router.push("/catalogo?bestseller=true")}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productsRow}>
          {isLoading
            ? [1, 2, 3].map((k) => <ProductCardSkeleton key={k} />)
            : featured?.bestsellers?.map((p: any) => (
                <ProductCard key={p.id} product={p} />
              ))}
        </ScrollView>
      </View>

      {/* New Arrivals (featured) */}
      <View style={styles.section}>
        <SectionHeader
          title={(t as any).newArrivals ?? t.featured}
          actionLabel={t.seeAll}
          onAction={() => router.push("/catalogo?featured=true")}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productsRow}>
          {isLoading
            ? [1, 2, 3].map((k) => <ProductCardSkeleton key={k} />)
            : featured?.featured?.map((p: any) => (
                <ProductCard key={p.id} product={p} />
              ))}
        </ScrollView>
      </View>

      {/* Footer Banner */}
      <View style={[styles.footerBanner, { backgroundColor: colors.primary }]}>
        <Icon name="package" size={28} color={colors.gold} />
        <View style={{ flex: 1 }}>
          <Text style={styles.footerBannerTitle}>{t.fastShipping}</Text>
          <Text style={styles.footerBannerSub}>{t.fastShippingSub}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroContainer: {
    marginHorizontal: 16,
    borderRadius: 24,
    marginBottom: 16,
    overflow: "hidden",
    minHeight: 200,
    justifyContent: "flex-end",
  },
  heroContent: {
    padding: 24,
    paddingTop: 40,
  },
  heroSmall: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    lineHeight: 38,
    marginBottom: 10,
  },
  heroSub: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    marginBottom: 18,
  },
  heroCta: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    minHeight: 44,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  heroCtaText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
  },
  langPill: {
    position: "absolute",
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.95)",
    minHeight: 36,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  langPillFlag: { fontSize: 16, lineHeight: 18 },
  langPillText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: "#002B7F",
    letterSpacing: 0.5,
  },
  langPillArrow: {
    fontSize: 12,
    color: "#C9A84C",
    fontFamily: "Inter_700Bold",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 24,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 50,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  seeAll: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  productsRow: {
    paddingHorizontal: 16,
    gap: 12,
  },
  catsRow: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 14,
  },
  catsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: CAT_GRID_HPAD,
    columnGap: CAT_GRID_GAP,
    rowGap: 18,
  },
  catGridItem: {
    alignItems: "center",
  },
  footerBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 20,
    borderRadius: 20,
  },
  footerBannerTitle: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  footerBannerSub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
    lineHeight: 18,
  },
});
