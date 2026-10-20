import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { OrderTimeline, type OrderStatus } from "@/components/OrderTimeline";
import { Chip, EmptyState } from "@/components/ui";
import { fonts } from "@/constants/fonts";
import { useLanguage } from "@/context/LanguageContext";
import { useUser } from "@/context/UserContext";
import { useColors } from "@/hooks/useColors";
import { useOrders, type OrderSummary } from "@/hooks/useOrders";
import { useGuestId } from "@/lib/guestId";

type FilterKey = "all" | "active" | "delivered" | "cancelled";

function mapStatusToTimeline(status: string): OrderStatus {
  switch (status) {
    case "pending":
    case "confirmed":
      return "confirmed";
    case "processing":
      return "packing";
    case "shipped":
      return "shipped";
    case "delivered":
      return "delivered";
    case "cancelled":
      return "cancelled";
    default:
      return "confirmed";
  }
}

function statusTone(
  status: string,
  colors: ReturnType<typeof useColors>,
): { fg: string; bg: string } {
  const s = colors.v2.state;
  switch (status) {
    case "pending":
      return { fg: s.warning, bg: s.warningSoft };
    case "confirmed":
    case "processing":
      return { fg: s.info, bg: s.infoSoft };
    case "shipped":
      return { fg: colors.primary, bg: colors.v2.bg.brandSoft };
    case "delivered":
      return { fg: s.success, bg: s.successSoft };
    case "cancelled":
      return { fg: s.danger, bg: s.dangerSoft };
    default:
      return { fg: colors.mutedForeground, bg: colors.muted };
  }
}

