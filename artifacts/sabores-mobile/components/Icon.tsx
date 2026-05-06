import React from "react";
import { Text, TextStyle } from "react-native";

const ICONS: Record<string, string> = {
  "home":          "⌂",
  "grid":          "⊞",
  "package":       "📦",
  "shopping-bag":  "🛍",
  "search":        "🔍",
  "x":             "✕",
  "minus":         "−",
  "plus":          "+",
  "truck":         "🚚",
  "arrow-right":   "→",
  "check":         "✓",
  "check-circle":  "✅",
  "star":          "★",
  "map-pin":       "📍",
  "alert-circle":  "⚠️",
  "mail":          "✉️",
  "copy":          "📋",
  "chevron-up":    "▲",
  "chevron-down":  "▼",
  "chevron-right": "›",
  "info":          "ℹ️",
  "shield":        "🛡",
  "user":          "👤",
  "user-check":    "👤✓",
  "log-in":        "→",
  "log-out":       "←",
  "edit-2":        "✏️",
  "plus-circle":   "⊕",
  "phone":         "📞",
  "zap":           "⚡",
  "lock":          "🔒",
  "globe":         "🌐",
};

interface Props {
  name: string;
  size?: number;
  color?: string;
  style?: TextStyle | TextStyle[];
}

export function Icon({ name, size = 20, color, style }: Props) {
  return (
    <Text
      style={[
        {
          fontSize: size * 0.9,
          lineHeight: size * 1.2,
          color,
          textAlign: "center",
          includeFontPadding: false,
        },
        style,
      ]}
    >
      {ICONS[name] ?? "·"}
    </Text>
  );
}
