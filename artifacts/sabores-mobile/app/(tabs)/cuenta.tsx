import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/Icon";
import { useLanguage } from "@/context/LanguageContext";
import { useUser } from "@/context/UserContext";
import { useColors } from "@/hooks/useColors";
import { useOrders } from "@/hooks/useOrders";

function LoginView({ colors }: { colors: ReturnType<typeof useColors> }) {
  const { t } = useLanguage();
  const { isSignedIn, logout } = useUser();
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = Platform.OS === "web" ? 84 : 65;

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 16 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Hero */}
      <View style={[styles.loginHero, { backgroundColor: colors.primary }]}>
        <Text style={styles.heroFlag}>🇭🇳</Text>
        <Text style={styles.heroTitle}>{t.accountTitle ?? "My Account"}</Text>
        <Text style={styles.heroSub}>
          {t.accountSubGuest ?? "Sign in or create an account to track orders and save your address"}
        </Text>
      </View>

      {/* CTA Card */}
      <View
        style={[
          styles.loginCard,
          { backgroundColor: colors.card, borderColor: colors.border, marginTop: -20 },
        ]}
      >
        <Text style={[styles.loginCardTitle, { color: colors.foreground }]}>
          {t.welcomeCardTitle ?? "Welcome to Sabores"}
        </Text>
        <Text style={[styles.loginCardSub, { color: colors.mutedForeground }]}>
          {t.welcomeCardSub ?? "Sign in to your account or create a new one to save your address and track your orders."}
        </Text>

        <Pressable
          testID="cta-sign-in"
          onPress={async () => {
            Haptics.selectionAsync();
            // Defensive: if a stale Clerk session exists (e.g. token cached
            // from a previous run / different environment), clear it first
            // so the auth modal isn't immediately redirected back to cuenta.
            if (isSignedIn) {
              try { await logout(); } catch {}
            }
            router.push("/(auth)/sign-in");
          }}
          style={({ pressed }) => [
            styles.loginBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Icon name="log-in" size={18} color={colors.gold} />
          <Text style={styles.loginBtnText}>{t.signInButton ?? "Sign In"}</Text>
        </Pressable>

        <Pressable
          testID="cta-sign-up"
          onPress={async () => {
            Haptics.selectionAsync();
            if (isSignedIn) {
              try { await logout(); } catch {}
            }
            router.push("/(auth)/sign-up");
          }}
          style={({ pressed }) => [
            styles.loginBtn,
            {
              backgroundColor: colors.background,
              borderWidth: 1,
              borderColor: colors.primary,
              marginTop: 10,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text style={[styles.loginBtnText, { color: colors.primary }]}>
            {t.createAccount ?? "Create Account"}
          </Text>
        </Pressable>
      </View>

      {/* Guest order access — for shoppers who placed an order without signing in */}
      <Pressable
        testID="guest-view-orders"
        onPress={() => {
          Haptics.selectionAsync();
          router.push("/(tabs)/mis-pedidos");
        }}
        style={({ pressed }) => [
          styles.guestOrdersRow,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            opacity: pressed ? 0.8 : 1,
            marginTop: 24,
            marginBottom: 16,
          },
        ]}
      >
        <View style={[styles.guestOrdersIcon, { backgroundColor: colors.primary + "18" }]}>
          <Icon name="package" size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.guestOrdersTitle, { color: colors.foreground }]}>
            {(t as any).guestOrdersTitle ?? "Ver mis pedidos"}
          </Text>
          <Text style={[styles.guestOrdersSub, { color: colors.mutedForeground }]}>
            {(t as any).guestOrdersSub ?? "Revisa los pedidos que hiciste sin cuenta"}
          </Text>
        </View>
        <Icon name="chevron-right" size={20} color={colors.mutedForeground} />
      </Pressable>

      {/* Benefits */}
      <View style={styles.benefitsContainer}>
        {[
          { icon: "package", text: t.benefitOrders ?? "View your full order history" },
          { icon: "map-pin", text: t.benefitAddress ?? "Save your shipping address" },
          { icon: "zap", text: t.benefitCheckout ?? "Faster checkout every time" },
        ].map((b) => (
          <View
            key={b.icon}
            style={[
              styles.benefitRow,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View
              style={[
                styles.benefitIcon,
                { backgroundColor: colors.primary + "18" },
              ]}
            >
              <Icon name={b.icon as any} size={22} color={colors.primary} />
            </View>
            <Text style={[styles.benefitText, { color: colors.foreground }]}>
              {b.text}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function ProfileView({ colors }: { colors: ReturnType<typeof useColors> }) {
  const { t, lang, setLang } = useLanguage();
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

  if (editing) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 20, paddingBottom: contentBottom + 20 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 20 }]}>
          {t.editProfile ?? "Edit Profile"}
        </Text>

        {[
          { label: t.yourName, value: name, set: setName, keyboard: "default" as const },
          { label: t.phone, value: phone, set: setPhone, keyboard: "phone-pad" as const },
        ].map((f) => (
          <View key={f.label} style={styles.editField}>
            <Text style={[styles.editLabel, { color: colors.mutedForeground }]}>{f.label}</Text>
            <TextInput
              style={[styles.editInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              value={f.value}
              onChangeText={f.set}
              keyboardType={f.keyboard}
              autoCorrect={false}
              autoCapitalize="words"
            />
          </View>
        ))}

        <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 20, marginBottom: 16 }]}>
          {t.defaultAddress ?? "Default Shipping Address"}
        </Text>

        {[
          { label: t.addressLine1, value: line1, set: setLine1, keyboard: "default" as const, cap: "words" as const, placeholder: t.addressLine1Placeholder },
          { label: t.addressLine2, value: line2, set: setLine2, keyboard: "default" as const, cap: "words" as const, placeholder: t.addressLine2Placeholder },
          { label: t.city, value: city, set: setCity, keyboard: "default" as const, cap: "words" as const },
          { label: t.state, value: stateName, set: setStateName, keyboard: "default" as const, cap: "characters" as const, placeholder: "TX" },
          { label: t.zip, value: zipCode, set: setZipCode, keyboard: "numeric" as const, cap: "none" as const },
          { label: t.phone, value: addrPhone, set: setAddrPhone, keyboard: "phone-pad" as const, cap: "none" as const },
        ].map((f) => (
          <View key={f.label} style={styles.editField}>
            <Text style={[styles.editLabel, { color: colors.mutedForeground }]}>{f.label}</Text>
            <TextInput
              style={[styles.editInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              value={f.value}
              onChangeText={f.set}
              keyboardType={f.keyboard}
              autoCorrect={false}
              autoCapitalize={f.cap ?? "none"}
              placeholder={f.placeholder}
              placeholderTextColor={colors.mutedForeground}
            />
          </View>
        ))}

        <View style={{ flexDirection: "row", gap: 12, marginTop: 24 }}>
          <Pressable
            style={[styles.cancelEditBtn, { borderColor: colors.border }]}
            onPress={() => setEditing(false)}
          >
            <Text style={[styles.cancelEditText, { color: colors.mutedForeground }]}>
              {t.cancel ?? "Cancel"}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.saveBtn, { backgroundColor: saving ? colors.muted : colors.primary, flex: 1 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>{t.saveChanges ?? "Save Changes"}</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: contentBottom }}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <View style={[styles.profileHeader, { backgroundColor: colors.primary }]}>
        <View style={[styles.avatar, { backgroundColor: colors.gold }]}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={[styles.profileName, { color: "#fff" }]}>{user?.name}</Text>
        <Text style={[styles.profileEmail, { color: "rgba(255,255,255,0.75)" }]}>
          {user?.email}
        </Text>
        <Text style={[styles.profileSince, { color: "rgba(255,255,255,0.6)" }]}>
          {t.memberSince ?? "Member since"} {joinedDate}
        </Text>
      </View>

      {/* Stats Card */}
      <View
        style={[
          styles.statsRow,
          { backgroundColor: colors.card, borderColor: colors.border, marginHorizontal: 16, marginTop: -20 },
        ]}
      >
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: colors.primary }]}>
            {ordersLoading ? "…" : (orders?.length ?? 0)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
            {t.ordersPlaced ?? "Orders"}
          </Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: user?.defaultAddress ? "#16a34a" : colors.mutedForeground, fontSize: 22 }]}>
            {user?.defaultAddress ? "✓" : "—"}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
            {user?.defaultAddress ? (t.addressSaved ?? "Address saved") : (t.noAddress ?? "No address")}
          </Text>
        </View>
      </View>

      {/* Personal Info Card */}
      <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.infoCardHeader}>
          <Text style={[styles.infoCardTitle, { color: colors.foreground }]}>
            {t.personalInfo ?? "Personal Info"}
          </Text>
          <Pressable
            onPress={startEdit}
            style={[styles.editBtn, { borderColor: colors.primary }]}
          >
            <Icon name="edit-2" size={14} color={colors.primary} />
            <Text style={[styles.editBtnText, { color: colors.primary }]}>
              {t.edit ?? "Edit"}
            </Text>
          </Pressable>
        </View>
        {[
          { icon: "user", label: t.yourName, value: user?.name },
          { icon: "mail", label: t.email, value: user?.email },
          { icon: "phone", label: t.phone, value: user?.phone || (t.notSet ?? "Not set") },
        ].map((row) => (
          <View key={row.label} style={[styles.infoRow, { borderTopColor: colors.border }]}>
            <Icon name={row.icon as any} size={18} color={colors.mutedForeground} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoRowLabel, { color: colors.mutedForeground }]}>
                {row.label}
              </Text>
              <Text style={[styles.infoRowValue, { color: colors.foreground }]}>
                {row.value}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Default Address Card */}
      <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.infoCardHeader}>
          <Text style={[styles.infoCardTitle, { color: colors.foreground }]}>
            {t.defaultAddress ?? "Default Shipping Address"}
          </Text>
          <Pressable
            onPress={startEdit}
            style={[styles.editBtn, { borderColor: colors.primary }]}
          >
            <Icon name={user?.defaultAddress ? "edit-2" : "plus"} size={14} color={colors.primary} />
            <Text style={[styles.editBtnText, { color: colors.primary }]}>
              {user?.defaultAddress ? (t.edit ?? "Edit") : (t.addAddress ?? "Add")}
            </Text>
          </Pressable>
        </View>
        {user?.defaultAddress ? (
          <View style={[styles.addressBlock, { borderTopColor: colors.border }]}>
            <Icon name="map-pin" size={18} color={colors.primary} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.addressLine, { color: colors.foreground }]}>
                {user.defaultAddress.fullName}
              </Text>
              <Text style={[styles.addressLine, { color: colors.mutedForeground }]}>
                {user.defaultAddress.line1}
              </Text>
              {user.defaultAddress.line2 ? (
                <Text style={[styles.addressLine, { color: colors.mutedForeground }]}>
                  {user.defaultAddress.line2}
                </Text>
              ) : null}
              <Text style={[styles.addressLine, { color: colors.mutedForeground }]}>
                {user.defaultAddress.city}, {user.defaultAddress.state} {user.defaultAddress.zipCode}
              </Text>
            </View>
          </View>
        ) : (
          <Pressable
            style={[styles.addAddressPrompt, { borderTopColor: colors.border, borderTopWidth: 1 }]}
            onPress={startEdit}
          >
            <Icon name="plus-circle" size={20} color={colors.mutedForeground} />
            <Text style={[styles.addAddressText, { color: colors.mutedForeground }]}>
              {t.addAddressPrompt ?? "Tap to add your shipping address"}
            </Text>
          </Pressable>
        )}
      </View>

      {/* My Orders entry — same destination as the guest flow for a single, consistent place to view orders */}
      <Pressable
        testID="profile-view-orders"
        onPress={() => {
          Haptics.selectionAsync();
          router.push("/(tabs)/mis-pedidos");
        }}
        style={({ pressed }) => [
          styles.guestOrdersRow,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            opacity: pressed ? 0.8 : 1,
            marginTop: 16,
            marginBottom: 16,
          },
        ]}
      >
        <View style={[styles.guestOrdersIcon, { backgroundColor: colors.primary + "18" }]}>
          <Icon name="package" size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.guestOrdersTitle, { color: colors.foreground }]}>
            {(t as any).viewMyOrders ?? t.recentOrders ?? "Mis pedidos"}
          </Text>
          <Text style={[styles.guestOrdersSub, { color: colors.mutedForeground }]}>
            {ordersLoading
              ? ((t as any).loading ?? "Cargando…")
              : ((t as any).ordersCount
                  ? (t as any).ordersCount(orders?.length ?? 0)
                  : `${orders?.length ?? 0} pedidos`)}
          </Text>
        </View>
        <Icon name="chevron-right" size={20} color={colors.mutedForeground} />
      </Pressable>

      {/* Language */}
      <View style={[styles.langSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.langHeader}>
          <Icon name="globe" size={20} color={colors.primary} />
          <Text style={[styles.langTitle, { color: colors.foreground }]}>
            {(t as any).languageSection ?? t.language ?? "Language"}
          </Text>
        </View>
        <View style={styles.langOptionsRow}>
          {[
            { code: "es" as const, flag: "🇭🇳", label: t.langEs ?? "Español" },
            { code: "en" as const, flag: "🇺🇸", label: t.langEn ?? "English" },
          ].map((opt) => {
            const selected = lang === opt.code;
            return (
              <Pressable
                key={opt.code}
                accessibilityRole="button"
                accessibilityLabel={opt.label}
                onPress={() => setLang(opt.code)}
                style={({ pressed }) => [
                  styles.langOption,
                  {
                    backgroundColor: selected ? colors.secondary : colors.background,
                    borderColor: selected ? colors.primary : colors.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={styles.langFlag}>{opt.flag}</Text>
                <Text style={[styles.langLabel, { color: selected ? colors.primary : colors.foreground }]}>
                  {opt.label}
                </Text>
                {selected && <Text style={[styles.langCheck, { color: colors.primary }]}>✓</Text>}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Sign Out */}
      <Pressable
        style={[styles.logoutBtn, { borderColor: "#ef4444" }]}
        onPress={handleLogout}
      >
        <Icon name="log-out" size={18} color="#ef4444" />
        <Text style={[styles.logoutText, { color: "#ef4444" }]}>
          {t.logoutTitle ?? "Sign Out"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

export default function CuentaScreen() {
  const colors = useColors();
  const { isSignedIn, loading } = useUser();

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {isSignedIn ? <ProfileView colors={colors} /> : <LoginView colors={colors} />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },

  // Login
  loginHero: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 10,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroFlag: { fontSize: 44 },
  heroTitle: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#fff", textAlign: "center" },
  heroSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    lineHeight: 21,
  },
  loginCard: {
    margin: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  loginCardTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  loginCardSub: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  inputField: {
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 20,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 15,
    borderRadius: 50,
  },
  loginBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  benefitsContainer: { paddingHorizontal: 16, gap: 10 },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  benefitIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitText: { fontSize: 14, fontFamily: "Inter_500Medium", flex: 1, lineHeight: 20 },
  guestOrdersRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 12,
  },
  guestOrdersIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  guestOrdersTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  guestOrdersSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },

  // Profile
  profileHeader: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 44,
    paddingHorizontal: 24,
    gap: 8,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  avatarText: { fontSize: 30, fontFamily: "Inter_700Bold", color: "#002B7F" },
  profileName: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  profileEmail: { fontSize: 13, fontFamily: "Inter_500Medium", textAlign: "center" },
  profileSince: { fontSize: 12, fontFamily: "Inter_400Regular" },
  statsRow: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  statItem: { flex: 1, alignItems: "center", gap: 6 },
  statDivider: { width: 1, marginVertical: 4 },
  statNum: { fontSize: 26, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, fontFamily: "Inter_500Medium", textAlign: "center" },
  infoCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  infoCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  infoCardTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  editBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    padding: 14,
    borderTopWidth: 1,
  },
  infoRowLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 2 },
  infoRowValue: { fontSize: 15, fontFamily: "Inter_500Medium" },
  addressBlock: { flexDirection: "row", gap: 14, padding: 16, borderTopWidth: 1 },
  addressLine: { fontSize: 14, fontFamily: "Inter_500Medium", marginBottom: 2 },
  addAddressPrompt: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  addAddressText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  emptyOrders: { alignItems: "center", gap: 10, padding: 24 },
  emptyOrdersText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  orderRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderTopWidth: 1,
  },
  orderRowNum: { fontSize: 15, fontFamily: "Inter_700Bold" },
  orderRowDate: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 2 },
  orderRowTotal: { fontSize: 16, fontFamily: "Inter_700Bold" },
  orderRowStatus: {
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  orderRowStatusText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    margin: 16,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  logoutText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },

  // Language section
  langSection: {
    marginHorizontal: 16,
    marginTop: 4,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  langHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  langTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  langOptionsRow: { flexDirection: "row", gap: 10 },
  langOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    minHeight: 48,
  },
  langFlag: { fontSize: 20 },
  langLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1 },
  langCheck: { fontSize: 16, fontFamily: "Inter_700Bold" },

  // Edit profile
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  editField: { marginBottom: 14 },
  editLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  editInput: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  cancelEditBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelEditText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  saveBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
});