function OrderCard({
  order,
  locale,
}: {
  order: OrderSummary;
  locale: string;
}) {
  const colors = useColors();
  const { t } = useLanguage();
  const STATUS_LABELS: Record<string, string> = {
    pending: t.statusPending,
    confirmed: t.statusConfirmed,
    processing: t.statusProcessing,
    shipped: t.statusShipped,
    delivered: t.statusDelivered,
    cancelled: t.statusCancelled,
  };
  const tone = statusTone(order.status, colors);
  const statusLabel = STATUS_LABELS[order.status] ?? order.status;
  const [showItems, setShowItems] = useState(false);

  const itemCount = order.items.reduce((sum, i) => sum + (i.quantity ?? 0), 0);
  const previewImages = order.items.filter((i) => !!i.productImageUrl).slice(0, 3);
  const remainingCount = order.items.length - previewImages.length;

  const formattedDate = new Date(order.createdAt).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const itemsLabel = (t as any).itemsInOrder ? (t as any).itemsInOrder(itemCount) : `${itemCount} items`;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable
        style={({ pressed }) => [styles.cardBody, { opacity: pressed ? 0.8 : 1 }]}
        onPress={() => setShowItems(!showItems)}
        accessibilityRole="button"
        accessibilityState={{ expanded: showItems }}
      >
        <View style={styles.cardHead}>
          <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
            <Text
              style={[styles.orderNumber, { color: colors.foreground }]}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              #{order.orderNumber}
            </Text>
            <Text style={[styles.orderMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
              {formattedDate} · {itemsLabel} · ${order.total.toFixed(2)}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: tone.bg }]}>
            <Text style={[styles.statusText, { color: tone.fg }]}>{statusLabel}</Text>
          </View>
        </View>

        <View style={styles.cardFoot}>
          <View style={styles.thumbs}>
            {previewImages.length > 0 ? (
              previewImages.map((it, idx) => (
                <Image
                  key={idx}
                  source={{ uri: it.productImageUrl ?? undefined }}
                  style={[styles.thumb, { backgroundColor: colors.v2.bg.accentSoft }]}
                  resizeMode="cover"
                />
              ))
            ) : (
              <View style={[styles.thumb, styles.thumbCenter, { backgroundColor: colors.v2.bg.brandSoft }]}>
                <MaterialCommunityIcons name="package-variant" size={20} color={colors.primary} />
              </View>
            )}
            {remainingCount > 0 && (
              <View style={[styles.thumb, styles.thumbCenter, { backgroundColor: colors.v2.bg.muted }]}>
                <Text style={[styles.thumbMoreText, { color: colors.v2.text.secondary }]}>+{remainingCount}</Text>
              </View>
            )}
          </View>
          <View style={styles.detailsToggle}>
            <Text style={[styles.detailsText, { color: colors.primary }]}>
              {(t as any).orderDetails ?? "Details"}
            </Text>
            <MaterialCommunityIcons
              name={showItems ? "chevron-up" : "chevron-down"}
              size={20}
              color={colors.primary}
            />
          </View>
        </View>
      </Pressable>

      {showItems && (
        <View style={[styles.expanded, { borderTopColor: colors.v2.bg.muted }]}>
          {!!order.trackingNumber && (
            <View style={[styles.tracking, { backgroundColor: colors.canvas }]}>
              <View style={[styles.trackingIcon, { backgroundColor: colors.surface }]}>
                <MaterialCommunityIcons name="truck-outline" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.trackingLabel, { color: colors.mutedForeground }]}>
                  {(t as any).trackingLabel ?? "Tracking"}
                </Text>
                <Text selectable style={[styles.trackingValue, { color: colors.foreground }]} numberOfLines={1}>
                  {order.trackingNumber}
                </Text>
              </View>
            </View>
          )}

          <OrderTimeline current={mapStatusToTimeline(order.status)} />

          <View style={styles.items}>
            {order.items.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                {item.productImageUrl ? (
                  <Image
                    source={{ uri: item.productImageUrl }}
                    style={[styles.itemThumb, { backgroundColor: colors.v2.bg.accentSoft }]}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.itemThumb, styles.thumbCenter, { backgroundColor: colors.v2.bg.brandSoft }]}>
                    <MaterialCommunityIcons name="package-variant" size={18} color={colors.primary} />
                  </View>
                )}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={2}>
                    {item.productName}
                  </Text>
                  <Text style={[styles.itemQty, { color: colors.mutedForeground }]}>
                    ×{item.quantity} · ${item.price.toFixed(2)}
                  </Text>
                </View>
                <Text style={[styles.itemSubtotal, { color: colors.foreground }]}>
                  ${(item.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          <View style={[styles.ledgerTotal, { borderTopColor: colors.v2.bg.muted }]}>
            <Text style={[styles.totalsLabel, { color: colors.mutedForeground }]}>{t.orderTotal}</Text>
            <Text style={[styles.totalsAmount, { color: colors.foreground }]}>${order.total.toFixed(2)}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

export default function MisPedidosScreen() {
  const colors = useColors();
  const { t, lang } = useLanguage();
  const router = useRouter();
  const { isSignedIn, loading: userLoading } = useUser();
  const guestId = useGuestId();
  const { data: orders = [], isFetching, isError, refetch, isRefetching } = useOrders();
  // Spinner only while auth/guest-id resolve or an actual request is in flight — never forever.
  const ordersLoading =
    userLoading || (!isSignedIn && !guestId) || isFetching;
  const [filter, setFilter] = useState<FilterKey>("all");
  const insets = useSafeAreaInsets();

  const topPad = Platform.OS === "web" ? 67 + 16 : insets.top + 12;
  const bottomPad = Platform.OS === "web" ? 84 + 34 : 90 + insets.bottom;

  const totalSpent = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const locale = lang === "en" ? "en-US" : "es-US";

  const filtered = useMemo(() => {
    if (filter === "all") return orders;
    if (filter === "delivered") return orders.filter((o) => o.status === "delivered");
    if (filter === "cancelled") return orders.filter((o) => o.status === "cancelled");
    return orders.filter((o) => !["delivered", "cancelled"].includes(o.status));
  }, [orders, filter]);

  const filters: { key: FilterKey; label: string }[] = [
    { key: "all", label: (t as any).filterAll ?? "All" },
    { key: "active", label: (t as any).filterActive ?? "Active" },
    { key: "delivered", label: t.statusDelivered },
    { key: "cancelled", label: t.statusCancelled },
  ];

  const hasOrders = !ordersLoading && !isError && orders.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      {/* White title bar */}
      <View style={[styles.header, { paddingTop: topPad, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]} accessibilityRole="header">
          {isSignedIn
            ? ((t as any).myOrdersTitle ?? "Mis pedidos")
            : ((t as any).guestOrdersTitle ?? "Pedidos en este dispositivo")}
        </Text>
        {!isSignedIn && (
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {(t as any).guestOrdersHint ?? "Inicia sesión más tarde y los asociaremos a tu cuenta."}
          </Text>
        )}
        {hasOrders && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
            style={styles.filterScroll}
          >
            {filters.map((f) => (
              <Chip key={f.key} label={f.label} selected={filter === f.key} onPress={() => setFilter(f.key)} />
            ))}
          </ScrollView>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {hasOrders && (
          <View style={styles.stats}>
            <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{orders.length}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                {(t as any).ordersPlaced ?? "Orders"}
              </Text>
            </View>
            <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>${totalSpent.toFixed(2)}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{t.orderTotal}</Text>
            </View>
          </View>
        )}

        {ordersLoading && (
          <View style={{ padding: 48, alignItems: "center" }}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        )}

        {isError && (
          <EmptyState
            icon={<MaterialCommunityIcons name="alert-circle-outline" size={32} color={colors.primary} />}
            title={(t as any).loadErrorTitle ?? "Couldn't load orders"}
            subtitle={(t as any).loadErrorSub ?? "Check your connection and try again."}
            actionLabel={isRefetching ? (t.loading ?? "Loading...") : ((t as any).retry ?? "Retry")}
            onAction={() => refetch()}
          />
        )}

        {!ordersLoading && !isError && orders.length === 0 && (
          <EmptyState
            icon={<MaterialCommunityIcons name="package-variant" size={36} color={colors.primary} />}
            title={(t as any).emptyOrdersTitle ?? t.noOrdersYet ?? "No orders yet"}
            subtitle={
              (t as any).emptyOrdersSub ?? "Your purchases will appear here once you place your first order."
            }
            actionLabel={(t as any).startShopping ?? t.shopNow ?? "Start shopping"}
            onAction={() => router.push("/")}
          />
        )}

        {!ordersLoading &&
          !isError &&
          filtered.map((order) => <OrderCard key={order.id} order={order} locale={locale} />)}

        {!isSignedIn && (
          <Pressable
            style={({ pressed }) => [
              styles.signInCta,
              { backgroundColor: colors.v2.bg.brandSoft, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => router.push("/(auth)/sign-in")}
            accessibilityRole="button"
          >
            <View style={[styles.signInIcon, { backgroundColor: colors.surface }]}>
              <MaterialCommunityIcons name="account-outline" size={22} color={colors.primary} />
            </View>
            <Text style={[styles.signInCtaText, { color: colors.foreground }]}>
              {(t as any).signInToSyncOrders ?? "Sign in to sync these orders to your account"}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.primary} />
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: { paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontSize: 28, fontFamily: fonts.display, letterSpacing: -0.4 },
  headerSub: { fontSize: 13, fontFamily: fonts.regular, lineHeight: 19, marginTop: 4 },
  filterScroll: { marginTop: 14, marginHorizontal: -20 },
  filterRow: { paddingHorizontal: 20, gap: 8 },

  scroll: { paddingHorizontal: 20, paddingTop: 16, gap: 12 },

  // Stats
  stats: { flexDirection: "row", gap: 12 },
  stat: { flex: 1, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14 },
  statValue: { fontSize: 22, fontFamily: fonts.display },
  statLabel: { fontSize: 12, fontFamily: fonts.medium, marginTop: 2 },

  // Order card
  card: { borderWidth: 1, borderRadius: 18, overflow: "hidden" },
  cardBody: { padding: 16, gap: 14 },
  cardHead: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  orderNumber: { fontSize: 16, fontFamily: fonts.bold },
  orderMeta: { fontSize: 13, fontFamily: fonts.regular },
  statusPill: { height: 28, paddingHorizontal: 10, borderRadius: 14, justifyContent: "center", flexShrink: 0 },
  statusText: { fontSize: 12, fontFamily: fonts.bold },
  cardFoot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  thumbs: { flexDirection: "row", gap: 8 },
  thumb: { width: 48, height: 48, borderRadius: 10, overflow: "hidden" },
  thumbCenter: { alignItems: "center", justifyContent: "center" },
  thumbMoreText: { fontSize: 13, fontFamily: fonts.bold },
  detailsToggle: { flexDirection: "row", alignItems: "center", gap: 2, minHeight: 44 },
  detailsText: { fontSize: 14, fontFamily: fonts.semibold },

  // Expanded
  expanded: { borderTopWidth: 1, padding: 16, gap: 14 },
  tracking: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 14 },
  trackingIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  trackingLabel: { fontSize: 12, fontFamily: fonts.medium },
  trackingValue: { fontSize: 14, fontFamily: fonts.bold, marginTop: 1 },
  items: { gap: 12 },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  itemThumb: { width: 44, height: 44, borderRadius: 10 },
  itemName: { fontSize: 14, fontFamily: fonts.semibold },
  itemQty: { fontSize: 12, fontFamily: fonts.regular, marginTop: 2 },
  itemSubtotal: { fontSize: 14, fontFamily: fonts.semibold },
  ledgerTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    paddingTop: 12,
    borderTopWidth: 1,
  },
  totalsLabel: { fontSize: 14, fontFamily: fonts.regular },
  totalsAmount: { fontSize: 18, fontFamily: fonts.display },

  // Guest sign-in
  signInCta: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, marginTop: 4 },
  signInIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  signInCtaText: { flex: 1, fontSize: 14, fontFamily: fonts.semibold, lineHeight: 20 },
});
