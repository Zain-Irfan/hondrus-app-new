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

export function LanguagePicker() {
  const colors = useColors();
  const { lang, setLang, t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const current = OPTIONS.find((o) => o.code === lang)!;

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.trigger,
          { backgroundColor: colors.secondary, opacity: pressed ? 0.7 : 1 },
        ]}
        accessibilityLabel={t.language}
      >
        <Text style={styles.flag}>{current.flag}</Text>
        <Text style={[styles.triggerLabel, { color: colors.primary }]}>
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
                backgroundColor: colors.background,
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
                      backgroundColor: selected ? colors.secondary : colors.card,
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
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginLeft: 8,
  },
  flag: { fontSize: 16 },
  triggerLabel: { fontSize: 12, fontFamily: "Inter_700Bold" },
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
