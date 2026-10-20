import { useFocusEffect } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import React, { useCallback } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fonts } from "@/constants/fonts";
import { useColors } from "@/hooks/useColors";

interface SearchProps {
  value: string;
  onChangeText: (v: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  onClear?: () => void;
  inputRef?: React.RefObject<TextInput | null>;
  clearLabel?: string;
}

interface Props {
  /** Row above the search: plain title (with optional back) … */
  title?: string;
  onBack?: () => void;
  backLabel?: string;
  /** … or a custom leading node (e.g. brand lockup) instead of the title. */
  leading?: React.ReactNode;
  /** Right side of the title row (e.g. language picker). */
  right?: React.ReactNode;
  search: SearchProps;
  /** Optional control rendered beside the search pill (e.g. filter button). */
  searchRight?: React.ReactNode;
}

/**
 * Solid brand header: navy bar, safe-area aware, with a white pill search
 * inside it. Shared by Home and Categories so the top of the app is one thing.
 */
export function AppHeader({ title, onBack, backLabel, leading, right, search, searchRight }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 12 : insets.top + 6;
  const hasTitleRow = !!(title || leading || right || onBack);

  // Light status-bar icons over the navy bar; back to dark when leaving the screen.
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle("light");
      return () => setStatusBarStyle("dark");
    }, []),
  );

  return (
    <View style={[styles.bar, { backgroundColor: colors.primary, paddingTop: topPad }]}>
      {hasTitleRow && (
        <View style={styles.titleRow}>
          {onBack && (
            <Pressable
              onPress={onBack}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={backLabel ?? "Back"}
              style={styles.backBtn}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
            </Pressable>
          )}
          {leading ?? (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          )}
          <View style={{ flex: 1 }} />
          {right}
        </View>
      )}

      <View style={styles.searchRow}>
        <Pressable
          onPress={() => search.inputRef?.current?.focus()}
          style={[styles.search, { backgroundColor: colors.surface }]}
        >
          <MaterialCommunityIcons name="magnify" size={22} color={colors.mutedForeground} />
          <TextInput
            ref={search.inputRef as any}
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder={search.placeholder}
            placeholderTextColor={colors.v2.text.tertiary}
            value={search.value}
            onChangeText={search.onChangeText}
            onSubmitEditing={search.onSubmit}
            returnKeyType="search"
          />
          {search.value.length > 0 && (
            <Pressable
              onPress={search.onClear ?? (() => search.onChangeText(""))}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={search.clearLabel ?? "Clear search"}
            >
              <MaterialCommunityIcons name="close-circle" size={18} color={colors.v2.text.tertiary} />
            </Pressable>
          )}
        </Pressable>
        {searchRight}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 32,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -6,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 20,
    fontFamily: fonts.display,
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  search: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 50,
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.regular,
    padding: 0,
  },
});
