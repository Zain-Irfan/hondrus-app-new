import { useRouter } from "expo-router";
import React, { useState } from "react";
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

import { Icon } from "@/components/Icon";
import { useLanguage } from "@/context/LanguageContext";
import { useUser } from "@/context/UserContext";
import { useColors } from "@/hooks/useColors";
import { useOrders, type OrderSummary } from "@/hooks/useOrders";

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  confirmed: "#3b82f6",
  processing: "#8b5cf6",
  shipped: "#06b6d4",
  delivered: "#16a34a",
  cancelled: "#ef4444",
};

function OrderCard({
  order,
  colors,
  locale,
}: {
  order: OrderSummary;
  colors: ReturnType<typeof useColors>;
  locale: string;
}) {
  const { t } = useLanguage();
  const STATUS_LABELS: Record<string, string> = {
    pending: t.statusPending,
    confirmed: t.statusConfirmed,
    processing: t.statusProcessing,
    shipped: t.statusShipped,
    delivered: t.statusDelivered,
    cancelled: t.statusCancelled,
  };
  const statusColor = STATUS_COLORS[order.status] ?? "#6b7280";
  const statusLabel = STATUS_LABELS[order.status] ?? order.status;
  const [showItems, setShowItems] = useState(false);

  const itemCount = order.items.reduce((sum, i) => sum + (i.quantity ?? 0), 0);
  const previewImages = order.items.filter((i) => !!i.productImageUrl).slice(0, 3);
  const remainingCount = order.items.length - previewImages.length;

  const formattedDate = new Date(order.createdAt).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <View
      style={[
        styles.orderCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      {/* Top row: date label + status pill */}
      <View style={styles.cardTopRow}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>
            {(t as any).placedOn ?? "Placed on"}
          </Text>
          <Text style={[styles.metaValue, { color: colors.foreground }]} numberOfLines={1}>
            {formattedDate}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + "1F" }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      {/* Order number row */}
      <View style={[styles.numberRow, { backgroundColor: colors.secondary }]}>
        <Icon name="package" size={16} color={colors.primary} />
        <Text
          style={[styles.orderNumberText, { color: colors.primary }]}
          numberOfLines={1}
          ellipsizeMode="middle"
        >
          #{order.orderNumber}
        </Text>
      </View>

      {/* Items preview strip with stacked thumbnails */}
      <View style={styles.thumbsRow}>
        <View style={styles.thumbsStack}>
          {previewImages.length > 0 ? (
            previewImages.map((it, idx) => (
              <View
                key={idx}
                style={[
                  styles.thumb,
                  {
                    borderColor: colors.background,
                    backgroundColor: colors.background,
                    marginLeft: idx === 0 ? 0 : -12,
                    zIndex: previewImages.length - idx,
                  },
                ]}
              >
                <Image
                  source={{ uri: it.productImageUrl ?? undefined }}
                  style={styles.thumbImg}
                  resizeMode="cover"
                />
              </View>
            ))
          ) : (
            <View
              style={[
                styles.thumb,
                {
                  borderColor: colors.background,
                  backgroundColor: colors.secondary,
                  alignItems: "center",
                  justifyContent: "center",
                },
              ]}
            >
              <Icon name="package" size={20} color={colors.primary} />
            </View>
          )}
          {remainingCount > 0 && (
            <View
              style={[
                styles.thumb,
                styles.thumbMore,
                {
                  backgroundColor: colors.secondary,
                  borderColor: colors.background,
                  marginLeft: -12,
                },
              ]}
            >
              <Text style={[styles.thumbMoreText, { color: colors.primary }]}>
                +{remainingCount}
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.itemCountText, { color: colors.mutedForeground }]}>
          {(t as any).itemsInOrder
            ? (t as any).itemsInOrder(itemCount)
            : `${itemCount} items`}
        </Text>
      </View>

      {/* Total */}
      <View style={[styles.totalsRow, { borderTopColor: colors.border }]}>
        <Text style={[styles.totalsLabel, { color: colors.mutedForeground }]}>
          {t.orderTotal}
        </Text>
        <Text style={[styles.totalsAmount, { color: colors.primary }]}>
          ${order.total.toFixed(2)}
        </Text>
      </View>

      {/* Toggle items details */}
      <Pressable
        style={({ pressed }) => [styles.itemsToggle, { opacity: pressed ? 0.7 : 1 }]}
        onPress={() => setShowItems(!showItems)}
      >
        <Text style={[styles.itemsToggleText, { color: colors.primary }]}>
          {showItems ? t.hideItems(order.items.length) : t.showItems(order.items.length)}
        </Text>
        <Icon
          name={showItems ? "chevron-up" : "chevron-down"}
          size={16}
          color={colors.primary}
        />
      </Pressable>

      {showItems && (
        <View style={[styles.itemsList, { borderTopColor: colors.border }]}>
          {order.items.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              {item.productImageUrl ? (
                <Image
                  source={{ uri: item.productImageUrl }}
                  style={[styles.itemThumb, { backgroundColor: colors.secondary }]}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    styles.itemThumb,
                    {
                      backgroundColor: colors.secondary,
                      alignItems: "center",
                      justifyContent: "center",
                    },
                  ]}
                >
                  <Icon name="package" size={20} color={colors.primary} />
                </View>
              )}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={[styles.itemName, { color: colors.foreground }]}
                  numberOfLines={2}
                >
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
      )}
    </View>
  );
}

