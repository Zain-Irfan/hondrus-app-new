import React, { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { Lang } from "@/utils/i18n";

const OPTIONS: { code: Lang; flag: string; label: string }[] = [
  { code: "es", flag: "🇭🇳", label: "Español" },
  { code: "en", flag: "🇺🇸", label: "English" },
];

type Variant = "default" | "onBrand";

interface Props {
  /** `onBrand` = light/gold pill for navy headers (Home). Default = soft brand chip. */
  variant?: Variant;
}

/**
 * Single language control for the whole app — Home, Catalog header, Account.
 */
export function LanguagePicker({ variant = "default" }: Props) {
  const colors = useColors();
  const { lang, setLang, t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const current = OPTIONS.find((o) => o.code === lang)!;
  const onBrand = variant === "onBrand";

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.trigger,
          onBrand
            ? {
                backgroundColor: "rgba(201,168,76,0.22)",
                borderColor: colors.gold,
              }
            : {
                backgroundColor: colors.v2.bg.accentSoft,
                borderColor: colors.gold,
              },
          { opacity: pressed ? 0.75 : 1 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={t.language ?? t.selectLanguage}
      >
        <Text style={styles.flag}>{current.flag}</Text>
        <Text
          style={[
            styles.triggerLabel,
            { color: onBrand ? "#FFFFFF" : colors.primary },
          ]}
        >
          {lang.toUpperCase()}
        </Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.surface,
                paddingBottom: insets.bottom + 24,
              },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.title, { color: colors.foreground }]}>
              {t.selectLanguage}
            </Text>
            {OPTIONS.map((opt) => {
              const selected = opt.code === lang;
              return (
                <Pressable
                  key={opt.code}
                  style={({ pressed }) => [
                    styles.option,
                    {
                      backgroundColor: selected ? colors.secondary : colors.canvas,
                      borderColor: selected ? colors.primary : colors.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                  onPress={() => {
                    setLang(opt.code);
                    setOpen(false);
                  }}
                >
                  <Text style={styles.optionFlag}>{opt.flag}</Text>
                  <Text
                    style={[
                      styles.optionLabel,
                      { color: selected ? colors.primary : colors.foreground },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {selected && (
                    <Text style={[styles.check, { color: colors.primary }]}>✓</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 32,
  },
  flag: { fontSize: 14, lineHeight: 16 },
  triggerLabel: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
    textAlign: "center",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  optionFlag: { fontSize: 28 },
  optionLabel: { flex: 1, fontSize: 17, fontFamily: "Inter_600SemiBold" },
  check: { fontSize: 20, fontFamily: "Inter_700Bold" },
});
