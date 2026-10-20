import { useColorScheme } from "react-native";

import colors from "@/constants/colors";

/**
 * Returns the design tokens for the current color scheme.
 *
 * Prefer `v2` / `canvas` / `radii` / `space` in new UI. Flat v1 aliases
 * (primary, background, …) remain for backwards compatibility.
 *
 * Light-only polish for this redesign: we always return the light palette
 * so hardcoded-light screens stay consistent. Dark tokens remain available
 * in colors.ts for a future full dark pass.
 */
export function useColors() {
  // Force light during redesign so screens using mixed hex/tokens stay coherent.
  void useColorScheme();
  const palette = colors.light;
  const v2 = palette.v2;

  return {
    ...palette,
    v2,
    /** Page background (subtle gray) — prefer over white canvas for lists */
    canvas: v2.bg.subtle,
    /** Card / elevated surface */
    surface: v2.bg.card,
    radius: colors.radius,
    radii: colors.radii,
    space: colors.space,
  };
}
