import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs, Badge } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AnimatedTabButton } from "@/components/AnimatedTabButton";
import { CategoriesIcon } from "@/components/CategoriesIcon";
import { HomeIcon } from "@/components/HomeIcon";
import { Icon as AppIcon } from "@/components/Icon";
import { CartIcon } from "@/components/SvgIcons";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

function NativeTabLayout() {
  const { itemCount } = useCart();
  const { t } = useLanguage();
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>{t.tabHome}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="catalogo">
        <Icon sf={{ default: "square.grid.2x2", selected: "square.grid.2x2.fill" }} />
        <Label>{t.tabBrowse ?? t.tabCatalog}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="cart">
        <Icon sf={{ default: "bag", selected: "bag.fill" }} />
        <Label>{t.tabCart ?? "Cart"}</Label>
        {itemCount > 0 && <Badge>{itemCount > 99 ? "99+" : String(itemCount)}</Badge>}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="mis-pedidos">
        <Icon sf={{ default: "shippingbox", selected: "shippingbox.fill" }} />
        <Label>{t.tabOrders ?? "Orders"}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="cuenta">
        <Icon sf={{ default: "person.circle", selected: "person.circle.fill" }} />
        <Label>{t.tabAccount ?? "Account"}</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function CartTabIcon({ color, focused }: { color: string; focused: boolean }) {
  const { itemCount } = useCart();
  const colors = useColors();
  const isIOS = Platform.OS === "ios";
  return (
    <View style={cartIconStyles.wrap}>
      {isIOS ? (
        <SymbolView name={focused ? "cart.fill" : "cart"} tintColor={color} size={26} />
      ) : (
        <CartIcon size={26} color={color} filled={focused} />
      )}
      {itemCount > 0 && (
        <View style={[cartIconStyles.badge, { backgroundColor: colors.gold, borderColor: colors.background }]}>
          <Text style={cartIconStyles.badgeText} numberOfLines={1}>
            {itemCount > 99 ? "99+" : itemCount}
          </Text>
        </View>
      )}
    </View>
  );
}

const cartIconStyles = StyleSheet.create({
  wrap: { width: 30, height: 28, alignItems: "center", justifyContent: "center" },
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    paddingHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    lineHeight: 12,
  },
});

function LangHeaderButton() {
  const { t, lang, setLang } = useLanguage();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={(t as any).chooseLanguage ?? "Change language"}
      onPress={() => setLang(lang === "es" ? "en" : "es")}
      hitSlop={10}
      style={({ pressed }) => [langBtnStyles.pill, { opacity: pressed ? 0.7 : 1 }]}
    >
      <Text style={langBtnStyles.flag}>{lang === "es" ? "🇭🇳" : "🇺🇸"}</Text>
      <Text style={langBtnStyles.code}>{lang === "es" ? "ES" : "EN"}</Text>
      <Text style={langBtnStyles.arrow}>⇄</Text>
    </Pressable>
  );
}

const langBtnStyles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F5F0E0",
    borderWidth: 1,
    borderColor: "#C9A84C",
    marginRight: 12,
    minHeight: 32,
  },
  flag: { fontSize: 14, lineHeight: 16 },
  code: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: "#002B7F",
    letterSpacing: 0.5,
  },
  arrow: { fontSize: 11, color: "#C9A84C", fontFamily: "Inter_700Bold" },
});

function ClassicTabLayout() {
  const colors = useColors();
  const { t } = useLanguage();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const insets = useSafeAreaInsets();
  const extraBottom = isWeb ? 0 : Math.max(insets.bottom, 12);

  const renderTabButton = (props: any) => (
    <AnimatedTabButton {...props} activeColor={colors.primary} />
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: true,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontFamily: "Inter_700Bold", color: colors.foreground, fontSize: 18 },
        tabBarButton: renderTabButton,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          ...(isWeb
            ? { height: 84 }
            : { height: 64 + extraBottom, paddingBottom: extraBottom }),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
          ) : null,
        tabBarItemStyle: { paddingTop: 6, paddingBottom: 10 },
        tabBarLabelStyle: { fontFamily: "Inter_700Bold", fontSize: 11, letterSpacing: 0.2 },
        tabBarIconStyle: { marginBottom: 0 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.appName,
          tabBarLabel: t.tabHome,
          headerRight: () => <LangHeaderButton />,
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView name={focused ? "house.fill" : "house"} tintColor={color} size={24} />
            ) : (
              <HomeIcon size={24} color={color} filled={focused} />
            ),
        }}
      />
      <Tabs.Screen
        name="catalogo"
        options={{
          title: t.tabBrowse ?? t.tabCatalog,
          tabBarLabel: t.tabBrowse ?? t.tabCatalog,
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView
                name={focused ? "square.grid.2x2.fill" : "square.grid.2x2"}
                tintColor={color}
                size={24}
              />
            ) : (
              <CategoriesIcon size={24} color={color} filled={focused} />
            ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: t.tabCart ?? "Cart",
          tabBarLabel: t.tabCart ?? "Cart",
          tabBarIcon: ({ color, focused }) => <CartTabIcon color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="mis-pedidos"
        options={{
          title: t.tabOrders,
          tabBarLabel: t.tabOrders,
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView
                name={focused ? "shippingbox.fill" : "shippingbox"}
                tintColor={color}
                size={24}
              />
            ) : (
              <AppIcon name="package" size={24} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="cuenta"
        options={{
          title: t.tabAccount ?? "Account",
          tabBarLabel: t.tabAccount ?? "Account",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="person.circle" tintColor={color} size={24} />
            ) : (
              <AppIcon name="user" size={24} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