export default function MisPedidosScreen() {
  const colors = useColors();
  const { t, lang } = useLanguage();
  const router = useRouter();
  const { isSignedIn } = useUser();
  const { data: orders = [], isLoading: ordersLoading } = useOrders();

  const topPad = Platform.OS === "web" ? 67 + 16 : 16;
  const bottomPad = Platform.OS === "web" ? 84 + 34 : 90;

  const totalSpent = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const locale = lang === "en" ? "en-US" : "es-US";

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad, paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {isSignedIn
            ? ((t as any).myOrdersTitle ?? "Mis pedidos")
            : ((t as any).guestOrdersTitle ?? "Pedidos en este dispositivo")}
        </Text>
        {!isSignedIn && (
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {(t as any).guestOrdersHint ??
              "Inicia sesión más tarde y los asociaremos a tu cuenta."}
          </Text>
        )}
      </View>

      {/* Summary stats card */}
      {!ordersLoading && orders.length > 0 && (
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.primary, marginHorizontal: 20 },
          ]}
        >
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{orders.length}</Text>
            <Text style={styles.summaryLabel}>
              {(t as any).ordersPlaced ?? "Orders"}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>${totalSpent.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>{t.orderTotal}</Text>
          </View>
        </View>
      )}

      {/* Loading */}
      {ordersLoading && (
        <View style={{ padding: 48, alignItems: "center" }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      )}

      {/* Empty state */}
      {!ordersLoading && orders.length === 0 && (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIconWrap, { backgroundColor: colors.secondary }]}>
            <Icon name="package" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            {(t as any).emptyOrdersTitle ?? t.noOrdersYet ?? "No orders yet"}
          </Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            {(t as any).emptyOrdersSub ??
              "Your purchases will appear here once you place your first order."}
          </Text>
          <Pressable
            onPress={() => router.push("/")}
            style={({ pressed }) => [
              styles.emptyCta,
              { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <Text style={styles.emptyCtaText}>
              {(t as any).startShopping ?? t.shopNow ?? "Start shopping"}
            </Text>
            <Icon name="chevron-right" size={18} color="#fff" />
          </Pressable>
        </View>
      )}

      {/* Orders list */}
      {!ordersLoading &&
        orders.length > 0 &&
        orders.map((order) => (
          <OrderCard key={order.id} order={order} colors={colors} locale={locale} />
        ))}

      {/* Sign-in CTA for guests */}
      {!isSignedIn && (
        <Pressable
          style={({ pressed }) => [
            styles.signInCta,
            {
              backgroundColor: colors.secondary,
              borderColor: colors.primary,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          onPress={() => router.push("/(auth)/sign-in")}
        >
          <Icon name="user" size={20} color={colors.primary} />
          <Text style={[styles.signInCtaText, { color: colors.primary }]}>
            {(t as any).signInToSyncOrders ??
              "Sign in to sync these orders to your account"}
          </Text>
          <Icon name="chevron-right" size={18} color={colors.primary} />
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 26, fontFamily: "Inter_700Bold" },
  headerSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 6,
    lineHeight: 20,
  },

  summaryCard: {
    flexDirection: "row",
    alignItems: "stretch",
    padding: 18,
    borderRadius: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  summaryItem: { flex: 1, alignItems: "center", justifyContent: "center" },
  summaryValue: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#cbd5e1",
    marginTop: 4,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  summaryDivider: { width: 1, backgroundColor: "#ffffff30", marginHorizontal: 8 },

  emptyState: {
    alignItems: "center",
    marginHorizontal: 20,
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  emptySub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
    maxWidth: 280,
  },
  emptyCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 999,
    marginTop: 24,
  },
  emptyCtaText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },

  orderCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    marginHorizontal: 20,
    marginBottom: 14,
  },

  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    paddingBottom: 12,
    gap: 12,
  },
  metaLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  metaValue: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginTop: 3,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    flexShrink: 0,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontFamily: "Inter_700Bold" },

  numberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  orderNumberText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
    flex: 1,
  },

  thumbsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
    gap: 12,
  },
  thumbsStack: { flexDirection: "row", alignItems: "center" },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    overflow: "hidden",
  },
  thumbImg: { width: "100%", height: "100%" },
  thumbMore: { alignItems: "center", justifyContent: "center" },
  thumbMoreText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  itemCountText: { fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 },

  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 12,
    borderTopWidth: 1,
  },
  totalsLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  totalsAmount: { fontSize: 20, fontFamily: "Inter_700Bold" },

  itemsToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  itemsToggleText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },

  itemsList: { borderTopWidth: 1, padding: 16, gap: 12 },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  itemThumb: { width: 44, height: 44, borderRadius: 10 },
  itemName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  itemQty: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 2 },
  itemSubtotal: { fontSize: 14, fontFamily: "Inter_700Bold" },

  signInCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginHorizontal: 20,
    marginTop: 8,
  },
  signInCtaText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 20,
  },
});
