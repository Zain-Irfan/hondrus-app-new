import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { Icon } from "@/components/Icon";
import { useLanguage } from "@/context/LanguageContext";
import { CategoryPill } from "@/components/CategoryPill";
import { ProductCard } from "@/components/ProductCard";
import { ProductCardSkeleton } from "@/components/LoadingSkeleton";
import { useColors } from "@/hooks/useColors";

const RECENT_SEARCHES_KEY = "sabores_recent_searches";
const MAX_RECENT_SEARCHES = 6;
const POPULAR_SEARCHES = ["Café", "Baleadas", "Mantequilla", "Rosquillas", "Quesillo", "Salsa"];

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "/api";

async function fetchProducts(params: { category?: string; search?: string; featured?: boolean; bestseller?: boolean }) {
  const qs = new URLSearchParams();
  if (params.category) qs.set("category", params.category);
  if (params.search) qs.set("search", params.search);
  if (params.featured) qs.set("featured", "true");
  if (params.bestseller) qs.set("bestseller", "true");
  const res = await fetch(`${API_BASE}/products?${qs.toString()}`);
  if (!res.ok) throw new Error("Error al cargar productos");
  return res.json();
}

async function fetchCategories() {
  const res = await fetch(`${API_BASE}/categories`);
  if (!res.ok) throw new Error("Error al cargar categorías");
  return res.json();
}

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

