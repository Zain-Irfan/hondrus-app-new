import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import React, { useCallback, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BrandMark } from "@/components/BrandLogo";
import { LanguagePicker } from "@/components/LanguagePicker";
import { ReferralCard } from "@/components/ReferralCard";
import { Button, TextField } from "@/components/ui";
import { fonts } from "@/constants/fonts";
import { useLanguage } from "@/context/LanguageContext";
import { useUser } from "@/context/UserContext";
import { useColors } from "@/hooks/useColors";
import { useOrders } from "@/hooks/useOrders";

const SUPPORT_EMAIL = "support@hngrocers.com";
type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

/** Light status-bar icons while the navy header is on screen. */
function useLightStatusBar() {
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle("light");
      return () => setStatusBarStyle("dark");
    }, []),
  );
}

/** Small uppercase label above a grouped card, with an optional action on the right. */
function SectionHead({
  colors,
  title,
  action,
}: {
  colors: ReturnType<typeof useColors>;
  title: string;
  action?: { label: string; icon: IconName; onPress: () => void };
}) {
  return (
    <View style={styles.sectionHead}>
      <Text style={[styles.sectionEyebrow, { color: colors.mutedForeground }]}>{title.toUpperCase()}</Text>
      {action && (
        <Pressable onPress={action.onPress} hitSlop={10} style={styles.editLink} accessibilityRole="button">
          <MaterialCommunityIcons name={action.icon} size={16} color={colors.primary} />
          <Text style={[styles.editLinkText, { color: colors.primary }]}>{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}

/** Tappable row inside a grouped card: icon · label · trailing value/chevron. */
function ListRow({
  colors,
  icon,
  label,
  value,
  onPress,
  last,
  tone = "default",
}: {
  colors: ReturnType<typeof useColors>;
  icon: IconName;
  label: string;
  value?: string;
  onPress?: () => void;
  last?: boolean;
  tone?: "default" | "danger";
}) {
  const fg = tone === "danger" ? colors.destructive : colors.foreground;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      style={({ pressed }) => [
        styles.listRow,
        !last && { borderBottomWidth: 1, borderBottomColor: colors.v2.bg.muted },
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <MaterialCommunityIcons name={icon} size={20} color={tone === "danger" ? colors.destructive : colors.v2.text.secondary} />
      <Text style={[styles.listLabel, { color: fg }]}>{label}</Text>
      {!!value && (
        <Text style={[styles.listValue, { color: colors.mutedForeground }]} numberOfLines={1}>
          {value}
        </Text>
      )}
      {onPress && tone !== "danger" && (
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.v2.text.tertiary} />
      )}
    </Pressable>
  );
}

function LoginView({ colors }: { colors: ReturnType<typeof useColors> }) {
  const { t } = useLanguage();
  const { isSignedIn, logout } = useUser();
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = Platform.OS === "web" ? 84 : 65;
  useLightStatusBar();

  const benefits: { icon: IconName; text: string }[] = [
    { icon: "package-variant", text: t.benefitOrders ?? "View your full order history" },
    { icon: "map-marker-outline", text: t.benefitAddress ?? "Save your shipping address" },
    { icon: "lightning-bolt-outline", text: t.benefitCheckout ?? "Faster checkout every time" },
  ];

  return (
    <ScrollView
      style={{ backgroundColor: colors.canvas }}
      contentContainerStyle={{ paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 16 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Navy header: title + language, brand mark, welcome copy */}
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle} accessibilityRole="header">
            {t.accountTitle ?? "My Account"}
          </Text>
          <LanguagePicker variant="onBrand" />
        </View>
        <View style={styles.brandMark}>
          <BrandMark size={52} />
        </View>
        <Text style={styles.welcomeTitle}>{t.welcomeCardTitle ?? "Welcome to HN Grocers"}</Text>
        <Text style={styles.welcomeSub}>
          {t.accountSubGuest ?? t.welcomeCardSub ?? "Sign in to save your address and track orders."}
        </Text>
      </View>

      <View style={styles.body}>
        <View style={[styles.card, styles.actionsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Button
            testID="cta-sign-in"
            title={t.signInButton ?? "Sign In"}
            icon={<MaterialCommunityIcons name="login" size={18} color={colors.gold} />}
            onPress={async () => {
              Haptics.selectionAsync();
              if (isSignedIn) {
                try { await logout(); } catch {}
              }
              router.push("/(auth)/sign-in");
            }}
          />
          <Button
            testID="cta-sign-up"
            title={t.createAccount ?? "Create Account"}
            variant="outline"
            onPress={async () => {
              Haptics.selectionAsync();
              if (isSignedIn) {
                try { await logout(); } catch {}
              }
              router.push("/(auth)/sign-up");
            }}
          />
        </View>

        {/* Guest order access — for shoppers who placed an order without signing in */}
        <Pressable
          testID="guest-view-orders"
          onPress={() => {
            Haptics.selectionAsync();
            router.push("/(tabs)/mis-pedidos");
          }}
          style={({ pressed }) => [
            styles.card,
            styles.guestOrders,
            { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
          ]}
          accessibilityRole="button"
        >
          <View style={[styles.iconTile, { backgroundColor: colors.v2.bg.brandSoft }]}>
            <MaterialCommunityIcons name="package-variant" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.tileTitle, { color: colors.foreground }]}>
              {(t as any).guestOrdersTitle ?? "Ver mis pedidos"}
            </Text>
            <Text style={[styles.tileSub, { color: colors.mutedForeground }]}>
              {(t as any).guestOrdersSub ?? "Revisa los pedidos que hiciste sin cuenta"}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.v2.text.tertiary} />
        </Pressable>

        {/* Benefits */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {benefits.map((b, i) => (
            <View
              key={b.icon}
              style={[
                styles.benefitRow,
                i < benefits.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.v2.bg.muted },
              ]}
            >
              <View style={[styles.benefitIcon, { backgroundColor: colors.v2.bg.accentSoft }]}>
                <MaterialCommunityIcons name={b.icon} size={18} color={colors.v2.text.accent} />
              </View>
              <Text style={[styles.benefitText, { color: colors.foreground }]}>{b.text}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function ProfileView({ colors }: { colors: ReturnType<typeof useColors> }) {
  const { t, lang } = useLanguage();
  const { user, logout, updateProfile } = useUser();
  const insets = useSafeAreaInsets();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [line1, setLine1] = useState(user?.defaultAddress?.line1 ?? "");
  const [line2, setLine2] = useState(user?.defaultAddress?.line2 ?? "");
  const [city, setCity] = useState(user?.defaultAddress?.city ?? "");
  const [stateName, setStateName] = useState(user?.defaultAddress?.state ?? "");
  const [zipCode, setZipCode] = useState(user?.defaultAddress?.zipCode ?? "");
  const [addrPhone, setAddrPhone] = useState(
    user?.defaultAddress?.phone ?? user?.phone ?? ""
  );

  const { data: orders, isLoading: ordersLoading } = useOrders();

  const startEdit = () => {
    setName(user?.name ?? "");
    setPhone(user?.phone ?? "");
    setLine1(user?.defaultAddress?.line1 ?? "");
    setLine2(user?.defaultAddress?.line2 ?? "");
    setCity(user?.defaultAddress?.city ?? "");
    setStateName(user?.defaultAddress?.state ?? "");
    setZipCode(user?.defaultAddress?.zipCode ?? "");
    setAddrPhone(user?.defaultAddress?.phone ?? user?.phone ?? "");
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const hasAddress =
        line1.trim() && city.trim() && stateName.trim() && zipCode.trim();
      const resolvedFullName = name.trim() || user?.name || "Customer";
      await updateProfile({
        name: name.trim() || undefined,
        phone: phone.trim() || undefined,
        defaultAddress: hasAddress
          ? {
              fullName: resolvedFullName,
              line1: line1.trim(),
              line2: line2.trim() || undefined,
              city: city.trim(),
              state: stateName.trim(),
              zipCode: zipCode.trim(),
              phone: addrPhone.trim() || phone.trim() || "",
            }
          : undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEditing(false);
    } catch (err: any) {
      Alert.alert(
        t.orderError ?? "Error",
        err?.message ?? (t.orderErrorMsg ?? "Could not save changes. Please try again.")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t.logoutTitle ?? "Sign Out",
      t.logoutConfirm ?? "Are you sure you want to sign out?",
      [
        { text: t.cancel ?? "Cancel", style: "cancel" },
        {
          text: t.logoutTitle ?? "Sign Out",
          style: "destructive",
          onPress: logout,
        },
      ]
    );
  };

  const initial = (user?.name ?? "?")[0]?.toUpperCase();
  const joinedDate = user?.joinedAt
    ? new Date(user.joinedAt).toLocaleDateString(
        lang === "en" ? "en-US" : "es-US",
        { year: "numeric", month: "long" }
      )
    : "";

  const TAB_BAR_HEIGHT = Platform.OS === "web" ? 84 : 65;
  const contentBottom = insets.bottom + TAB_BAR_HEIGHT + 16;

  // Navy header only on the profile view; the edit form is on a light background.
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle(editing ? "dark" : "light");
      return () => setStatusBarStyle("dark");
    }, [editing]),
  );

  if (editing) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.canvas }}
        contentContainerStyle={{ padding: 20, paddingTop: insets.top + 12, paddingBottom: contentBottom + 20, gap: 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.editTitle, { color: colors.foreground }]} accessibilityRole="header">
          {t.editProfile ?? "Edit Profile"}
        </Text>

        <View style={[styles.card, styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.formTitle, { color: colors.foreground }]}>{t.personalInfo ?? "Personal Info"}</Text>
          <TextField label={t.yourName} value={name} onChangeText={setName} autoCorrect={false} autoCapitalize="words" />
          <TextField label={t.phone} value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoCorrect={false} containerStyle={{ marginBottom: 0 }} />
        </View>

        <View style={[styles.card, styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.formTitle, { color: colors.foreground }]}>{t.defaultAddress ?? "Default Shipping Address"}</Text>
          <TextField label={t.addressLine1} value={line1} onChangeText={setLine1} placeholder={t.addressLine1Placeholder} autoCorrect={false} autoCapitalize="words" />
          <TextField label={t.addressLine2} value={line2} onChangeText={setLine2} placeholder={t.addressLine2Placeholder} autoCorrect={false} autoCapitalize="words" />
          <TextField label={t.city} value={city} onChangeText={setCity} autoCorrect={false} autoCapitalize="words" />
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <TextField label={t.state} value={stateName} onChangeText={setStateName} placeholder="TX" autoCorrect={false} autoCapitalize="characters" />
            </View>
            <View style={{ flex: 1 }}>
              <TextField label={t.zip} value={zipCode} onChangeText={setZipCode} keyboardType="numeric" autoCorrect={false} />
            </View>
          </View>
          <TextField label={t.phone} value={addrPhone} onChangeText={setAddrPhone} keyboardType="phone-pad" autoCorrect={false} containerStyle={{ marginBottom: 0 }} />
        </View>

        <View style={{ flexDirection: "row", gap: 12 }}>
          <Button title={t.cancel ?? "Cancel"} variant="outline" onPress={() => setEditing(false)} style={{ flex: 1 }} />
          <Button title={t.saveChanges ?? "Save Changes"} onPress={handleSave} loading={saving} style={{ flex: 1 }} />
        </View>
      </ScrollView>
    );
  }

  const addr = user?.defaultAddress;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.canvas }}
      contentContainerStyle={{ paddingBottom: contentBottom }}
      showsVerticalScrollIndicator={false}
    >
      {/* Navy header: title + language, then identity */}
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle} accessibilityRole="header">
            {t.accountTitle ?? "My Account"}
          </Text>
          <LanguagePicker variant="onBrand" />
        </View>
        <View style={styles.identity}>
          <View style={[styles.avatar, { backgroundColor: colors.gold }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>{initial}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text style={styles.profileName} numberOfLines={1}>
              {user?.name}
            </Text>
            <Text style={styles.profileEmail} numberOfLines={1}>
              {user?.email}
            </Text>
            {!!joinedDate && (
              <Text style={styles.profileSince}>
                {t.memberSince ?? "Member since"} {joinedDate}
              </Text>
            )}
          </View>
          <Pressable
            onPress={startEdit}
            accessibilityRole="button"
            style={({ pressed }) => [styles.editPill, { opacity: pressed ? 0.75 : 1 }]}
          >
            <Text style={styles.editPillText}>{t.edit ?? "Edit"}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.body}>
        {/* Quick tiles */}
        <View style={styles.tiles}>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              router.push("/(tabs)/mis-pedidos");
            }}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.card,
              styles.tile,
              { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <View style={[styles.iconTile, { backgroundColor: colors.v2.bg.brandSoft }]}>
              <MaterialCommunityIcons name="package-variant" size={22} color={colors.primary} />
            </View>
            <Text style={[styles.tileTitle, { color: colors.foreground }]}>
              {(t as any).viewMyOrders ?? t.recentOrders ?? "Mis pedidos"}
            </Text>
            <Text style={[styles.tileSub, { color: colors.mutedForeground }]}>
              {ordersLoading
                ? ((t as any).loading ?? "…")
                : `${orders?.length ?? 0} ${(t.ordersPlaced ?? "Orders").toLowerCase()}`}
            </Text>
          </Pressable>
          <Pressable
            onPress={startEdit}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.card,
              styles.tile,
              { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <View style={[styles.iconTile, { backgroundColor: colors.v2.bg.accentSoft }]}>
              <MaterialCommunityIcons name="map-marker-outline" size={22} color={colors.v2.text.accent} />
            </View>
            <Text style={[styles.tileTitle, { color: colors.foreground }]}>{t.defaultAddress ?? "Address"}</Text>
            <Text style={[styles.tileSub, { color: addr ? colors.v2.state.success : colors.mutedForeground }]}>
              {addr ? (t.addressSaved ?? "Address saved") : (t.addAddress ?? "Add address")}
            </Text>
          </Pressable>
        </View>

        {/* Personal info */}
        <View>
          <SectionHead
            colors={colors}
            title={t.personalInfo ?? "Personal Info"}
            action={{ label: t.edit ?? "Edit", icon: "pencil-outline", onPress: startEdit }}
          />
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {[
              { icon: "account-outline" as IconName, label: t.yourName, value: user?.name },
              { icon: "email-outline" as IconName, label: t.email, value: user?.email },
              { icon: "phone-outline" as IconName, label: t.phone, value: user?.phone || ((t as any).notSet ?? "Not set") },
            ].map((row, i, arr) => (
              <ListRow
                key={row.label}
                colors={colors}
                icon={row.icon}
                label={row.label}
                value={row.value ?? ""}
                last={i === arr.length - 1}
              />
            ))}
          </View>
        </View>

        {/* Default address */}
        <View>
          <SectionHead
            colors={colors}
            title={t.defaultAddress ?? "Default Shipping Address"}
            action={{
              label: addr ? (t.edit ?? "Edit") : (t.addAddress ?? "Add"),
              icon: addr ? "pencil-outline" : "plus",
              onPress: startEdit,
            }}
          />
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {addr ? (
              <View style={styles.addressBlock}>
                <MaterialCommunityIcons name="map-marker-outline" size={20} color={colors.v2.text.accent} style={{ marginTop: 1 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.addressName, { color: colors.foreground }]}>{addr.fullName}</Text>
                  <Text style={[styles.addressLine, { color: colors.v2.text.secondary }]}>{addr.line1}</Text>
                  {addr.line2 ? (
                    <Text style={[styles.addressLine, { color: colors.v2.text.secondary }]}>{addr.line2}</Text>
                  ) : null}
                  <Text style={[styles.addressLine, { color: colors.v2.text.secondary }]}>
                    {addr.city}, {addr.state} {addr.zipCode}
                  </Text>
                </View>
              </View>
            ) : (
              <ListRow
                colors={colors}
                icon="plus-circle-outline"
                label={t.addAddressPrompt ?? "Tap to add your shipping address"}
                onPress={startEdit}
                last
              />
            )}
          </View>
        </View>

        {/* Support */}
        <View>
          <SectionHead colors={colors} title={(t as any).needHelp ?? "Support"} />
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ListRow
              colors={colors}
              icon="email-outline"
              label={SUPPORT_EMAIL}
              onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
              last
            />
          </View>
        </View>

        <ReferralCard
          onPress={async () => {
            try {
              await Share.share({
                message:
                  (t as any).shareReferralDesc ??
                  "Comparte HN Grocers — tu amigo recibe $10 en su primer pedido.",
              });
            } catch {}
          }}
        />

        {/* Sign out */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ListRow
            colors={colors}
            icon="logout"
            label={t.logoutTitle ?? "Sign Out"}
            onPress={handleLogout}
            tone="danger"
            last
          />
        </View>
      </View>
    </ScrollView>
  );
}

export default function CuentaScreen() {
  const colors = useColors();
  const { isSignedIn, loading } = useUser();

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.canvas }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.canvas }]}>
      {isSignedIn ? <ProfileView colors={colors} /> : <LoginView colors={colors} />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },

  // Navy header
  header: { paddingHorizontal: 20, paddingBottom: 28, gap: 18 },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  headerTitle: { flex: 1, color: "#FFFFFF", fontSize: 28, fontFamily: fonts.display, letterSpacing: -0.4 },

  // Guest header content
  brandMark: { marginTop: 4 },
  welcomeTitle: { color: "#FFFFFF", fontSize: 24, lineHeight: 28, fontFamily: fonts.display, marginTop: -6 },
  welcomeSub: { color: "#C3CEE6", fontSize: 15, lineHeight: 22, fontFamily: fonts.regular, marginTop: -10 },

  // Profile identity
  identity: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 22, fontFamily: fonts.display },
  profileName: { color: "#FFFFFF", fontSize: 18, fontFamily: fonts.bold },
  profileEmail: { color: "#C3CEE6", fontSize: 13, fontFamily: fonts.regular },
  profileSince: { color: "#9FB0D6", fontSize: 12, fontFamily: fonts.regular, marginTop: 2 },
  editPill: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  editPillText: { color: "#FFFFFF", fontSize: 13, fontFamily: fonts.bold },

  // Body + cards
  body: { paddingHorizontal: 20, paddingTop: 16, gap: 16 },
  card: { borderWidth: 1, borderRadius: 16 },
  actionsCard: { padding: 16, gap: 10 },
  guestOrders: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14 },
  iconTile: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  tiles: { flexDirection: "row", gap: 12 },
  tile: { flex: 1, padding: 14, gap: 10 },
  tileTitle: { fontSize: 15, fontFamily: fonts.bold },
  tileSub: { fontSize: 13, fontFamily: fonts.regular, marginTop: -6 },

  benefitRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  benefitIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  benefitText: { flex: 1, fontSize: 15, fontFamily: fonts.medium, lineHeight: 21 },

  // Sections
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  sectionEyebrow: { fontSize: 12, fontFamily: fonts.bold, letterSpacing: 0.8 },
  editLink: { flexDirection: "row", alignItems: "center", gap: 4 },
  editLinkText: { fontSize: 13, fontFamily: fonts.semibold },

  listRow: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56, paddingHorizontal: 16 },
  listLabel: { flex: 1, fontSize: 15, fontFamily: fonts.medium },
  listValue: { maxWidth: "55%", fontSize: 14, fontFamily: fonts.regular, textAlign: "right" },

  addressBlock: { flexDirection: "row", gap: 12, padding: 16 },
  addressName: { fontSize: 15, fontFamily: fonts.semibold, lineHeight: 21 },
  addressLine: { fontSize: 14, fontFamily: fonts.regular, lineHeight: 20 },

  // Edit profile
  editTitle: { fontSize: 28, fontFamily: fonts.display, letterSpacing: -0.4 },
  formCard: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 16 },
  formTitle: { fontSize: 16, fontFamily: fonts.bold, marginBottom: 14 },
});
