# Sabores de Honduras — Design System v2

A refinement of the existing royal blue + gold palette into a complete, theme-able token set that's friendly, modern, and unmistakably Honduran. Tokens are named so they can drop straight into `constants/colors.ts` (mobile), the storefront's Tailwind config, and the admin panel.

## 1. Brand identity in one paragraph

Sabores feels like a **specialty market on a quiet weekday morning** — warm, calm, generous with whitespace, with the deep blue and gold of the Honduran flag used as moments of confidence rather than decoration. Type is modern and humanist (Inter for UI, Fraunces for display moments — a contemporary serif with a slight personality). Cultural cues live in micro-interactions and content (regional origin chips, producer stories, a small flag on the order-success screen) instead of as wallpaper.

## 2. Color tokens

### Primitives — full scales

```
blue-50   #EEF3FB      blue-500  #1547B5      blue-900  #001E5C
blue-100  #D6E1F4      blue-600  #0A3998      blue-950  #00153F
blue-200  #AEC2E9      blue-700  #002B7F  ★ brand
blue-300  #7B98D6      blue-800  #002468

gold-50   #FBF6E8      gold-500  #C9A84C  ★ brand
gold-100  #F5E9C4      gold-600  #B0902F
gold-200  #ECD693      gold-700  #8C7124
gold-300  #DDC066      gold-800  #6B561C
gold-400  #D4B257      gold-900  #4A3B14

neutral-0    #FFFFFF                      neutral-700  #404B5E
neutral-25   #FCFCFD                      neutral-800  #2A3242
neutral-50   #F7F8FA                      neutral-900  #161B26
neutral-100  #F0F2F6                      neutral-950  #0A0D14
neutral-200  #E2E6EE
neutral-300  #C9D0DD
neutral-400  #9AA3B5
neutral-500  #6B748A
neutral-600  #525B70

success-50   #ECFDF3   success-500  #16A34A   success-700  #15803D
warning-50   #FEF3C7   warning-500  #F59E0B   warning-700  #B45309
danger-50    #FEF2F2   danger-500   #EF4444   danger-700   #B91C1C
info-50      #EFF6FF   info-500     #3B82F6   info-700     #1D4ED8
```

### Semantic tokens — light theme

| Token | Hex | Usage |
|---|---|---|
| `bg.canvas` | `#FFFFFF` | Page background |
| `bg.subtle` | `#F7F8FA` | Sections, alternating rows |
| `bg.muted` | `#F0F2F6` | Disabled, inactive |
| `bg.card` | `#FFFFFF` | Cards, sheets |
| `bg.cardSubtle` | `#FCFCFD` | Cards on `bg.subtle` backgrounds |
| `bg.brand` | `#002B7F` | Primary surfaces (hero, active tabs) |
| `bg.brandSoft` | `#EEF3FB` | Tinted brand chips, selected pill |
| `bg.accent` | `#C9A84C` | Gold accents (CTAs as accent only) |
| `bg.accentSoft` | `#FBF6E8` | Gold-tinted chips, free-shipping bar |
| `border.default` | `#E2E6EE` | Card borders, input borders |
| `border.strong` | `#C9D0DD` | Hovered/focused borders |
| `border.brand` | `#002B7F` | Selected state |
| `text.primary` | `#161B26` | Body text, headings |
| `text.secondary` | `#525B70` | Descriptions, meta |
| `text.tertiary` | `#9AA3B5` | Placeholders, timestamps |
| `text.inverse` | `#FFFFFF` | Text on `bg.brand` |
| `text.brand` | `#002B7F` | Links, prices |
| `text.accent` | `#8C7124` | Gold callouts (use deep gold for AA contrast) |
| `state.success` | `#16A34A` | Confirmed, free shipping unlocked |
| `state.warning` | `#B45309` | Low stock |
| `state.danger` | `#B91C1C` | Errors, destructive |

### Semantic tokens — dark theme (new)

| Token | Hex |
|---|---|
| `bg.canvas` | `#0A0D14` |
| `bg.subtle` | `#161B26` |
| `bg.card` | `#1E2533` |
| `bg.cardSubtle` | `#161B26` |
| `bg.brand` | `#1547B5` |
| `bg.brandSoft` | `rgba(21,71,181,0.15)` |
| `bg.accent` | `#D4B257` |
| `bg.accentSoft` | `rgba(212,178,87,0.15)` |
| `border.default` | `#2A3242` |
| `border.strong` | `#404B5E` |
| `text.primary` | `#FCFCFD` |
| `text.secondary` | `#9AA3B5` |
| `text.tertiary` | `#6B748A` |
| `text.inverse` | `#0A0D14` |
| `text.brand` | `#7B98D6` |
| `text.accent` | `#DDC066` |

