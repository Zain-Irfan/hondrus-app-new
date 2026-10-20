import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { fonts } from "@/constants/fonts";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

export type OrderStatus =
  | "confirmed"
  | "packing"
  | "shipped"
  | "on_the_way"
  | "delivered"
  | "cancelled";

const ORDER: OrderStatus[] = [
  "confirmed",
  "packing",
  "shipped",
  "on_the_way",
  "delivered",
];

interface Stop {
  key: OrderStatus;
  title: string;
  hint: string;
}

interface Props {
  current: OrderStatus;
  stops?: Stop[];
  estimateRange?: string;
  header?: string;
}

export function OrderTimeline({
  current,
  stops,
  estimateRange,
  header,
}: Props) {
  const colors = useColors();
  const { t } = useLanguage();

  const localizedStops: Stop[] = useMemo(
    () =>
      stops ?? [
        {
          key: "confirmed",
          title: (t as any).statusConfirmedV2 ?? t.statusConfirmed,
          hint: (t as any).timelineConfirmedNote ?? "",
        },
        {
          key: "packing",
          title: (t as any).statusPackingV2 ?? t.statusProcessing,
          hint: (t as any).timelinePackingNote ?? "",
        },
        {
          key: "shipped",
          title: (t as any).statusShippedV2 ?? t.statusShipped,
          hint: (t as any).timelineShippedNote ?? "",
        },
        {
          key: "on_the_way",
          title: (t as any).statusOnTheWay ?? t.statusShipped,
          hint: (t as any).timelineOnTheWayNote ?? "",
        },
        {
          key: "delivered",
          title: (t as any).statusDeliveredV2 ?? t.statusDelivered,
          hint: (t as any).timelineDeliveredNote ?? "",
        },
      ],
    [stops, t],
  );

  const headerLabel = header ?? (t as any).timelineHeader ?? "Order status";
  const cancelledTitle = (t as any).orderCancelledTitle ?? t.statusCancelled;
  const cancelledHint =
    (t as any).orderCancelledHint ?? "If this was a mistake, contact us by chat or email.";

  if (current === "cancelled") {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.header, { color: colors.foreground }]}>{cancelledTitle}</Text>
        <Text style={[styles.estimate, { color: colors.mutedForeground }]}>{cancelledHint}</Text>
      </View>
    );
  }

  const currentIdx = ORDER.indexOf(current);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={[styles.header, { color: colors.foreground }]}>{headerLabel}</Text>
      {estimateRange && (
        <Text style={[styles.estimate, { color: colors.mutedForeground }]}>
          {typeof (t as any).timelineEstimate === "function"
            ? (t as any).timelineEstimate(estimateRange)
            : `Estimated: ${estimateRange}`}
        </Text>
      )}

      <View style={styles.list}>
        {localizedStops.map((stop, idx) => {
          const stopIdx = ORDER.indexOf(stop.key);
          const isDone = stopIdx < currentIdx;
          const isActive = stopIdx === currentIdx;
          const isLast = idx === localizedStops.length - 1;

          const green = colors.v2.state.success;
          const lineColor = isDone ? green : colors.border;

          return (
            <View key={stop.key} style={styles.row}>
              <View style={styles.dotCol}>
                {isDone ? (
                  <View style={[styles.dot, { backgroundColor: green }]}>
                    <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
                  </View>
                ) : isActive ? (
                  <View style={[styles.dot, styles.dotActive, { borderColor: colors.primary }]}>
                    <View style={[styles.dotCore, { backgroundColor: colors.primary }]} />
                  </View>
                ) : (
                  <View style={[styles.dot, { borderWidth: 2, borderColor: colors.v2.border.strong }]} />
                )}
                {!isLast && <View style={[styles.line, { backgroundColor: lineColor }]} />}
              </View>

              <View style={[styles.info, isLast && { paddingBottom: 0 }]}>
                <Text
                  style={[
                    styles.title,
                    {
                      color: isActive ? colors.primary : isDone ? colors.foreground : colors.mutedForeground,
                    },
                  ]}
                >
                  {stop.title}
                </Text>
                {!!stop.hint && (
                  <Text style={[styles.hint, { color: colors.mutedForeground }]}>{stop.hint}</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
  },
  header: {
    fontSize: 16,
    fontFamily: fonts.bold,
    marginBottom: 12,
  },
  estimate: {
    fontSize: 13,
    fontFamily: fonts.regular,
    marginTop: -8,
    marginBottom: 14,
  },
  list: {
    paddingLeft: 2,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    minHeight: 44,
  },
  dotCol: {
    alignItems: "center",
    width: 24,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dotActive: { borderWidth: 2 },
  dotCore: { width: 10, height: 10, borderRadius: 5 },
  line: {
    flex: 1,
    width: 2,
    marginVertical: 4,
    minHeight: 14,
  },
  info: {
    flex: 1,
    paddingTop: 2,
    paddingBottom: 14,
  },
  title: {
    fontSize: 14,
    fontFamily: fonts.bold,
    marginBottom: 2,
  },
  hint: {
    fontSize: 13,
    fontFamily: fonts.regular,
    lineHeight: 18,
  },
});
