# Sabores Web — Design System Extension

This is a **delta** on top of `redesign-phase-1-mobile/02-design-system.md`. The same color, type, spacing, radius, and elevation tokens apply; the additions below are web-specific (navigation, breakpoints, container widths, denser components).

## 1. Breakpoints

```
sm   ≥ 640 px
md   ≥ 768 px        — switches to 2-col layouts
lg   ≥ 1024 px       — adds desktop nav, mega-menu
xl   ≥ 1280 px       — 4-up product grids, sticky checkout summary
2xl  ≥ 1440 px       — max content width
```

Default content max-width: `1280px`, with horizontal padding `clamp(16px, 4vw, 48px)`.

## 2. Type ramp — desktop

Mobile ramp scales up at `md`:

```
display.xl       Fraunces 700   72 / 1.05    -1.0     hero only
display.lg       Fraunces 600   48 / 1.1     -0.7
display.md       Fraunces 600   36 / 1.15    -0.5

heading.lg       Inter    700   28 / 1.25    -0.3
heading.md       Inter    700   22 / 1.3     -0.2
heading.sm       Inter    700   18 / 1.35
heading.xs       Inter    700   14 / 1.4     0.4

body.lg          Inter    400   18 / 1.55
body.md          Inter    400   16 / 1.5      ★ default
body.sm          Inter    400   14 / 1.5
```

## 3. Web-only components

### Navigation header
- 64 px tall (vs 56 px on mobile).
- Sticky on scroll. Solid `bg.canvas` + `border.default` bottom hairline once user has scrolled past hero.
- Logo · Tienda (mega-menu trigger) · Conocé a los productores · Pedidos · Search · Account · Cart.
- Free-shipping bar above (32 px, gold-tinted). Hides under hero when `transparent` mode active, slides in once scrolled.

### Mega-menu (desktop only)
- Triggered on hover/focus of "Tienda."
- 1280 px wide overlay anchored to nav.
- 4-column grid: each column is a category with image + label + product count + 3 subcategory links.
- Right edge: "Recomendados" featured product card + "Ver todo" link.
- Closes on outside click / Escape.

### Inline search
- 320 px wide on desktop. Sits between "Pedidos" and "Account" icons.
- Returns 5 product suggestions in a dropdown as user types (≥ 2 chars).

### Sidebar filters (catalog page)
- 280 px wide on `lg+`. Collapses below grid on `md` (becomes filter button → bottom sheet on mobile).
- Section: Sort radio. Categoría toggles. Región toggles. Tipo (multi-select). Precio range slider. Solo disponibles toggle. Envío gratis toggle. "Limpiar todo" button.

### Sticky summary card (cart, checkout)
- 360 px wide on `lg+`. Position: sticky, top 96 px (clears nav).
- Houses subtotal, shipping, total, free-shipping progress, primary CTA.

### Footer
- 4-column nav (Tienda, Cuenta, Sabores, Contacto).
- Newsletter strip on top.
- Honduran flag stripe (slim, 4 px) in `bg.brand` → `bg.accent` → `bg.canvas` order at the very bottom — a quiet cultural cue.

## 4. Density

Web is denser than mobile by default:
- Card padding: `space.5` (20 px) in lieu of mobile's `space.4` (16 px).
- Grid gaps: `space.5` (20 px) on desktop, `space.4` (16 px) on tablet.
- Line items in cart, checkout summary, orders use a tighter 56 px row height (vs 72 px on mobile).

## 5. Imagery

Same rules as mobile. Hero on the home page is now a **half-height** (60 vh) photographic banner with a single product hero image + brand vignette — the current full-bleed landscape is moved to the about page.

## 6. Migration into the existing Tailwind config

The current `index.css` uses CSS variables with shadcn names (`--primary`, `--secondary`, `--background`, `--foreground`, `--muted`, …). The migration is variable-by-variable, retaining shadcn semantics:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222 24% 12%;       /* was 0 0% 4% — softer */
  --primary: 220 100% 25%;          /* unchanged */
  --primary-foreground: 0 0% 100%;
  --secondary: 38 56% 54%;          /* gold */
  --secondary-foreground: 220 100% 25%;
  --muted: 224 22% 95%;             /* was 220 14% 96% — bluer */
  --muted-foreground: 220 14% 38%;  /* was 220 9% 46% — better contrast */
  --accent: 38 56% 54%;
  --border: 220 14% 90%;            /* was 214 32% 91% */
  --radius: 0.75rem;
}

.dark {
  --background: 222 32% 5%;
  --foreground: 220 14% 98%;
  --primary: 220 78% 41%;
  --secondary: 41 60% 60%;
  --muted: 222 24% 12%;
  --muted-foreground: 220 14% 60%;
  --border: 222 22% 18%;
}
```

Once swapped, every shadcn component restyles automatically. New components (mega-menu, sidebar filter, inline search dropdown) are net-new and ship in `components/layout/` and `components/storefront/`.