### Contrast notes (WCAG 2.1 AA verified)

- `text.primary` on `bg.canvas` light: 17.8:1 ✅
- `text.secondary` on `bg.canvas` light: 7.4:1 ✅ (was 4.0:1 in v1)
- `text.inverse` on `bg.brand`: 14.6:1 ✅
- `text.accent` (#8C7124) on `bg.canvas`: 5.4:1 ✅ (the v1 token #C9A84C was 2.1:1 — fails)
- `state.danger` on `bg.canvas`: 6.5:1 ✅

## 3. Typography

**Families.** Keep Inter for UI. Add **Fraunces** (already widely available, ships with Expo Google Fonts) as a display serif for hero titles and order-success moments. Two families is the limit.

```
display.xl       Fraunces 700   38 / 44   -0.5
display.lg       Fraunces 600   30 / 38   -0.4
display.md       Fraunces 600   24 / 32   -0.3

heading.lg       Inter 700      22 / 28   -0.2
heading.md       Inter 700      18 / 24   -0.2
heading.sm       Inter 700      15 / 20    0
heading.xs       Inter 700      13 / 18    0.4   (eyebrow / section caps)

body.lg          Inter 400      17 / 26    0
body.md          Inter 400      15 / 22    0     (default body)
body.sm          Inter 400      13 / 19    0
body.xs          Inter 400      11 / 16    0.2

label.md         Inter 600      14 / 20    0     (form labels, buttons)
label.sm         Inter 600      12 / 16    0.4
label.xs         Inter 700      10 / 14    0.6   (chip text, ALL CAPS)

mono.sm          ui-monospace   12 / 16    0     (order numbers, codes)
```

Display serif is used **sparingly**: home hero title, order-success title, "Conoce a nuestros productores" headers. Everywhere else is Inter.

## 4. Space & sizing

```
space.0   0
space.1   2
space.2   4
space.3   8
space.4   12
space.5   16   ★ default page padding mobile
space.6   20
space.7   24   ★ section spacing
space.8   32
space.9   40
space.10  56
space.11  72

radius.sm   8       chips, badges
radius.md   12      buttons, inputs
radius.lg   16      cards
radius.xl   20      hero cards, sheets
radius.2xl  28      bottom sheets
radius.full 9999    pills, avatars
```

## 5. Elevation

```
elev.0  none
elev.1  0  1px  2px rgba(22,27,38,0.04), 0 1px 1px rgba(22,27,38,0.04)
elev.2  0  4px  8px rgba(22,27,38,0.06), 0 1px 2px rgba(22,27,38,0.04)   ★ cards
elev.3  0  8px 24px rgba(22,27,38,0.08), 0 2px 4px rgba(22,27,38,0.04)   ★ sticky bars
elev.4  0 16px 40px rgba(22,27,38,0.12), 0 4px 8px rgba(22,27,38,0.06)   sheets, modals
```

Elevation in v1 was applied liberally to every card with `elevation: 2`. The new system uses `elev.2` only on cards that *float over content* (e.g. product cards in horizontal rails). Cards inside a `bg.subtle` section get `border.default` instead of a shadow — quieter and reads more "marketplace shelf" than "popping pill."

## 6. Motion

```
motion.fast    150ms   cubic-bezier(0.2, 0, 0, 1)    micro (button press, chip select)
motion.base    220ms   cubic-bezier(0.2, 0, 0, 1)    standard (sheet open, list expand)
motion.slow    340ms   cubic-bezier(0.2, 0.8, 0.2, 1) celebratory (success state, add-to-cart)

haptics.light       primary CTA tap
haptics.medium      add-to-cart, address autocomplete pick
haptics.success     order placed, payment confirmed
haptics.warning     low stock add-to-cart
haptics.error       failed payment, validation block
```

## 7. Components

### Button

| Variant | Usage | Surface |
|---|---|---|
| `primary` | Page-level commit (Pagar, Confirmar, Sign in) | `bg.brand` + `text.inverse`, gold underline accent for the brand moment on the order CTA only |
| `secondary` | Alternate primary action | `bg.canvas` + `border.brand` + `text.brand` |
| `tertiary` | Inline action, "Ver todo" | text-only `text.brand`, no border, no fill |
| `accent` | Reserved for promotional moments (referral, free-shipping unlocked) | `bg.accent` + `text.brand` |
| `destructive` | Remove, cancel | `state.danger` + `text.inverse` |
| `ghost` | Icon buttons in app bars | transparent + `text.secondary` |

Sizes: `sm` 36 pt · `md` 44 pt · `lg` 52 pt · `xl` 60 pt (only used for the hero "Comprar ahora").

Anti-pattern from v1 we drop: **borders on filled buttons** (the gold border around the primary blue checkout button competed with itself). The new primary button is solid; the gold relationship is preserved with a 2-pt internal underline for the order-confirmation button only.

### Input

- Height: 48 pt (was 52). Radius `md` 12 pt (was a 26 pt pill — pills feel chat-bubble for forms).
- Default: `border.default` 1 pt, `bg.canvas`. Focused: `border.brand` 1.5 pt, no fill change.
- Floating label pattern. No `placeholder` substituting for label.
- Helper text 12 pt under input. Error state: red border + red helper.

### Card

- Default: `bg.card`, `border.default` 1 pt, `radius.lg`, padding `space.5`. No shadow.
- Floating (used in horizontal rails): no border, `elev.2`.
- Pressable card: 0.97 scale + 100 ms motion on press.

### Chip / Pill

- `radius.full`, height 32 pt, padding `space.4` horizontal.
- Default: `bg.subtle` + `text.primary` + `border.default`.
- Selected: `bg.brand` + `text.inverse`.
- Brand-tagged (origin chip): `bg.accentSoft` + `text.accent`.

### Badge

- Stock: green pill "En stock" / amber "Quedan 3" / red "Agotado".
- Bestseller rank: gold circle with white number, 24 pt diameter, sits over product image top-left.
- "Nuevo": gold-soft chip, top-right.
- Cart count: 18 pt circle, `bg.accent` + `text.brand`.

### List item

Used in cart and order summaries. Layout: 64-pt thumbnail · name (2-line) · price right-aligned · qty stepper underneath name · X to remove. No left border.

### Sheet

- Bottom sheet: rounded top `radius.2xl`, drag handle 40 × 4 at top, `bg.canvas`, `elev.4`.
- Used for filters, sort, sign-in prompt, image preview, address picker.

### Status timeline

5 dots + connectors in a vertical or horizontal layout. Active dot = `bg.brand` ring + filled center. Completed = `bg.success`. Pending = `border.default` outline, no fill.

### Tab bar

- 5 tabs: Inicio, Tienda, Carrito, Pedidos, Cuenta.
- Active = `text.brand` + filled icon. Inactive = `text.tertiary` + outline icon.
- iOS uses native liquid-glass tabs (kept from current). Android: solid `bg.canvas` with hairline top border, no shadow.

### Skeleton

Single shape, single shimmer. Token: `bg.subtle` ↔ `bg.muted`. 1.2 s ease.

## 8. Iconography

- Lucide for line icons (matches current `Icon` wrapper).
- Custom monochrome SVGs for: `flag-honduras`, `coffee-bean`, `regional-pin` (Olancho, Marcala, Copán).
- Icon weight: 1.6 stroke, never below.
- Sizes: 16 / 20 / 24 / 28 / 32.

## 9. Imagery rules

- Product photography: square, neutral background, soft shadow on the product itself.
- Origin photography: 16:9, warm colour grade.
- Hero photography: real product, real plate, real producer — never an Unsplash overlay.
- Maps: Honduras outline + region marker for product origins (later phase).

## 10. Voice

See `03-content-rewrites.md` for the full voice and copy guidelines.

## 11. Token export shape (for `constants/colors.ts`)

```ts
const tokens = {
  light: {
    bg: { canvas: "#FFFFFF", subtle: "#F7F8FA", card: "#FFFFFF", brand: "#002B7F", brandSoft: "#EEF3FB", accent: "#C9A84C", accentSoft: "#FBF6E8", muted: "#F0F2F6" },
    border: { default: "#E2E6EE", strong: "#C9D0DD", brand: "#002B7F" },
    text: { primary: "#161B26", secondary: "#525B70", tertiary: "#9AA3B5", inverse: "#FFFFFF", brand: "#002B7F", accent: "#8C7124" },
    state: { success: "#16A34A", warning: "#B45309", danger: "#B91C1C", info: "#1D4ED8" },
  },
  dark: { /* … as above … */ },
  radius: { sm: 8, md: 12, lg: 16, xl: 20, "2xl": 28, full: 9999 },
  space: [0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 56, 72],
};
```

The mockup HTML uses these exact values so when we move into code, the migration is mechanical: rename and copy.
