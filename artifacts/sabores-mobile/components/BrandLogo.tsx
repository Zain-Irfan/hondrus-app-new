import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { fonts } from "@/constants/fonts";

const NAVY = "#002B7F";
const GOLD = "#C9A84C";

interface MarkProps {
  size?: number;
  /** "gold": gold tile, navy symbol (for navy backgrounds). "navy": the reverse (for light backgrounds). */
  variant?: "gold" | "navy";
}

/**
 * HN Grocers mark: a woven produce basket holding a fruit and a leaf, on a rounded
 * tile. Drawn on a 64-unit grid; assets/images icons are rendered from the same shapes.
 */
export function BrandMark({ size = 40, variant = "gold" }: MarkProps) {
  const tile = variant === "gold" ? GOLD : NAVY;
  const ink = variant === "gold" ? NAVY : GOLD;
  // Thicker weave lines at small sizes so they don't vanish
  const weave = size < 48 ? 2.4 : 2;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityLabel="HN Grocers">
      <Rect x={0} y={0} width={64} height={64} rx={18} fill={tile} />
      {/* Fruit with a little stem */}
      <Circle cx={23} cy={24} r={6.5} fill={ink} />
      <Path d="M23 17.5 q1 -3 3.5 -3.5" fill="none" stroke={ink} strokeWidth={1.8} strokeLinecap="round" />
      {/* Leaf with its midrib */}
      <Path d="M33 28 C33 19 39 13.5 48 12.5 C48 21 42.5 27 33 28 Z" fill={ink} />
      <Path d="M34.5 26.5 L45 15.5" stroke={tile} strokeWidth={1.4} strokeLinecap="round" />
      {/* Basket rim and body */}
      <Rect x={10} y={29} width={44} height={5.5} rx={2.75} fill={ink} />
      <Path d="M13 36 H51 L47.6 50.5 Q46.8 54 43.2 54 H20.8 Q17.2 54 16.4 50.5 Z" fill={ink} />
      {/* Weave */}
      <Path d="M24 39.5 V50 M32 39.5 V50 M40 39.5 V50" stroke={tile} strokeWidth={weave} strokeLinecap="round" />
    </Svg>
  );
}

interface LockupProps {
  size?: number;
  /** Text colour; the mark adapts (gold tile on dark text backgrounds). */
  onDark?: boolean;
  tagline?: string;
}

/** Mark + "HN Grocers" wordmark (+ optional tagline), for headers. */
export function BrandLockup({ size = 40, onDark = true, tagline }: LockupProps) {
  const textColor = onDark ? "#FFFFFF" : NAVY;
  return (
    <View style={styles.lockup}>
      <BrandMark size={size} variant={onDark ? "gold" : "navy"} />
      <View style={styles.words}>
        <Text style={[styles.wordmark, { color: textColor, fontSize: Math.round(size * 0.48) }]} numberOfLines={1}>
          HN <Text style={{ color: onDark ? GOLD : textColor }}>Grocers</Text>
        </Text>
        {!!tagline && (
          <Text style={[styles.tagline, { color: onDark ? "#C3CEE6" : "#525B70" }]} numberOfLines={1}>
            {tagline}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  lockup: { flexDirection: "row", alignItems: "center", gap: 12, flexShrink: 1, minWidth: 0 },
  words: { flexShrink: 1, minWidth: 0, gap: 2 },
  wordmark: { fontFamily: fonts.display, letterSpacing: -0.2 },
  tagline: { fontSize: 12, fontFamily: fonts.regular },
});
