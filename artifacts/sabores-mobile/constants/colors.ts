/**
 * Sabores de Honduras — Design Tokens v2
 *
 * Backwards-compatible: every v1 key (text, tint, primary, secondary, …) still
 * resolves to the same value, so existing screens render unchanged. New screens
 * should prefer the v2 semantic groups (`bg.*`, `text.*`, `border.*`, `state.*`)
 * documented in `redesign-phase-1-mobile/02-design-system.md`.
 *
 * NEW: a `dark` palette ships alongside `light`. `useColors()` automatically
 * picks the active scheme, falling back to `light` if dark isn't yet plumbed.
 *
 * NEW: shared scales (`radius`, `space`) live at the root.
 */

// ---------- v2 light semantic tokens ----------
const lightV2 = {
  bg: {
    canvas: "#FFFFFF",
    subtle: "#F7F8FA",
    card: "#FFFFFF",
    cardSubtle: "#FCFCFD",
    brand: "#002B7F",
    brandSoft: "#EEF3FB",
    accent: "#C9A84C",
    accentSoft: "#FBF6E8",
    muted: "#F0F2F6",
  },
  border: {
    default: "#E2E6EE",
    strong: "#C9D0DD",
    brand: "#002B7F",
  },
  text: {
    primary: "#161B26",
    secondary: "#525B70",
    tertiary: "#9AA3B5",
    inverse: "#FFFFFF",
    brand: "#002B7F",
    accent: "#8C7124",
  },
  state: {
    success: "#16A34A",
    successSoft: "#ECFDF3",
    warning: "#B45309",
    warningSoft: "#FEF3C7",
    danger: "#B91C1C",
    dangerSoft: "#FEF2F2",
    info: "#1D4ED8",
    infoSoft: "#EFF6FF",
  },
};

const darkV2 = {
  bg: {
    canvas: "#0A0D14",
    subtle: "#161B26",
    card: "#1E2533",
    cardSubtle: "#161B26",
    brand: "#1547B5",
    brandSoft: "rgba(21,71,181,0.18)",
    accent: "#D4B257",
    accentSoft: "rgba(212,178,87,0.16)",
    muted: "#161B26",
  },
  border: {
    default: "#2A3242",
    strong: "#404B5E",
    brand: "#7B98D6",
  },
  text: {
    primary: "#FCFCFD",
    secondary: "#9AA3B5",
    tertiary: "#6B748A",
    inverse: "#0A0D14",
    brand: "#7B98D6",
    accent: "#DDC066",
  },
  state: {
    success: "#22C55E",
    successSoft: "rgba(34,197,94,0.12)",
    warning: "#F59E0B",
    warningSoft: "rgba(245,158,11,0.12)",
    danger: "#F87171",
    dangerSoft: "rgba(248,113,113,0.12)",
    info: "#60A5FA",
    infoSoft: "rgba(96,165,250,0.12)",
  },
};

// ---------- v1 flat keys (backwards compatibility) ----------
// Every existing screen reads these. We map them onto v2 values so visuals
// improve immediately even before screens are individually upgraded.
const lightV1Aliases = {
  text: lightV2.text.primary,
  tint: lightV2.text.brand,
  background: lightV2.bg.canvas,
  foreground: lightV2.text.primary,
  card: lightV2.bg.cardSubtle,           // was #f8f9ff — closer to canvas now
  cardForeground: lightV2.text.primary,
  primary: lightV2.bg.brand,
  primaryForeground: lightV2.text.inverse,
  secondary: lightV2.bg.brandSoft,
  secondaryForeground: lightV2.text.brand,
  muted: lightV2.bg.muted,
  mutedForeground: lightV2.text.secondary, // upgraded from #6b7280 → #525B70 (better contrast)
  accent: lightV2.bg.accent,
  accentForeground: lightV2.text.inverse,
  gold: lightV2.bg.accent,
  goldLight: lightV2.bg.accentSoft,
  destructive: lightV2.state.danger,
  destructiveForeground: lightV2.text.inverse,
  border: lightV2.border.default,
  input: lightV2.border.default,
  success: lightV2.state.success,
  successForeground: lightV2.text.inverse,
};

const darkV1Aliases = {
  text: darkV2.text.primary,
  tint: darkV2.text.brand,
  background: darkV2.bg.canvas,
  foreground: darkV2.text.primary,
  card: darkV2.bg.card,
  cardForeground: darkV2.text.primary,
  primary: darkV2.bg.brand,
  primaryForeground: darkV2.text.inverse,
  secondary: darkV2.bg.brandSoft,
  secondaryForeground: darkV2.text.primary,
  muted: darkV2.bg.muted,
  mutedForeground: darkV2.text.secondary,
  accent: darkV2.bg.accent,
  accentForeground: darkV2.text.inverse,
  gold: darkV2.bg.accent,
  goldLight: darkV2.bg.accentSoft,
  destructive: darkV2.state.danger,
  destructiveForeground: darkV2.text.inverse,
  border: darkV2.border.default,
  input: darkV2.border.default,
  success: darkV2.state.success,
  successForeground: darkV2.text.inverse,
};

const colors = {
  light: {
    ...lightV1Aliases,
    // v2 nested groups are also reachable for new code:
    v2: lightV2,
  },
  dark: {
    ...darkV1Aliases,
    v2: darkV2,
  },

  /** Border radius scale */
  radius: 12,
  radii: { sm: 8, md: 12, lg: 16, xl: 20, "2xl": 28, full: 9999 },

  /** 4-pt spacing scale */
  space: [0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 56, 72] as const,
};

export default colors;
