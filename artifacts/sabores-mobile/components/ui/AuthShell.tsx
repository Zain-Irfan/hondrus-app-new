import { router } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import React, { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { BrandMark } from "@/components/BrandLogo";
import { fonts } from "@/constants/fonts";
import { useColors } from "@/hooks/useColors";

interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  testID?: string;
}

/**
 * Shared frame for sign-in, sign-up and forgot-password:
 * navy header (close · brand mark · title) over a white rounded sheet holding the form.
 */
export function AuthShell({ title, subtitle, children, testID }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  // Light status-bar icons over the navy header
  useEffect(() => {
    setStatusBarStyle("light");
    return () => setStatusBarStyle("dark");
  }, []);

  return (
    // Keyboard handled by react-native-keyboard-controller (KeyboardProvider at the root).
    // RN's own KeyboardAvoidingView fought with it on Android: the keyboard opened, the
    // layout resized, the field lost focus and the keyboard closed again. The library's
    // KeyboardAvoidingView works with it. (Its KeyboardAwareScrollView needs a native view
    // that Expo Go's build doesn't include, so don't swap to that.)
    <KeyboardAvoidingView
      behavior="padding"
      style={{ flex: 1, backgroundColor: colors.primary }}
      testID={testID}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 12 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical={false}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.closeBtn, { opacity: pressed ? 0.7 : 1 }]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <MaterialCommunityIcons name="close" size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={styles.brandMark}>
            <BrandMark size={56} />
          </View>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
        </View>

        <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 40 }]}>
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 28,
    gap: 6,
  },
  brandMark: {
    marginBottom: 12,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 32,
    lineHeight: 36,
    fontFamily: fonts.display,
    letterSpacing: -0.4,
  },
  sub: {
    color: "#C3CEE6",
    fontSize: 15,
    fontFamily: fonts.regular,
    lineHeight: 22,
  },
  sheet: {
    flexGrow: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    gap: 14,
  },
});
