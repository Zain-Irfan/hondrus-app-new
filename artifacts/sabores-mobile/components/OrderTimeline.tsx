import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

/**
 * OrderTimeline — vertical 5-stop status timeline.
 * New in Phase 1.5; designed in mockup #09 (order-success).
 *
 * Status states: confirmed → packing → shipped → on_the_way → delivered
 * Pass `current` as one of those keys; the timeline marks all earlier
 * stops `done` and the matching one `active`.
 */

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
  stops?: Stop[];                 // optional override (e.g. localized labels)
  estimateRange?: string;         // "12 – 14 de mayo"
  header?: string;                // section header label
}

const DEFAULT_STOPS: Stop[] = [
  { key: "confirmed", title: "Confirmado", hint: "Acabamos de recibir tu pedido" },
  { key: "packing", title: "En empaque", hint: "Llegamos en 1–2 días" },
  { key: "shipped", title: "Enviado", hint: "Te enviamos el rastreo por correo" },
  { key: "on_the_way", title: "En camino", hint: "5–7 días hábiles" },
  { key: "delivered", title: "Entregado", hint: "Sabores, hasta tu puerta" },
];

export function OrderTimeline({
  current,
  stops = DEFAULT_STOPS,
  estimateRange,
  header = "Estado del pedido",
}: Props) {
  const colors = useColors();

  if (current === "cancelled") {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.header, { color: colors.foreground }]}>Pedido cancelado</Text>
        <Text style={[styles.estimate, { color: colors.mutedForeground }]}>
          Si fue un error, escribinos por chat o correo.
        </Text>
      </View>
    );
  }

  const currentIdx = ORDER.indexOf(current);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.header, { color: colors.foreground }]}>{header}</Text>
      {estimateRange && (
        <Text style={[styles.estimate, { color: colors.mutedForeground }]}>
          Estimado: {estimateRange}
        </Text>
      )}

      <View style={styles.list}>
        {stops.map((stop, idx) => {
          const stopIdx = ORDER.indexOf(stop.key);
          const isDone = stopIdx < currentIdx;
          const isActive = stopIdx === currentIdx;
          const isLast = idx === stops.length - 1;

          const dotColor = isDone
            ? colors.success
            : isActive
            ? colors.primary
            : "transparent";
          const ringColor = isDone
            ? colors.success
            : isActive
            ? colors.primary
            : colors.border;
          const lineColor = isDone ? colors.success : colors.border;

          return (
            <View key={stop.key} style={styles.row}>
              {/* dot column */}
              <View style={styles.dotCol}>
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: dotColor,
                      borderColor: ringColor,
                    },
                    isActive && {
                      shadowColor: colors.primary,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.25,
                      shadowRadius: 6,
                      elevation: 4,
                    },
                  ]}
                />
                {!isLast && (
                  <View style={[styles.line, { backgroundColor: lineColor }]} />
                )}
              </View>

              {/* info column */}
              <View style={[styles.info, isLast && { paddingBottom: 0 }]}>
                <Text
                  style={[
                    styles.title,
                    {
                      color: isActive
                        ? colors.primary
                        : isDone
                        ? colors.success
                        : colors.foreground,
                    },
                  ]}
                >
                  {stop.title}
                </Text>
                <Text style={[styles.hint, { color: colors.mutedForeground }]}>
                  {stop.hint}
                </Text>
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
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  header: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  estimate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
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
    width: 14,
    height: 14,
    borderRadius: 999,
    borderWidth: 2,
    marginTop: 4,
  },
  line: {
    flex: 1,
    width: 2,
    marginVertical: 4,
    minHeight: 14,
  },
  info: {
    flex: 1,
    paddingTop: 2,
    paddingBottom: 12,
  },
  title: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  hint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
