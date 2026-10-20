import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import React, { useState, useRef, useEffect } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AddressAutocomplete, type ParsedAddress } from "@/components/AddressAutocomplete";
import { Button, TextField } from "@/components/ui";
import { fonts } from "@/constants/fonts";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useUser } from "@/context/UserContext";
import { useColors } from "@/hooks/useColors";
import { useShippingConfig } from "@/hooks/useShippingConfig";
import { API_BASE, apiFetch } from "@/lib/api";
import { getGuestId, useGuestId } from "@/lib/guestId";

// Shipping carrier selection has been removed. Every order uses a single
// flat rate (matched on the server). Free over the configured threshold.
// Live values come from useShippingConfig() which calls
// /api/store/shipping-config and falls back to sane defaults.

interface FormData {
  fullName: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  customerEmail: string;
  customerName: string;
}

export default function CheckoutScreen() {
  const colors = useColors();
  const { t } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, itemCount, subtotal, clearCart } = useCart();
  const { user, getToken, isSignedIn, refreshProfile } = useUser();
  const guestId = useGuestId();
  const [submitting, setSubmitting] = useState(false);
  const [paymentStep, setPaymentStep] = useState<"form" | "awaiting" | "done">("form");
  const [pollMsg, setPollMsg] = useState("");
  const cancelPollingRef = useRef(false);
  const [form, setForm] = useState<FormData>({
    fullName: user?.defaultAddress?.fullName ?? user?.name ?? "",
    line1: user?.defaultAddress?.line1 ?? "",
    line2: user?.defaultAddress?.line2 ?? "",
    city: user?.defaultAddress?.city ?? "",
    state: user?.defaultAddress?.state ?? "",
    zipCode: user?.defaultAddress?.zipCode ?? "",
    phone: user?.defaultAddress?.phone ?? user?.phone ?? "",
    customerEmail: user?.email ?? "",
    customerName: user?.name ?? "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.defaultAddress?.fullName ?? user.name ?? "",
        line1: user.defaultAddress?.line1 ?? "",
        line2: user.defaultAddress?.line2 ?? "",
        city: user.defaultAddress?.city ?? "",
        state: user.defaultAddress?.state ?? "",
        zipCode: user.defaultAddress?.zipCode ?? "",
        phone: user.defaultAddress?.phone ?? user.phone ?? "",
        customerEmail: user.email ?? "",
        customerName: user.name ?? "",
      });
    }
  }, [user]);

  const shippingConfig = useShippingConfig();
  const isFreeShipping = subtotal >= shippingConfig.freeShippingThreshold;
  const shippingCost = isFreeShipping ? 0 : shippingConfig.standardRate;
  const total = subtotal + shippingCost;

  const bottomPad = Platform.OS === "web" ? 34 + 16 : insets.bottom + 16;

  const update = (key: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    const required: (keyof FormData)[] = ["fullName", "line1", "city", "state", "zipCode", "phone", "customerEmail", "customerName"];
    for (const key of required) {
      if (!form[key].trim()) return false;
    }
    return items.length > 0;
  };

  const createOrderAfterPayment = async (paymentIntentId: string) => {
    // Always resolve the guest token from storage (not just hook state) so a
    // fast checkout that fires before useGuestId() hydrates still includes it.
    // For signed-in users the server ignores it; for guests the server requires it.
    const resolvedGuestToken = isSignedIn ? undefined : await getGuestId();
    if (!isSignedIn && !resolvedGuestToken) {
      throw new Error("No se pudo generar el identificador de invitado. Intenta de nuevo.");
    }
    const orderRes = await apiFetch("/orders", {
      method: "POST",
      body: JSON.stringify({
        paymentIntentId,
        shippingAddress: {
          fullName: form.fullName,
          line1: form.line1,
          line2: form.line2 || undefined,
          city: form.city,
          state: form.state,
          zipCode: form.zipCode,
          phone: form.phone,
        },
        shippingOptionId: "standard",
        customerEmail: form.customerEmail,
        customerName: form.customerName,
        guestToken: resolvedGuestToken,
        items: items.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          productImageUrl: item.productImageUrl,
          price: item.price,
          quantity: item.quantity,
        })),
      }),
    }, getToken);
    if (!orderRes.ok) throw new Error("Error al crear el pedido");
    return orderRes.json();
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert(t.incompleteFields, t.incompleteFieldsMsg);
      return;
    }
    setSubmitting(true);
    try {
      // 1. Create Stripe payment intent ONLY
      const amountInCents = Math.round(total * 100);
      const piRes = await apiFetch("/payment/create-intent", {
        method: "POST",
        body: JSON.stringify({ amount: amountInCents, customerEmail: form.customerEmail }),
      }, getToken);
      if (!piRes.ok) throw new Error("No se pudo inicializar el pago");
      const { paymentIntentId } = await piRes.json();

      // 2. Open payment browser — on Android this resolves immediately (tab stays open)
      const paymentUrl = `${API_BASE}/payment/page/${paymentIntentId}?total=${encodeURIComponent("$" + total.toFixed(2))}`;
      WebBrowser.openBrowserAsync(paymentUrl, {
        toolbarColor: "#002B7F",
        controlsColor: "#C9A84C",
      });

      // 3. Switch to polling UI — button is gone, spinner is shown
      setSubmitting(false);
      cancelPollingRef.current = false;
      setPaymentStep("awaiting");
      setPollMsg(t.verifyingPayment ?? "Verifying payment...");

      // 4. Poll every 4 seconds for up to 5 minutes (75 attempts)
      const POLL_INTERVAL = 4000;
      const MAX_POLLS = 75;
      let succeeded = false;

      for (let i = 0; i < MAX_POLLS; i++) {
        if (cancelPollingRef.current) break;
        await new Promise<void>((r) => setTimeout(r, POLL_INTERVAL));
        if (cancelPollingRef.current) break;

        try {
          const statusRes = await fetch(`${API_BASE}/payment/intent/${paymentIntentId}`);
          const statusData = await statusRes.json();
          if (statusData.status === "succeeded") {
            succeeded = true;
            break;
          }
        } catch {
          // network blip — keep polling
        }
      }

      if (cancelPollingRef.current) {
        setPaymentStep("form");
        return;
      }

      if (succeeded) {
        setPollMsg(t.creatingOrder ?? "Creating order...");
        const order = await createOrderAfterPayment(paymentIntentId);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        clearCart();
        // Refresh customer profile so the next checkout has the freshly-saved
        // shipping address, name and phone pre-filled. Best-effort — don't
        // block the success navigation if this fails.
        if (isSignedIn) {
          refreshProfile().catch(() => {});
        }
        setPaymentStep("done");
        router.replace(`/order-success?orderId=${order.id}&orderNumber=${order.orderNumber}`);
      } else {
        setPaymentStep("form");
        Alert.alert(
          t.paymentPending ?? "Pago pendiente",
          t.paymentPendingMsg ?? "El pago no fue completado. Por favor intenta de nuevo.",
          [{ text: "OK" }]
        );
      }
    } catch (e) {
      setPaymentStep("form");
      setSubmitting(false);
      Alert.alert(t.orderError, t.orderErrorMsg);
    }
  };

  const handleCancelPolling = () => {
    cancelPollingRef.current = true;
    setPaymentStep("form");
  };

  if (paymentStep === "awaiting") {
    return (
      <View style={[styles.container, styles.awaitingContainer, { backgroundColor: colors.canvas }]}>
        <View style={[styles.awaitingCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: colors.radii.lg }]}>
          <View style={[styles.awaitingIconWrap, { backgroundColor: colors.v2.bg.brandSoft }]}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
          <Text style={[styles.awaitingTitle, { color: colors.foreground }]}>
            {t.verifyingPayment ?? "Verifying payment..."}
          </Text>
          <Text style={[styles.awaitingDesc, { color: colors.mutedForeground }]}>
            {t.verifyingPaymentDesc ?? "Complete your payment in the browser. This screen will update automatically."}
          </Text>
          <Text style={[styles.awaitingSubtext, { color: colors.mutedForeground }]}>
            {pollMsg}
          </Text>
          <Button
            title={t.cancelPayment ?? "Cancel"}
            variant="outline"
            onPress={handleCancelPolling}
            style={{ marginTop: 8, minWidth: 160 }}
          />
        </View>
      </View>
    );
  }

  const steps = [
    (t as any).stepShipping ?? "Shipping",
    (t as any).stepPayment ?? "Payment",
    (t as any).stepDone ?? "Done",
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      {/* Header: back · title · secure, then step indicator */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 6, backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t.goBack}
            hitSlop={6}
            style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <MaterialCommunityIcons name="chevron-left" size={28} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]} accessibilityRole="header">
            {(t as any).checkoutTitle ?? "Checkout"}
          </Text>
          <View style={styles.secure}>
            <MaterialCommunityIcons name="lock-outline" size={14} color={colors.v2.state.success} />
            <Text style={[styles.secureText, { color: colors.v2.state.success }]}>
              {(t as any).secureLabel ?? "Secure"}
            </Text>
          </View>
        </View>
        <View style={styles.steps} accessibilityRole="progressbar">
          {steps.map((label, i) => {
            const active = i === 0;
            return (
              <React.Fragment key={label}>
                {i > 0 && <View style={[styles.stepLine, { backgroundColor: colors.border }]} />}
                <View style={styles.step}>
                  <View
                    style={[
                      styles.stepDot,
                      active
                        ? { backgroundColor: colors.primary }
                        : { borderWidth: 1.5, borderColor: colors.v2.border.strong },
                    ]}
                  >
                    <Text style={[styles.stepNum, { color: active ? "#FFFFFF" : colors.mutedForeground }]}>
                      {i + 1}
                    </Text>
                  </View>
                  <Text style={[styles.stepLabel, { color: active ? colors.primary : colors.mutedForeground }]}>
                    {label}
                  </Text>
                </View>
              </React.Fragment>
            );
          })}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 96 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Signed-in banner */}
        {user && (
          <View style={[styles.banner, { backgroundColor: colors.v2.bg.brandSoft }]}>
            <View style={[styles.bannerIcon, { backgroundColor: colors.surface }]}>
              <MaterialCommunityIcons name="account-check-outline" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.bannerTitle, { color: colors.foreground }]}>
                {typeof t.signedInAs === "function" ? t.signedInAs(user.name) : `Signed in as ${user.name}`}
              </Text>
              {user.defaultAddress && (
                <Text style={[styles.bannerSub, { color: colors.v2.text.secondary }]}>
                  {typeof t.savedAddressUsed === "string" ? t.savedAddressUsed : "Saved address"} · {user.defaultAddress.city}, {user.defaultAddress.state}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Sign-in prompt — only shown to guests */}
        {!user && (
          <Pressable
            style={({ pressed }) => [styles.banner, { backgroundColor: colors.v2.bg.brandSoft, opacity: pressed ? 0.9 : 1 }]}
            onPress={() => router.push("/(auth)/sign-in")}
            testID="checkout-sign-in-banner"
            accessibilityRole="button"
          >
            <View style={[styles.bannerIcon, { backgroundColor: colors.surface }]}>
              <MaterialCommunityIcons name="account-outline" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.bannerTitle, { color: colors.foreground }]}>
                {t.signInForFasterCheckout ?? "Sign in for faster checkout"}
              </Text>
              <Text style={[styles.bannerSub, { color: colors.v2.text.secondary }]}>
                {t.signInCheckoutDesc ?? "Pre-fill your address and track your order with one tap."}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.primary} />
          </Pressable>
        )}

        {/* Contact */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>{t.contactInfo}</Text>
          <TextField label={`${t.yourName} *`} value={form.customerName} onChangeText={(v) => update("customerName", v)} autoCorrect={false} />
          <TextField label={`${t.email} *`} value={form.customerEmail} onChangeText={(v) => update("customerEmail", v)} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} containerStyle={{ marginBottom: 0 }} />
        </View>

        {/* Shipping address */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>{t.shippingAddress}</Text>
          <TextField label={`${t.fullName} *`} value={form.fullName} onChangeText={(v) => update("fullName", v)} autoCorrect={false} />
          <AddressAutocomplete
            label={t.addressLine1}
            value={form.line1}
            onChange={(v) => update("line1", v)}
            onAddressSelected={(parsed: ParsedAddress) => {
              setForm((prev) => ({
                ...prev,
                line1: parsed.line1 || prev.line1,
                city: parsed.city || prev.city,
                state: parsed.state || prev.state,
                zipCode: parsed.zipCode || prev.zipCode,
              }));
            }}
            placeholder={t.addressLine1Placeholder}
          />
          <TextField label={t.addressLine2} value={form.line2} onChangeText={(v) => update("line2", v)} placeholder={t.addressLine2Placeholder} autoCorrect={false} />
          <View style={styles.row}>
            <View style={{ flex: 2 }}>
              <TextField label={`${t.city} *`} value={form.city} onChangeText={(v) => update("city", v)} autoCorrect={false} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <TextField label={`${t.state} *`} value={form.state} onChangeText={(v) => update("state", v)} placeholder="TX" autoCorrect={false} autoCapitalize="characters" />
            </View>
          </View>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <TextField label={`${t.zip} *`} value={form.zipCode} onChangeText={(v) => update("zipCode", v)} keyboardType="numeric" autoCorrect={false} containerStyle={{ marginBottom: 0 }} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <TextField label={`${t.phone} *`} value={form.phone} onChangeText={(v) => update("phone", v)} keyboardType="phone-pad" autoCorrect={false} containerStyle={{ marginBottom: 0 }} />
            </View>
          </View>
        </View>

        {/* Free shipping notice */}
        {isFreeShipping && (
          <View style={[styles.freeShip, { backgroundColor: colors.v2.state.successSoft }]}>
            <MaterialCommunityIcons name="truck-check-outline" size={20} color={colors.v2.state.success} />
            <Text style={[styles.freeShipText, { color: colors.v2.state.success }]}>{t.freeShippingOnOrder}</Text>
          </View>
        )}

        {/* Order summary */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardTitleRow}>
            <Text style={[styles.cardTitle, { color: colors.foreground, marginBottom: 0 }]}>{t.orderSummary}</Text>
            <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="button">
              <Text style={[styles.editLink, { color: colors.primary }]}>
                {(t as any).cartItemsCount?.(itemCount) ?? t.cartTitle(itemCount)}
              </Text>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbStrip}>
            {items.map((item) => (
              <View key={item.id} style={styles.thumbWrap}>
                <Image
                  source={{ uri: item.productImageUrl }}
                  style={[styles.thumb, { backgroundColor: colors.v2.bg.accentSoft }]}
                />
                {item.quantity > 1 && (
                  <View style={[styles.thumbQty, { backgroundColor: colors.primary, borderColor: colors.surface }]}>
                    <Text style={styles.thumbQtyText}>×{item.quantity}</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          {items.map((item) => (
            <View key={item.id} style={styles.ledgerLine}>
              <Text style={[styles.ledgerQty, { color: colors.mutedForeground }]}>{item.quantity}×</Text>
              <Text style={[styles.ledgerName, { color: colors.foreground }]} numberOfLines={1}>
                {item.productName}
              </Text>
              <Text style={[styles.ledgerAmt, { color: colors.foreground }]}>${item.subtotal.toFixed(2)}</Text>
            </View>
          ))}

          <View style={[styles.divider, { backgroundColor: colors.v2.bg.muted }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{t.subtotal}</Text>
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{t.shippingLabel}</Text>
            <Text style={[styles.summaryValue, { color: isFreeShipping ? colors.v2.state.success : colors.foreground }]}>
              {isFreeShipping ? t.free : `$${shippingCost.toFixed(2)}`}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.v2.bg.muted }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.totalLabel, { color: colors.foreground }]}>{t.total}</Text>
            <Text style={[styles.totalAmount, { color: colors.foreground }]}>${total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Payment note */}
        <View style={styles.paymentNote}>
          <MaterialCommunityIcons name="shield-check-outline" size={18} color={colors.mutedForeground} />
          <Text style={[styles.paymentNoteText, { color: colors.mutedForeground }]}>{t.paymentSecureNote}</Text>
        </View>
      </ScrollView>

      {/* Submit bar */}
      <View style={[styles.submitBar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: bottomPad }]}>
        <Pressable
          testID="place-order-btn"
          onPress={handleSubmit}
          disabled={submitting}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.submitBtn,
            { backgroundColor: colors.primary, opacity: submitting ? 0.7 : pressed ? 0.9 : 1 },
          ]}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="lock-outline" size={18} color="#FFFFFF" />
              <Text style={styles.submitText}>{t.confirmOrder(total.toFixed(2))}</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  row: { flexDirection: "row" },

  // Header
  header: { paddingHorizontal: 12, paddingBottom: 14, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 22, fontFamily: fonts.display, letterSpacing: -0.2 },
  secure: { flexDirection: "row", alignItems: "center", gap: 5, paddingRight: 8 },
  secureText: { fontSize: 12, fontFamily: fonts.semibold },
  steps: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 8 },
  step: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepDot: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  stepNum: { fontSize: 11, fontFamily: fonts.bold },
  stepLabel: { fontSize: 12, fontFamily: fonts.bold },
  stepLine: { flex: 1, height: 2, borderRadius: 1 },

  scroll: { paddingHorizontal: 20, paddingTop: 16, gap: 16 },

  // Banners
  banner: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16 },
  bannerIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  bannerTitle: { fontSize: 14, fontFamily: fonts.bold },
  bannerSub: { fontSize: 12, fontFamily: fonts.regular, marginTop: 2, lineHeight: 17 },

  // Cards
  card: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 16 },
  cardTitle: { fontSize: 16, fontFamily: fonts.bold, marginBottom: 14 },
  cardTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  editLink: { fontSize: 13, fontFamily: fonts.semibold },

  freeShip: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 14 },
  freeShipText: { flex: 1, fontSize: 14, fontFamily: fonts.semibold },

  // Summary
  thumbStrip: { gap: 10, paddingTop: 6, paddingRight: 6, paddingBottom: 12 },
  thumbWrap: { position: "relative" },
  thumb: { width: 56, height: 56, borderRadius: 12, resizeMode: "cover" },
  thumbQty: {
    position: "absolute",
    right: -6,
    top: -6,
    minWidth: 24,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbQtyText: { color: "#FFFFFF", fontSize: 11, fontFamily: fonts.bold },
  ledgerLine: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  ledgerQty: { fontSize: 13, fontFamily: fonts.semibold, minWidth: 26 },
  ledgerName: { flex: 1, fontSize: 14, fontFamily: fonts.regular },
  ledgerAmt: { fontSize: 14, fontFamily: fonts.semibold },
  divider: { height: 1, marginVertical: 10 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingVertical: 3 },
  summaryLabel: { fontSize: 14, fontFamily: fonts.regular },
  summaryValue: { fontSize: 15, fontFamily: fonts.semibold },
  totalLabel: { fontSize: 16, fontFamily: fonts.bold },
  totalAmount: { fontSize: 24, fontFamily: fonts.display },

  paymentNote: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingHorizontal: 4 },
  paymentNoteText: { flex: 1, fontSize: 12, fontFamily: fonts.regular, lineHeight: 18 },

  // Submit
  submitBar: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  submitBtn: { height: 54, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  submitText: { color: "#FFFFFF", fontSize: 16, fontFamily: fonts.bold },

  // Awaiting payment
  awaitingContainer: { alignItems: "center", justifyContent: "center", padding: 24 },
  awaitingCard: { width: "100%", borderWidth: 1, padding: 32, alignItems: "center", gap: 16 },
  awaitingIconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  awaitingTitle: { fontSize: 22, fontFamily: fonts.display, textAlign: "center" },
  awaitingDesc: { fontSize: 14, fontFamily: fonts.regular, textAlign: "center", lineHeight: 22 },
  awaitingSubtext: { fontSize: 13, fontFamily: fonts.regular, textAlign: "center" },
});