export default function CatalogoScreen() {
  const colors = useColors();
  const { t } = useLanguage();
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const params = useLocalSearchParams<{ category?: string; search?: string; featured?: string; bestseller?: string }>();
  const [selectedCategory, setSelectedCategory] = useState(params.category ?? "");
  const [searchText, setSearchText] = useState(params.search ?? "");
  const [appliedSearch, setAppliedSearch] = useState(params.search ?? "");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    if (params.search) setAppliedSearch(params.search);
    if (params.category) setSelectedCategory(params.category);
  }, [params.search, params.category]);

  // Load recent searches from storage
  useEffect(() => {
    AsyncStorage.getItem(RECENT_SEARCHES_KEY)
      .then((raw) => {
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) setRecentSearches(parsed.slice(0, MAX_RECENT_SEARCHES));
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const persistRecent = useCallback(async (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    const next = [trimmed, ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(
      0,
      MAX_RECENT_SEARCHES,
    );
    setRecentSearches(next);
    try {
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
    } catch {}
  }, [recentSearches]);

  const submitSearch = (term: string) => {
    const trimmed = term.trim();
    setSearchText(trimmed);
    setAppliedSearch(trimmed);
    if (trimmed) void persistRecent(trimmed);
  };

  const clearRecent = async () => {
    setRecentSearches([]);
    try {
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {}
  };

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", selectedCategory, appliedSearch, params.featured, params.bestseller],
    queryFn: () =>
      fetchProducts({
        category: selectedCategory || undefined,
        search: appliedSearch || undefined,
        featured: params.featured === "true",
        bestseller: params.bestseller === "true",
      }),
  });

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

  const numColumns = windowWidth >= 768 ? 3 : 2;
  const HORIZONTAL_PADDING = 16 * 2;
  const GAP = 12 * (numColumns - 1);
  const cardWidth = Math.floor((windowWidth - HORIZONTAL_PADDING - GAP) / numColumns);

  const topPad = Platform.OS === "web" ? 67 + 16 : 16;
  const bottomPad = Platform.OS === "web" ? 84 + 34 : 120;

  const isFiltered = appliedSearch.length > 0 || selectedCategory !== "";

  const clearFilters = () => {
    setSearchText("");
    setAppliedSearch("");
    setSelectedCategory("");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search bar */}
      <View style={[styles.searchRow, { paddingTop: topPad }]}>
        <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Icon name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}
            placeholder={t.searchPlaceholderCatalog}
            placeholderTextColor={colors.mutedForeground}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={() => submitSearch(searchText)}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <Pressable
              onPress={() => { setSearchText(""); setAppliedSearch(""); }}
              accessibilityRole="button"
              accessibilityLabel={(t as any).clearSearch ?? "Clear search"}
              hitSlop={12}
              style={{ minWidth: 32, minHeight: 32, alignItems: "center", justifyContent: "center" }}
            >
              <Icon name="x" size={18} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Category pills */}
      <View style={[styles.pillsContainer, { borderBottomColor: colors.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsRow}
      >
        <CategoryPill
          label={t.catAll}
          selected={selectedCategory === ""}
          onPress={() => setSelectedCategory("")}
        />
        {categories?.map((cat: { id: number; slug: string; name: string }) => (
          <CategoryPill
            key={cat.id}
            label={CATEGORY_LABELS[cat.slug] ?? cat.name}
            selected={selectedCategory === cat.slug}
            onPress={() => setSelectedCategory(cat.slug)}
          />
        ))}
      </ScrollView>
      </View>

      {/* Product grid */}
      {isLoading ? (
        <View style={[styles.skeletonGrid, { paddingHorizontal: 16 }]}>
          {Array.from({ length: numColumns * 2 }).map((_, k) => (
            <View key={k} style={{ width: cardWidth }}>
              <ProductCardSkeleton />
            </View>
          ))}
        </View>
      ) : products?.length === 0 && isFiltered ? (
        <ScrollView contentContainerStyle={[styles.empty, { paddingBottom: bottomPad }]}>
          <View style={[styles.emptyIconWrap, { backgroundColor: colors.secondary }]}>
            <Text style={styles.emptyIconText}>🔍</Text>
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            {(t as any).noProductsFound ?? t.noResults}
          </Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            {t.noResultsFiltered(appliedSearch || CATEGORY_LABELS[selectedCategory] || selectedCategory)}
          </Text>
          <View style={styles.emptyActions}>
            <Pressable
              style={[styles.backBtn, { backgroundColor: colors.primary }]}
              onPress={clearFilters}
              accessibilityRole="button"
            >
              <Icon name="x" size={16} color="#fff" />
              <Text style={styles.backBtnText}>{t.clearCategories}</Text>
            </Pressable>
            <Pressable
              style={[styles.backBtnSecondary, { borderColor: colors.primary }]}
              onPress={() => router.push("/")}
              accessibilityRole="button"
            >
              <Icon name="home" size={16} color={colors.primary} />
              <Text style={[styles.backBtnSecondaryText, { color: colors.primary }]}>
                {(t as any).backToHome ?? "Back to Home"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      ) : !isFiltered && !appliedSearch && searchText.length === 0 && (!products || products.length === 0) ? (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: bottomPad, gap: 24 }}
        >
          {recentSearches.length > 0 && (
            <View>
              <View style={styles.suggestHeaderRow}>
                <Text style={[styles.suggestHeader, { color: colors.foreground }]}>
                  {(t as any).recentSearches ?? "Recent Searches"}
                </Text>
                <Pressable onPress={clearRecent} hitSlop={8} accessibilityRole="button">
                  <Text style={[styles.suggestClear, { color: colors.mutedForeground }]}>
                    {(t as any).clearAll ?? "Clear"}
                  </Text>
                </Pressable>
              </View>
              <View style={styles.chipsWrap}>
                {recentSearches.map((term) => (
                  <Pressable
                    key={`recent-${term}`}
                    onPress={() => submitSearch(term)}
                    style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}
                    accessibilityRole="button"
                    accessibilityLabel={term}
                  >
                    <Text style={[styles.chipIcon, { color: colors.mutedForeground }]}>↻</Text>
                    <Text style={[styles.chipText, { color: colors.foreground }]} numberOfLines={1}>
                      {term}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
          <View>
            <Text style={[styles.suggestHeader, { color: colors.foreground }]}>
              {(t as any).popularSearches ?? "Popular Searches"}
            </Text>
            <View style={[styles.chipsWrap, { marginTop: 12 }]}>
              {POPULAR_SEARCHES.map((term) => (
                <Pressable
                  key={`pop-${term}`}
                  onPress={() => submitSearch(term)}
                  style={[styles.chip, { backgroundColor: colors.secondary, borderColor: colors.gold }]}
                  accessibilityRole="button"
                  accessibilityLabel={term}
                >
                  <Text style={[styles.chipIcon, { color: colors.gold }]}>★</Text>
                  <Text style={[styles.chipText, { color: colors.primary }]} numberOfLines={1}>
                    {term}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          key={numColumns}
          data={products as Product[]}
          keyExtractor={(item) => item.id.toString()}
          numColumns={numColumns}
          contentContainerStyle={[styles.grid, { paddingBottom: bottomPad }]}
          columnWrapperStyle={numColumns > 1 ? [styles.row, { gap: 12 }] : undefined}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ProductCard product={item} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
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
  pillsContainer: {
    flexShrink: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  pillsRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
    gap: 8,
  },
  grid: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  row: {
    marginBottom: 12,
  },
  skeletonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingTop: 8,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingBottom: 80,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyIconText: {
    fontSize: 36,
    lineHeight: 44,
    textAlign: "center",
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  emptySub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 21,
  },
  emptyActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginTop: 8,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 50,
    minHeight: 48,
  },
  backBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  backBtnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 50,
    borderWidth: 1.5,
    minHeight: 48,
  },
  backBtnSecondaryText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  suggestHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  suggestHeader: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.2,
  },
  suggestClear: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 38,
  },
  chipIcon: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    maxWidth: 160,
  },
});
