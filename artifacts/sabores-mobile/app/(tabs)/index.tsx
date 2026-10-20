import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { AppHeader } from "@/components/AppHeader";
import { BrandLockup } from "@/components/BrandLogo";
import { FreeShippingProgress } from "@/components/FreeShippingProgress";
import { LanguagePicker } from "@/components/LanguagePicker";
import { ProductCardSkeleton } from "@/components/LoadingSkeleton";
import { ProductCard } from "@/components/ProductCard";
import { ReorderStrip } from "@/components/ReorderStrip";
import { SectionHeader } from "@/components/SectionHeader";
import { fonts } from "@/constants/fonts";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { useOrders } from "@/hooks/useOrders";
import { useShippingConfig } from "@/hooks/useShippingConfig";

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

type Product = {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  isBestseller: boolean;
  inStock: boolean;
  origin?: string;
};

type Category = { id: number; slug: string; name: string; imageUrl: string };

const PAD = 20;
const GAP = 12;
const CAROUSEL_CARD_W = 160;

export default function HomeScreen() {
  const colors = useColors();
  const { t } = useLanguage();
  const router = useRouter();
  const { width: W } = useWindowDimensions();
  const [search, setSearch] = useState("");
  const searchRef = useRef<TextInput>(null);

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

  const { data: featured, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["featured"],
    queryFn: fetchFeatured,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const { data: ordersData } = useOrders();
  const lastOrder = ordersData?.[0];
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

  const bottomPad = Platform.OS === "web" ? 84 + 34 : 120;

  const bestsellers: Product[] = (featured?.bestsellers ?? []).slice(0, 8);
  const bestsellerIds = new Set(bestsellers.map((p) => p.id));
  const arrivalsSource: Product[] = featured?.newArrivals ?? featured?.featured ?? [];
  const arrivals = arrivalsSource.filter((p) => !bestsellerIds.has(p.id)).slice(0, 6);
  const cats: Category[] = categories ?? [];
  const bannerProduct = bestsellers[0];

  const contentW = W - PAD * 2;
  const gridCardW = Math.floor((contentW - GAP) / 2);

  const heroTitle = (t as any).heroTitleV2 ?? t.heroTitle;
  const heroSub = (t as any).heroSubV2 ?? t.heroSub;

  const { freeShippingThreshold } = useShippingConfig();
  const shipThreshold = String(freeShippingThreshold || (t as any).freeShippingThreshold || 75);
  const trustRows = [
    {
      icon: "truck-outline" as const,
      title: (t as any).trustFreeShipping ?? "Free shipping",
      sub: (t as any).trustFreeShippingSub?.(shipThreshold) ?? `on orders of $${shipThreshold}+`,
    },
    {
      icon: "package-variant-closed" as const,
      title: (t as any).trustTracking ?? "UPS & FedEx tracking",
      sub: (t as any).trustTrackingSub ?? "on every order",
    },
    {
      icon: "shield-check-outline" as const,
      title: (t as any).trustSecure ?? "Secure checkout",
      sub: (t as any).trustSecureSub ?? "powered by Stripe",
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.canvas }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Brand header: navy bar with white search ── */}
        <AppHeader
          leading={
            <BrandLockup size={40} tagline={(t as any).brandTagline ?? "Honduran grocery · US delivery"} />
          }
          right={<LanguagePicker variant="onBrand" />}
          search={{
            value: search,
            onChangeText: setSearch,
            onSubmit: handleSearch,
            onClear: () => setSearch(""),
            placeholder: t.searchPlaceholderHome,
            inputRef: searchRef,
          }}
        />

        {/* White info strip under the header (free-shipping status) */}
        <FreeShippingProgress />

        {/* ── Categories: rounded image tiles, horizontal scroll ── */}
        <View style={styles.catSection}>
          <SectionHeader
            title={(t as any).shopByCategory ?? t.categories}
            actionLabel={t.seeAll}
            onAction={() => router.push("/catalogo")}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catRow}
          >
            {(cats.length ? cats : Array.from({ length: 6 }).map((_, i) => ({ id: -i - 1 }) as Category)).map(
              (cat) => (
                <Pressable
                  key={cat.id}
                  disabled={cat.id < 0}
                  onPress={() => router.push(`/catalogo?category=${cat.slug}`)}
                  accessibilityRole="button"
                  accessibilityLabel={cat.slug ? CATEGORY_LABELS[cat.slug] ?? cat.name : undefined}
                  style={({ pressed }) => [styles.catItem, { opacity: pressed ? 0.7 : 1 }]}
                >
                  <View style={[styles.catTile, { backgroundColor: colors.v2.bg.accentSoft }]}>
                    {cat.imageUrl ? (
                      <Image source={{ uri: cat.imageUrl }} style={styles.fill} resizeMode="cover" />
                    ) : null}
                  </View>
                  <Text style={[styles.catLabel, { color: colors.foreground }]} numberOfLines={2}>
                    {cat.slug ? CATEGORY_LABELS[cat.slug] ?? cat.name : " "}
                  </Text>
                </Pressable>
              ),
            )}
          </ScrollView>
        </View>

        {/* ── Promo banner: navy card, headline + CTA, product on the right ── */}
        <Pressable
          onPress={() => router.push("/catalogo")}
          accessibilityRole="button"
          accessibilityLabel={`${heroTitle.replace("\n", " ")} ${t.shopNow}`}
          style={({ pressed }) => [
            styles.banner,
            { backgroundColor: colors.primary, opacity: pressed ? 0.95 : 1 },
          ]}
        >
          <View pointerEvents="none" style={styles.bannerRing} />
          <View style={styles.bannerCopy}>
            <Text style={[styles.bannerKicker, { color: colors.gold }]}>HN GROCERS</Text>
            <Text style={styles.bannerTitle} numberOfLines={3}>
              {heroTitle.replace("\n", " ")}
            </Text>
            <Text style={styles.bannerSub} numberOfLines={2}>
              {heroSub}
            </Text>
            <View style={[styles.bannerBtn, { backgroundColor: colors.gold }]}>
              <Text style={[styles.bannerBtnText, { color: colors.primary }]}>{t.shopNow}</Text>
              <MaterialCommunityIcons name="arrow-right" size={16} color={colors.primary} />
            </View>
          </View>
          <View style={styles.bannerArt}>
            {bannerProduct?.imageUrl ? (
              <Image source={{ uri: bannerProduct.imageUrl }} style={styles.bannerImg} resizeMode="cover" />
            ) : (
              <View style={[styles.bannerImg, { backgroundColor: "rgba(255,255,255,0.08)" }]} />
            )}
          </View>
        </Pressable>

        {lastOrder && (
          <ReorderStrip
            summary={reorderSummary}
            onPress={() => router.push("/(tabs)/mis-pedidos")}
          />
        )}

        {/* ── Bestsellers: horizontal carousel of product cards ── */}
        <View style={styles.section}>
          <SectionHeader
            title={t.bestsellers}
            actionLabel={t.seeAll}
            onAction={() => router.push("/catalogo?bestseller=true")}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carousel}
          >
            {isLoading
              ? [1, 2, 3].map((k) => (
                  <View key={k} style={{ width: CAROUSEL_CARD_W }}>
                    <ProductCardSkeleton />
                  </View>
                ))
              : bestsellers.map((p) => (
                  <ProductCard key={p.id} product={p as any} cardWidth={CAROUSEL_CARD_W} />
                ))}
          </ScrollView>
        </View>

        {/* ── New arrivals: 2-column grid ── */}
        {(arrivals.length > 0 || isLoading) && (
          <View style={styles.section}>
            <SectionHeader
              title={(t as any).newArrivals ?? t.featured}
              actionLabel={t.seeAll}
              onAction={() => router.push("/catalogo?featured=true")}
            />
            <View style={styles.grid}>
              {isLoading
                ? [1, 2].map((k) => (
                    <View key={k} style={{ width: gridCardW }}>
                      <ProductCardSkeleton />
                    </View>
                  ))
                : arrivals.map((p) => (
                    <ProductCard key={p.id} product={p as any} cardWidth={gridCardW} />
                  ))}
            </View>
          </View>
        )}

        {/* ── Trust: shipping, tracking, payment ── */}
        <View style={[styles.trust, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {trustRows.map((row, i) => (
            <View
              key={row.icon}
              style={[
                styles.trustRow,
                i < trustRows.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.v2.bg.muted },
              ]}
            >
              <MaterialCommunityIcons name={row.icon} size={22} color={colors.primary} />
              <Text style={[styles.trustText, { color: colors.mutedForeground }]}>
                <Text style={[styles.trustTitle, { color: colors.foreground }]}>{row.title}</Text> {row.sub}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { width: "100%", height: "100%" },

  catSection: { paddingTop: 22 },
  catRow: {
    paddingHorizontal: PAD,
    paddingBottom: 4,
    gap: 14,
  },
  catItem: { width: 72, alignItems: "center", gap: 8 },
  catTile: {
    width: 68,
    height: 68,
    borderRadius: 22,
    overflow: "hidden",
  },
  catLabel: {
    fontSize: 12,
    lineHeight: 15,
    fontFamily: fonts.semibold,
    textAlign: "center",
  },

  banner: {
    flexDirection: "row",
    marginHorizontal: PAD,
    marginTop: 22,
    borderRadius: 22,
    overflow: "hidden",
    minHeight: 196,
  },
  bannerRing: {
    position: "absolute",
    right: -40,
    top: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 28,
    borderColor: "rgba(201,168,76,0.18)",
  },
  bannerCopy: { flex: 1, justifyContent: "center", gap: 8, paddingVertical: 22, paddingLeft: 22, paddingRight: 14 },
  bannerKicker: { fontSize: 11, fontFamily: fonts.bold, letterSpacing: 1.5 },
  bannerTitle: {
    color: "#FFFFFF",
    fontSize: 25,
    lineHeight: 28,
    fontFamily: fonts.display,
    letterSpacing: -0.4,
  },
  bannerSub: {
    color: "#C3CEE6",
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.regular,
  },
  bannerBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    marginTop: 6,
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 20,
  },
  bannerBtnText: { fontSize: 14, fontFamily: fonts.bold },
  bannerArt: { width: 128, paddingVertical: 18, paddingRight: 18, justifyContent: "flex-end" },
  bannerImg: {
    width: 110,
    height: 150,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.12)",
  },

  section: { marginTop: 26 },
  carousel: { paddingHorizontal: PAD, gap: GAP },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: PAD,
    gap: GAP,
  },

  trust: {
    marginHorizontal: PAD,
    marginTop: 26,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
  },
  trustRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  trustText: { flex: 1, fontSize: 14, fontFamily: fonts.regular },
  trustTitle: { fontFamily: fonts.bold },
});
