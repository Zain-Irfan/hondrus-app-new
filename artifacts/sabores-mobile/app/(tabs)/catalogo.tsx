import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
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

import { AppHeader } from "@/components/AppHeader";
import { LanguagePicker } from "@/components/LanguagePicker";
import { useLanguage } from "@/context/LanguageContext";
import { CategoryPill } from "@/components/CategoryPill";
import { ProductCard } from "@/components/ProductCard";
import { ProductCardSkeleton } from "@/components/LoadingSkeleton";
import {
  FilterSheet,
  type FilterValue,
  DEFAULT_FILTERS,
  applyFilters,
  countActiveFilters,
} from "@/components/FilterSheet";
import { fonts } from "@/constants/fonts";
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

interface Category {
  id: number;
  slug: string;
  name: string;
  imageUrl?: string;
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
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterValue>(DEFAULT_FILTERS);
  // "All" chip → show every product instead of the category grid
  const [showAll, setShowAll] = useState(false);
  const activeFilterCount = countActiveFilters(filters);

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

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const wantsFeatured = params.featured === "true";
  const wantsBestseller = params.bestseller === "true";

  // Browse mode = the category grid. Any category / search / special list → product mode.
  const isBrowse =
    !selectedCategory && !appliedSearch && !wantsFeatured && !wantsBestseller && !showAll;

