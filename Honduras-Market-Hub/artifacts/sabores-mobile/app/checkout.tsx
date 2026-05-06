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
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/Icon";
import { AddressAutocomplete, type ParsedAddress } from "@/components/AddressAutocomplete";
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

function SectionHeader({ title, colors }: { title: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.sectionHeaderWrap, { borderLeftColor: colors.gold, borderLeftWidth: 4 }]}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  keyboardType,
  required = true,
  colors,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
  required?: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
        {label}{required && " *"}
      </Text>
      <TextInput
        style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, fontFamily: "Inter_500Medium" }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? label}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType ?? "default"}
        autoCorrect={false}
        autoCapitalize="none"
      />
    </View>
  );
}

export default function CheckoutScreen() {
  const colors = useColors();
  const { t } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, subtotal, clearCart } = useCart();
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
      <View style={[styles.container, styles.awaitingContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.awaitingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.awaitingIconWrap, { backgroundColor: colors.primary + "15" }]}>
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
          <Pressable
            style={[styles.cancelBtn, { borderColor: colors.border }]}
            onPress={handleCancelPolling}
          >
            <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>
              {t.cancelPayment ?? "Cancel"}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 80 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Signed-in banner */}
        {user && (
          <View style={[styles.signedInBanner, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "40" }]}>
            <Icon name="user" size={18} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.signedInText, { color: colors.primary }]}>
                {typeof t.signedInAs === "function" ? t.signedInAs(user.name) : `Signed in as ${user.name}`}
              </Text>
              {user.defaultAddress && (
                <Text style={[styles.signedInSub, { color: colors.mutedForeground }]}>
                  {typeof t.savedAddressUsed === "string" ? t.savedAddressUsed : "Saved address"} · {user.defaultAddress.city}, {user.defaultAddress.state}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Sign-in prompt — only shown to guests */}
        {!user && (
          <Pressable
            style={[styles.signInPromptBanner, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "35" }]}
            onPress={() => router.push("/(auth)/sign-in")}
            testID="checkout-sign-in-banner"
          >
            <View style={[styles.signInPromptIcon, { backgroundColor: colors.primary + "18" }]}>
              <Icon name="user" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.signInPromptTitle, { color: colors.primary }]}>
                {t.signInForFasterCheckout ?? "Sign in for faster checkout"}
              </Text>
              <Text style={[styles.signInPromptSub, { color: colors.mutedForeground }]}>
                {t.signInCheckoutDesc ?? "Pre-fill your address and track your order with one tap."}
              </Text>
            </View>
            <Icon name="chevron-right" size={18} color={colors.primary} />
          </Pressable>
        )}

        {/* Customer Info */}
        <SectionHeader title={t.contactInfo} colors={colors} />
        <Field label={t.yourName} value={form.customerName} onChange={(v) => update("customerName", v)} colors={colors} />
        <Field label={t.email} value={form.customerEmail} onChange={(v) => update("customerEmail", v)} keyboardType="email-address" colors={colors} />

        {/* Shipping Address */}
        <View style={{ marginTop: 24 }}><SectionHeader title={t.shippingAddress} colors={colors} /></View>
        <Field label={t.fullName} value={form.fullName} onChange={(v) => update("fullName", v)} colors={colors} />
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
        <Field label={t.addressLine2} value={form.line2} onChange={(v) => update("line2", v)} placeholder={t.addressLine2Placeholder} required={false} colors={colors} />
        <View style={styles.row}>
          <View style={{ flex: 2 }}>
            <Field label={t.city} value={form.city} onChange={(v) => update("city", v)} colors={colors} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Field label={t.state} value={form.state} onChange={(v) => update("state", v)} placeholder="TX" colors={colors} />
          </View>
        </View>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Field label={t.zip} value={form.zipCode} onChange={(v) => update("zipCode", v)} keyboardType="numeric" colors={colors} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Field label={t.phone} value={form.phone} onChange={(v) => update("phone", v)} keyboardType="phone-pad" colors={colors} />
          </View>
        </View>

        {/* Shipping notice — single flat rate, no carrier selection */}
        {isFreeShipping && (
          <View style={[styles.freeShipBanner, { backgroundColor: colors.goldLight, marginTop: 24 }]}>
            <Icon name="truck" size={18} color={colors.gold} />
            <Text style={[styles.freeShipText, { color: colors.primary }]}>{t.freeShippingOnOrder}</Text>
          </View>
        )}

        {/* Order Summary */}
        <View style={{ marginTop: 24 }}><SectionHeader title={t.orderSummary} colors={colors} /></View>
        <View style={[styles.summary, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {items.map((item) => (
            <View key={item.id} style={styles.summaryItemRow}>
              <Image source={{ uri: item.productImageUrl }} style={styles.summaryThumb} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.summaryItemName, { color: colors.foreground }]} numberOfLines={1}>
                  {item.productName}
                </Text>
                <Text style={[styles.summaryItemQty, { color: colors.mutedForeground }]}>
                  {t.quantity}: {item.quantity}
                </Text>
              </View>
              <Text style={[styles.summaryItemPrice, { color: colors.foreground }]}>
                ${item.subtotal.toFixed(2)}
              </Text>
            </View>
          ))}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{t.subtotal}</Text>
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{t.shippingLabel}</Text>
            <Text style={[styles.summaryValue, { color: isFreeShipping ? colors.success : colors.foreground }]}>
              {isFreeShipping ? t.free : `$${shippingCost.toFixed(2)}`}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.totalLabel, { color: colors.foreground }]}>{t.total}</Text>
            <Text style={[styles.totalAmount, { color: colors.primary }]}>${total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Payment info note */}
        <View style={[styles.paymentNote, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Icon name="lock" size={16} color={colors.gold} />
          <Text style={[styles.paymentNoteText, { color: colors.mutedForeground }]}>
            {t.paymentSecureNote}
          </Text>
        </View>
      </ScrollView>

      {/* Submit Bar */}
      <View style={[styles.submitBar, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: bottomPad }]}>
        <Pressable
          testID="place-order-btn"
          style={({ pressed }) => [
            styles.submitBtn,
            {
              backgroundColor: colors.primary,
              borderColor: colors.gold,
              borderWidth: 2,
              opacity: submitting ? 0.85 : pressed ? 0.82 : 1,
              transform: [{ scale: pressed && !submitting ? 0.97 : 1 }],
            },
          ]}
          onPress={handleSubmit}
          disabled={submitting}
          android_ripple={{ color: "rgba(201,168,76,0.25)", borderless: false }}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.submitBtnText}>{t.confirmOrder(total.toFixed(2))}</Text>
              <Icon name="check-circle" size={20} color={colors.gold} />
            </>
          )}
        </Pressable>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionHeaderWrap: { paddingLeft: 12, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  fieldWrap: { marginBottom: 16 },
  fieldLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 8, marginLeft: 4 },
  fieldInput: { height: 52, borderRadius: 26, borderWidth: 1, paddingHorizontal: 20, fontSize: 15 },
  row: { flexDirection: "row" },
  freeShipBanner: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 12, marginBottom: 16 },
  freeShipText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  shippingOption: { flexDirection: "row", alignItems: "center", gap: 16, padding: 16, borderRadius: 16, borderWidth: 2, marginBottom: 12 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  optionCarrier: { fontSize: 16, fontFamily: "Inter_700Bold" },
  optionDays: { fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 4 },
  optionPrice: { fontSize: 16, fontFamily: "Inter_700Bold" },
  summary: { borderRadius: 16, borderWidth: 1, padding: 20, gap: 12 },
  summaryItemRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  summaryThumb: { width: 48, height: 48, borderRadius: 8, backgroundColor: "#eee" },
  summaryItemName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  summaryItemQty: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  summaryItemPrice: { fontSize: 15, fontFamily: "Inter_700Bold" },
  divider: { height: 1, marginVertical: 4 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { fontSize: 15, fontFamily: "Inter_500Medium" },
  summaryValue: { fontSize: 15, fontFamily: "Inter_700Bold" },
  totalLabel: { fontSize: 18, fontFamily: "Inter_700Bold" },
  totalAmount: { fontSize: 24, fontFamily: "Inter_700Bold" },
  paymentNote: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginTop: 16 },
  paymentNoteText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  submitBar: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 16, borderTopWidth: 1, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 10 },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, paddingVertical: 18, borderRadius: 50 },
  submitBtnText: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold" },
  awaitingContainer: { alignItems: "center", justifyContent: "center", padding: 24 },
  awaitingCard: { width: "100%", borderRadius: 24, borderWidth: 1, padding: 32, alignItems: "center", gap: 16 },
  awaitingIconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  awaitingTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  awaitingDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  awaitingSubtext: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  cancelBtn: { marginTop: 8, paddingVertical: 12, paddingHorizontal: 32, borderRadius: 50, borderWidth: 1 },
  cancelBtnText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  signedInBanner: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  signedInText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  signedInSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  // Sign-in prompt banner
  signInPromptBanner: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 20 },
  signInPromptIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  signInPromptTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  signInPromptSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2, lineHeight: 17 },
  // Quick sign-in modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingTop: 12, alignItems: "center" },
  modalHandle: { width: 40, height: 4, borderRadius: 2, marginBottom: 20 },
  modalIconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 8, textAlign: "center" },
  modalSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20, marginBottom: 24 },
  modalLabel: { alignSelf: "flex-start", fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 8, marginLeft: 4 },
  modalInput: { width: "100%", height: 52, borderRadius: 26, borderWidth: 1, paddingHorizontal: 20, fontSize: 15, marginBottom: 16 },
  modalBtn: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 50, marginBottom: 12 },
  modalBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  modalGuestBtn: { paddingVertical: 12, paddingHorizontal: 24 },
  modalGuestText: { fontSize: 14, fontFamily: "Inter_500Medium" },
});
