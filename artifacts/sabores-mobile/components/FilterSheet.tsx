import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Icon } from "@/components/Icon";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

/**
 * FilterSheet — bottom sheet for catalog filtering.
 * New in Phase 1.5; designed in mockup #03.
 *
 * Usage:
 *   const [open, setOpen] = useState(false);
 *   <FilterSheet
 *     visible={open}
 *     onClose={() => setOpen(false)}
 *     value={filters}
 *     onApply={(next) => { setFilters(next); setOpen(false); }}
 *     resultCount={products?.length ?? 0}
 *   />
 */

export interface FilterValue {
  sort: "recommended" | "newest" | "price-asc" | "price-desc" | "rating";
  region: string;       // "" = all
  dietary: string[];    // ["sin-gluten", "organico", …]
  priceMin?: number;
  priceMax?: number;
  inStockOnly: boolean;
  freeShipping: boolean;
}

export const DEFAULT_FILTERS: FilterValue = {
  sort: "recommended",
  region: "",
  dietary: [],
  inStockOnly: false,
  freeShipping: false,
};

interface Props {
  visible: boolean;
  onClose: () => void;
  value: FilterValue;
  onApply: (next: FilterValue) => void;
  resultCount: number;
}

const REGIONS = [
  { id: "", label: "Todas" },
  { id: "olancho", label: "Olancho" },
  { id: "marcala", label: "Marcala" },
  { id: "comayagua", label: "Comayagua" },
  { id: "copan", label: "Copán" },
];

const DIETARY = [
  { id: "sin-gluten", label: "Sin gluten" },
  { id: "sin-lactosa", label: "Sin lactosa" },
  { id: "vegetariano", label: "Vegetariano" },
  { id: "organico", label: "Orgánico" },
  { id: "artesanal", label: "Artesanal" },
];

export function FilterSheet({ visible, onClose, value, onApply, resultCount }: Props) {
  const colors = useColors();
  const { t } = useLanguage();
  const [draft, setDraft] = React.useState<FilterValue>(value);
  const slide = useRef(new Animated.Value(0)).current;

  // sync draft when sheet opens
  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible, slide]);

  const sortOptions: { id: FilterValue["sort"]; label: string }[] = [
    { id: "recommended", label: (t as any).sortRecommended ?? "Recomendados" },
    { id: "newest", label: (t as any).sortNewest ?? "Más recientes" },
    { id: "price-asc", label: (t as any).sortPriceLowHigh ?? "Precio: ↑" },
    { id: "price-desc", label: (t as any).sortPriceHighLow ?? "Precio: ↓" },
    { id: "rating", label: (t as any).sortRating ?? "Mejor calificados" },
  ];

  const toggleDietary = (id: string) => {
    Haptics.selectionAsync();
    setDraft((p) => ({
      ...p,
      dietary: p.dietary.includes(id)
        ? p.dietary.filter((x) => x !== id)
        : [...p.dietary, id],
    }));
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDraft(DEFAULT_FILTERS);
  };

  const handleApply = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onApply(draft);
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [600, 0] }) }],
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {(t as any).filtersTitle ?? "Filtros"}
            </Text>
            <Pressable onPress={handleClear} hitSlop={8}>
              <Text style={[styles.clearLink, { color: colors.primary }]}>
                {(t as any).filterClearAll ?? "Limpiar todo"}
              </Text>
            </Pressable>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 20 }}>
            {/* Sort */}
            <Section title={(t as any).sortBy ?? "Ordenar por"} colors={colors}>
              <View style={styles.optionsWrap}>
                {sortOptions.map((opt) => (
                  <ChipOption
                    key={opt.id}
                    label={opt.label}
                    active={draft.sort === opt.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setDraft((p) => ({ ...p, sort: opt.id }));
                    }}
                    colors={colors}
                  />
                ))}
              </View>
            </Section>

            {/* Region */}
            <Section title={(t as any).filterRegion ?? "Región"} colors={colors}>
              <View style={styles.optionsWrap}>
                {REGIONS.map((r) => (
                  <ChipOption
                    key={r.id}
                    label={r.label}
                    active={draft.region === r.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setDraft((p) => ({ ...p, region: r.id }));
                    }}
                    colors={colors}
                  />
                ))}
              </View>
            </Section>

            {/* Dietary */}
            <Section title={(t as any).filterDietary ?? "Tipo"} colors={colors}>
              <View style={styles.optionsWrap}>
                {DIETARY.map((d) => (
                  <ChipOption
                    key={d.id}
                    label={d.label}
                    active={draft.dietary.includes(d.id)}
                    onPress={() => toggleDietary(d.id)}
                    colors={colors}
                  />
                ))}
              </View>
            </Section>

            {/* Toggles */}
            <Section title=" " colors={colors}>
              <ToggleRow
                label={(t as any).filterInStock ?? "Solo disponibles"}
                value={draft.inStockOnly}
                onChange={(v) => setDraft((p) => ({ ...p, inStockOnly: v }))}
                colors={colors}
              />
              <ToggleRow
                label={(t as any).filterFreeShipping ?? "Envío gratis"}
                value={draft.freeShipping}
                onChange={(v) => setDraft((p) => ({ ...p, freeShipping: v }))}
                colors={colors}
              />
            </Section>
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Pressable
              onPress={onClose}
              style={[styles.cancelBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.cancelText, { color: colors.foreground }]}>
                {(t as any).filterCancel ?? "Cancelar"}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleApply}
              style={[styles.applyBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.applyText}>
                {typeof (t as any).filterApplyN === "function"
                  ? (t as any).filterApplyN(resultCount)
                  : `Mostrar ${resultCount} productos`}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

function Section({
  title,
  colors,
  children,
}: {
  title: string;
  colors: ReturnType<typeof useColors>;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title.trim() ? title : ""}</Text>
      {children}
    </View>
  );
}

function ChipOption({
  label,
  active,
  onPress,
  colors,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.secondary : colors.card,
          borderColor: active ? colors.primary : colors.border,
          borderWidth: active ? 1.5 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          {
            color: active ? colors.primary : colors.foreground,
            fontFamily: active ? "Inter_700Bold" : "Inter_500Medium",
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
  colors,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable
      style={[styles.toggleRow, { borderTopColor: colors.border }]}
      onPress={() => {
        Haptics.selectionAsync();
        onChange(!value);
      }}
    >
      <Text style={[styles.toggleLabel, { color: colors.foreground }]}>{label}</Text>
      <View
        style={[
          styles.track,
          { backgroundColor: value ? colors.primary : colors.border },
        ]}
      >
        <View
          style={[
            styles.thumb,
            { right: value ? 2 : undefined, left: value ? undefined : 2 },
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(10,13,20,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingBottom: 28,
    maxHeight: "88%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    alignSelf: "center",
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  clearLink: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  optionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 13,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  toggleLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  track: {
    width: 40,
    height: 24,
    borderRadius: 999,
    position: "relative",
  },
  thumb: {
    position: "absolute",
    top: 2,
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  applyBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
  },
  applyText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
});
