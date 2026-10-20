/**
 * Redesign typefaces (see the "HN Grocers App Redesign" canvas).
 *
 * Display: Bricolage Grotesque — screen titles, section headings, hero.
 * Text:    DM Sans — everything else.
 *
 * Files are bundled in assets/fonts and registered in app/_layout.tsx under
 * these exact names. Screens not yet redesigned still use Inter.
 */
export const fonts = {
  display: "BricolageGrotesque_700Bold",
  regular: "DMSans_400Regular",
  medium: "DMSans_500Medium",
  semibold: "DMSans_600SemiBold",
  bold: "DMSans_700Bold",
} as const;

export const fontFiles = {
  BricolageGrotesque_700Bold: require("../assets/fonts/BricolageGrotesque_700Bold.ttf"),
  DMSans_400Regular: require("../assets/fonts/DMSans_400Regular.ttf"),
  DMSans_500Medium: require("../assets/fonts/DMSans_500Medium.ttf"),
  DMSans_600SemiBold: require("../assets/fonts/DMSans_600SemiBold.ttf"),
  DMSans_700Bold: require("../assets/fonts/DMSans_700Bold.ttf"),
};