  const {
    data: products,
    isLoading: productsLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["products", selectedCategory, appliedSearch, params.featured, params.bestseller],
    queryFn: () =>
      fetchProducts({
        category: selectedCategory || undefined,
        search: appliedSearch || undefined,
        featured: wantsFeatured,
        bestseller: wantsBestseller,
      }),
    enabled: !isBrowse,
  });
  const isLoading = !isBrowse && productsLoading;

  // Filter sheet selections (region, in stock, sort) applied on the loaded list
  const visibleProducts = useMemo(
    () => applyFilters((products as Product[] | undefined) ?? [], filters),
    [products, filters],
  );

  const goBrowse = () => {
    setSelectedCategory("");
    setSearchText("");
    setAppliedSearch("");
    setShowAll(false);
    router.setParams({ category: "", search: "", featured: "", bestseller: "" });
  };

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
  const HORIZONTAL_PADDING = 20 * 2;
  const GAP = 12 * (numColumns - 1);
  const cardWidth = Math.floor((windowWidth - HORIZONTAL_PADDING - GAP) / numColumns);

  const bottomPad = Platform.OS === "web" ? 84 + 34 : 120;

  const isFiltered = appliedSearch.length > 0 || selectedCategory !== "";

  const clearFilters = () => {
    setSearchText("");
    setAppliedSearch("");
    setSelectedCategory("");
    setFilters(DEFAULT_FILTERS);
  };

  const headerTitle = isBrowse
    ? t.categories
    : selectedCategory
      ? CATEGORY_LABELS[selectedCategory] ?? selectedCategory
      : appliedSearch
        ? `"${appliedSearch}"`
        : wantsBestseller
          ? t.bestsellers
          : wantsFeatured
            ? ((t as any).newArrivals ?? t.featured)
            : ((t as any).allProducts ?? t.catAll);

  const filterButton = (
    <Pressable
      onPress={() => setFilterOpen(true)}
      accessibilityRole="button"
      accessibilityLabel={(t as any).filtersTitle ?? "Filters"}
      style={({ pressed }) => [
        styles.filterIconBtn,
        { backgroundColor: activeFilterCount > 0 ? colors.gold : colors.surface, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <MaterialCommunityIcons name="tune-variant" size={22} color={colors.primary} />
      {activeFilterCount > 0 && (
        <View style={[styles.filterBadge, { backgroundColor: colors.primary, borderColor: colors.gold }]}>
          <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
        </View>
      )}
    </Pressable>
  );

  const catList: Category[] = categories ?? [];

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <AppHeader
        title={headerTitle}
        onBack={isBrowse ? undefined : goBrowse}
        backLabel={t.categories}
        right={<LanguagePicker variant="onBrand" />}
        search={{
          value: searchText,
          onChangeText: setSearchText,
          onSubmit: () => submitSearch(searchText),
          onClear: () => { setSearchText(""); setAppliedSearch(""); },
          placeholder: t.searchPlaceholderCatalog,
          clearLabel: (t as any).clearSearch ?? "Clear search",
        }}
        searchRight={isBrowse ? undefined : filterButton}
      />

      {/* ── Browse mode: every category as a large tile ── */}
      {isBrowse ? (
        <FlatList
          key={`cats-${numColumns}`}
          data={
            categoriesLoading && catList.length === 0
              ? (Array.from({ length: 6 }).map((_, i) => ({ id: -i - 1, slug: "", name: "" })) as Category[])
              : catList
          }
          keyExtractor={(c) => c.id.toString()}
          numColumns={numColumns}
          contentContainerStyle={[styles.catGrid, { paddingBottom: bottomPad }]}
          columnWrapperStyle={numColumns > 1 ? { gap: 12 } : undefined}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: cat }) => (
            <Pressable
              disabled={cat.id < 0}
              onPress={() => setSelectedCategory(cat.slug)}
              accessibilityRole="button"
              accessibilityLabel={CATEGORY_LABELS[cat.slug] ?? cat.name}
              style={({ pressed }) => [
                styles.catTile,
                {
                  width: cardWidth,
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <View
                style={[
                  styles.catTileImage,
                  // Landscape photo so ~6 categories fit on one screen
                  { height: Math.round((cardWidth - 16) * 0.62), backgroundColor: colors.v2.bg.accentSoft },
                ]}
              >
                {cat.imageUrl ? (
                  <Image source={{ uri: cat.imageUrl }} style={styles.fill} resizeMode="cover" />
                ) : null}
              </View>
              <View style={styles.catTileFooter}>
                <Text style={[styles.catTileLabel, { color: colors.foreground }]} numberOfLines={1}>
                  {cat.id < 0 ? " " : CATEGORY_LABELS[cat.slug] ?? cat.name}
                </Text>
                {cat.id >= 0 && (
                  <MaterialCommunityIcons name="chevron-right" size={20} color={colors.mutedForeground} />
                )}
              </View>
            </Pressable>
          )}
          ListFooterComponent={
            <View style={styles.suggestBlock}>
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
                        style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        accessibilityRole="button"
                        accessibilityLabel={term}
                      >
                        <MaterialCommunityIcons name="history" size={16} color={colors.mutedForeground} />
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
                      style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      accessibilityRole="button"
                      accessibilityLabel={term}
                    >
                      <Text style={[styles.chipText, { color: colors.foreground }]} numberOfLines={1}>
                        {term}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          }
        />
      ) : (
      <>
      {/* Category chips — quick hop between categories while in product mode */}
      <View style={[styles.pillsContainer, { backgroundColor: colors.canvas }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsRow}
      >
        <CategoryPill
          label={t.catAll}
          selected={selectedCategory === "" && !appliedSearch}
          onPress={() => { setSelectedCategory(""); setShowAll(true); }}
        />
        {catList.map((cat) => (
          <CategoryPill
            key={cat.id}
            label={CATEGORY_LABELS[cat.slug] ?? cat.name}
            selected={selectedCategory === cat.slug}
            onPress={() => setSelectedCategory(cat.slug)}
          />
        ))}
      </ScrollView>
      </View>

      {/* Sort row */}
      {!isLoading && products && products.length > 0 && (
        <View style={styles.resultRow}>
          <Text style={[styles.resultCount, { color: colors.mutedForeground }]}>
            {(t as any).productsCount?.(visibleProducts.length) ?? String(visibleProducts.length)}
          </Text>
          <Pressable
            onPress={() => setFilterOpen(true)}
            hitSlop={8}
            accessibilityRole="button"
            style={({ pressed }) => [styles.resultSortBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={[styles.resultSort, { color: colors.foreground }]}>
              {filters.sort === "recommended"
                ? (t as any).sortRecommended ?? "Recommended"
                : filters.sort === "newest"
                ? (t as any).sortNewest ?? "Newest"
                : filters.sort === "price-asc"
                ? (t as any).sortPriceLowHigh ?? "Price: low to high"
                : filters.sort === "price-desc"
                ? (t as any).sortPriceHighLow ?? "Price: high to low"
                : (t as any).sortRating ?? "Top rated"}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={18} color={colors.foreground} />
          </Pressable>
        </View>
      )}

      <FilterSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        value={filters}
        onApply={(next) => {
          setFilters(next);
          setFilterOpen(false);
        }}
        resultCount={visibleProducts.length}
        countFor={(draft) => applyFilters((products as Product[] | undefined) ?? [], draft).length}
      />

      {/* Product grid */}
      {isError ? (
        <View style={[styles.empty, { paddingBottom: bottomPad }]}>
          <View style={[styles.emptyIconWrap, { backgroundColor: colors.secondary }]}>
            <MaterialCommunityIcons name="alert-circle-outline" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            {(t as any).loadErrorTitle ?? "Couldn't load products"}
          </Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            {(t as any).loadErrorSub ?? "Check your connection and try again."}
          </Text>
          <Pressable
            style={[styles.backBtn, { backgroundColor: colors.primary }]}
            onPress={() => refetch()}
            disabled={isRefetching}
          >
            <Text style={styles.backBtnText}>
              {isRefetching ? (t.loading ?? "Loading...") : ((t as any).retry ?? "Retry")}
            </Text>
          </Pressable>
        </View>
      ) : isLoading ? (
        <View style={[styles.skeletonGrid, { paddingHorizontal: 20 }]}>
          {Array.from({ length: numColumns * 2 }).map((_, k) => (
            <View key={k} style={{ width: cardWidth }}>
              <ProductCardSkeleton />
            </View>
          ))}
        </View>
      ) : visibleProducts.length === 0 && (isFiltered || activeFilterCount > 0) ? (
        <ScrollView contentContainerStyle={[styles.empty, { paddingBottom: bottomPad }]}>
          <View style={[styles.emptyIconWrap, { backgroundColor: colors.secondary }]}>
            <MaterialCommunityIcons name="magnify" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            {(t as any).noProductsFound ?? t.noResults}
          </Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            {activeFilterCount > 0 && !appliedSearch
              ? (t as any).filtersNoMatch ?? "No products match these filters."
              : t.noResultsFiltered(appliedSearch || CATEGORY_LABELS[selectedCategory] || selectedCategory)}
          </Text>
          <View style={styles.emptyActions}>
            <Pressable
              style={[styles.backBtn, { backgroundColor: colors.primary }]}
              // Filters caused the empty list → clear just the filters, keep the category
              onPress={activeFilterCount > 0 ? () => setFilters(DEFAULT_FILTERS) : clearFilters}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="close" size={18} color="#fff" />
              <Text style={styles.backBtnText}>
                {activeFilterCount > 0 ? (t as any).filterClearAll ?? "Clear all" : t.clearCategories}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.backBtnSecondary, { borderColor: colors.primary }]}
              onPress={() => router.push("/")}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="home-outline" size={18} color={colors.primary} />
              <Text style={[styles.backBtnSecondaryText, { color: colors.primary }]}>
                {(t as any).backToHome ?? "Back to Home"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          key={numColumns}
          data={visibleProducts}
          keyExtractor={(item) => item.id.toString()}
          numColumns={numColumns}
          contentContainerStyle={[styles.grid, { paddingBottom: bottomPad }]}
          columnWrapperStyle={numColumns > 1 ? [styles.row, { gap: 12 }] : undefined}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ProductCard product={item} cardWidth={cardWidth} />
          )}
        />
      )}
      </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fill: { width: "100%", height: "100%" },
  filterIconBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  // Category grid (browse mode)
  catGrid: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  catTile: { padding: 8, gap: 10, borderRadius: 18, borderWidth: 1 },
  catTileImage: { width: "100%", borderRadius: 12, overflow: "hidden" },
  catTileFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
    paddingLeft: 4,
    paddingBottom: 4,
  },
  catTileLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.semibold,
  },
  suggestBlock: { paddingTop: 16, gap: 24 },
  pillsContainer: {
    flexShrink: 0,
    marginBottom: 4,
  },
  pillsRow: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
    alignItems: "center",
    gap: 8,
  },
  grid: {
    paddingHorizontal: 20,
    paddingTop: 4,
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
  emptyTitle: {
    fontSize: 22,
    fontFamily: fonts.display,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 14,
    fontFamily: fonts.regular,
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
    borderRadius: 14,
    minHeight: 48,
  },
  backBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: fonts.semibold,
  },
  backBtnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    minHeight: 48,
  },
  backBtnSecondaryText: {
    fontSize: 15,
    fontFamily: fonts.semibold,
  },
  suggestHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  suggestHeader: {
    fontSize: 18,
    fontFamily: fonts.display,
  },
  suggestClear: {
    fontSize: 13,
    fontFamily: fonts.semibold,
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
  chipText: {
    fontSize: 13,
    fontFamily: fonts.semibold,
    maxWidth: 160,
  },
  filterBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: fonts.bold,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  resultCount: {
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  resultSortBtn: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 32 },
  resultSort: {
    fontSize: 14,
    fontFamily: fonts.semibold,
  },
});
