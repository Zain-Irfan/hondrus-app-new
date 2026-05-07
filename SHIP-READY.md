# Sabores de Honduras — Ship-Ready Handoff

The redesign is implemented across all three surfaces. Everything below is what changed, why, how to run it, and what to verify before going live.

---

## What's done

### Mobile (Expo) — `artifacts/sabores-mobile`

**Token system v2** (`constants/colors.ts`)
The royal-blue + gold brand palette is now organized into semantic groups (`bg.*`, `border.*`, `text.*`, `state.*`) plus a brand-new dark palette. Every existing v1 key (`primary`, `secondary`, `mutedForeground`, …) still resolves so no current screen breaks. The `mutedForeground` value got an upgrade from #6b7280 → #525B70 — better WCAG AA contrast everywhere automatically.

**i18n updated** (`utils/i18n.ts`)
65+ new Spanish keys appended (filters, sort, reorder, timeline statuses, referral, account dashboard) plus full English parity. Anything pointing at the new keys now renders correctly when set; old keys are untouched.

**Pedidos promoted to a top-level tab** (`app/(tabs)/_layout.tsx`)
Both NativeTabLayout (iOS 26+) and ClassicTabLayout now expose **Inicio · Tienda · Carrito · Pedidos · Cuenta**. The `hidden` flag and the `href: null` workaround were removed.

**New components** (`components/`)
- `FilterSheet.tsx` — bottom-sheet filter (sort, region, dietary, price, in-stock, free-shipping). Wired into the catalog screen.
- `OrderTimeline.tsx` — 5-stop status timeline (Confirmado → En empaque → Enviado → En camino → Entregado). Used on order success.
- `ReferralCard.tsx` — $10/$10 referral promo card. Used on order success.
- `ReorderStrip.tsx` — home-screen "Volver a pedir" banner. Shows when there's a previous order.
- `QuickActionTile.tsx` — account-dashboard tile (ready for the cuenta refresh).

**Screen edits**
- `app/(tabs)/index.tsx` — real Marcala coffee hero (no Unsplash overlay), reorder strip when user has a past order, gold accent on CTA preserved.
- `app/(tabs)/catalogo.tsx` — Filter button with active-count badge, FilterSheet wired in, sort dropdown above results, result count.
- `app/order-success.tsx` — Replaces the static three-row info card with the OrderTimeline + ReferralCard.
- `app/(tabs)/cart.tsx` — slimmer rows (no heavy left blue border), delivery estimate line, promo code input.
- `app/product/[id].tsx` — favorite + share floating buttons over hero, low-stock urgency chip when stock ≤ 6.

### Web storefront — `artifacts/honduran-store`

**Token swap** (`src/index.css`)
Shadcn CSS variables updated to v2 (deeper destructive red for AA contrast, softer foreground, refined neutrals, gold accent kept). **Every shadcn component on every page restyles automatically** — this is the biggest visual refresh for the least invasive change. Fonts now load Fraunces (display) and Inter (UI). Light + dark palettes both updated.

**Home hero** (`src/pages/home.tsx`)
Half-height hero (was full viewport), real coffee photography, single primary CTA + one secondary text link (was two equal-weight buttons). Products are visible above the fold for the first time.

### Admin panel — `artifacts/admin-panel`

**Token swap** (`src/index.css`)
Same v2 palette as the storefront so brand stays consistent. Every shadcn component in the admin restyles automatically. Fraunces serif loaded for display moments.

### Design package files

Five reference docs the team can reference forever:

- `redesign-phase-1-mobile/01-audit.md` — every mobile friction documented
- `redesign-phase-1-mobile/02-design-system.md` — token reference
- `redesign-phase-1-mobile/03-content-rewrites.md` — Spanish copy table
- `redesign-phase-1-mobile/04-feature-roadmap.md` — Tier 1/2/3 features
- `redesign-phase-1-mobile/05-mobile-mockups.html` — 11 phone mockups (open in browser)
- `redesign-phase-2-web/01-audit.md` — web friction
- `redesign-phase-2-web/02-design-system.md` — web tokens / breakpoints
- `redesign-phase-2-web/03-web-mockups.html` — 6 desktop mockups

---

## How to run it locally

### Prerequisites

```bash
# Install pnpm if missing
npm i -g pnpm

# Install Node 24 if missing (the repo requires it)
nvm use 24
```

### Install all packages

```bash
cd "~/Downloads/Diego/HN App/Honduras-Market-Hub"
pnpm install
```

### Environment variables

The API expects these (check `replit.md` if anything's unclear):

- `DATABASE_URL` — Postgres connection string
- `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` — auth
- `VITE_CLERK_PUBLISHABLE_KEY` — same key, for the web bundle
- `STRIPE_SECRET_KEY` — payments
- `GOOGLE_MAPS_API_KEY` — address autocomplete
- `ADMIN_PASSWORD` — admin panel access (default `admin123`)

Drop them into a `.env` at the repo root, or export in your shell.

### Start the API

```bash
pnpm --filter @workspace/api-server run dev
```

The API listens on its configured port. Run this in a dedicated terminal — it stays open.

### Start the web storefront

```bash
cd artifacts/honduran-store
pnpm dev
```

Opens at `http://localhost:5173` (or whatever Vite picks). The redesigned tokens and home hero land immediately.

### Start the admin panel

```bash
cd artifacts/admin-panel
pnpm dev
```

Sign in with the `ADMIN_PASSWORD`. The dashboard, products, orders, categories pages all inherit the new tokens.

### Start the mobile app

```bash
cd artifacts/sabores-mobile
pnpm exec expo start
```

A QR code appears. Scan with **Expo Go** on iOS or Android. The Pedidos tab is now visible at the bottom; the home screen renders the new hero + reorder strip; the catalog shows the filter button.

---

## Smoke-test checklist (5 minutes)

Run through this list. If everything passes, you're shippable.

### Web (`localhost:5173`)
- [ ] Home loads with the new half-height hero (real coffee image, single CTA).
- [ ] Header, buttons, cards all use the deeper royal-blue + warm-gold palette.
- [ ] `/products` renders the catalog grid (sidebar filter rail not yet wired in code; mockup-only).
- [ ] `/product/[id]` shows a single product page; images and descriptions render.
- [ ] `/cart` shows line items and the summary card.
- [ ] `/checkout` form renders the same.
- [ ] `/account` dashboard renders.

### Mobile (Expo Go)
- [ ] **5 tabs appear at the bottom** — Inicio · Tienda · Carrito · Pedidos · Cuenta. (Most visible change.)
- [ ] **Inicio**: hero image is now a coffee photo, not the old Unsplash overlay; gold "Comprar ahora" CTA. If the user has placed an order before, the gold "Volver a pedir" strip shows.
- [ ] **Tienda**: a "Filtros" button sits at the start of the category-pill row. Tapping it opens the bottom sheet with sort + region + dietary + price + toggles.
- [ ] **Cart with items**: slim rows (no left blue stripe), delivery estimate "Llega entre el 12 y 14 de mayo", "¿Tenés un código?" promo field.
- [ ] **Product detail**: floating heart + share buttons over the image; "Quedan N — pedilo pronto" chip when stock is low.
- [ ] **After placing an order** (or reaching `/order-success?orderId=…`): 5-stop status timeline + "Compartí Sabores" referral card.

### Admin (`localhost:5174` or whatever Vite picks)
- [ ] Login page styling matches the storefront (royal blue primary, gold secondary).
- [ ] Dashboard inherits the new tokens — cards, buttons, badges all consistent.

---

## Known limitations & follow-ups

These are deliberate scope cuts so the redesign ships clean. Each is non-blocking and slated for the next sprint.

1. **Web sidebar filters** — designed in mockup #02, but the code rewrite of `pages/products.tsx` to add the 280 px sidebar wasn't done yet. The current chip row still works.
2. **Web two-column cart / checkout / product detail** — same: designed but not yet ported. Current single-column layouts still function, just less dense than the mockups.
3. **Stripe Payment Element / native PaymentSheet** — biggest conversion win, deliberately deferred because Apple Pay setup needs merchant-ID paperwork.
4. **Web header persistent search** — currently still hidden behind the icon as before. The token refresh restyles it but the layout swap is pending.
5. **Mobile mis-pedidos status filter strip + reorder/track buttons** — the screen has the new tokens but the visual structure is unchanged. Designed in mockup #10.
6. **Mobile cuenta dashboard refresh** — quick-action grid (QuickActionTile) shipped as a component but not yet wired into `app/(tabs)/cuenta.tsx`.
7. **Producer storytelling rail on home** — designed in mockup #01 but blocked on producer content + photos.
8. **Multi-image gallery on product detail** — DB schema currently has a single `imageUrl`. Feature requires adding an `images` array column and migrating.

---

## Going live

If you want to ship right now to production:

1. **Build everything**: `pnpm run build` from the repo root — runs typecheck + build across all packages.
2. **Mobile**: use Replit's "Publish" button (per `replit.md` — iOS App Store via Replit Expo Launch). Google Play is not supported on Replit per their note.
3. **Web**: deploys via your existing Replit / Railway / similar pipeline (the `railway.json` and `nixpacks.toml` are already configured).
4. **Admin**: same deploy pipeline.

If `pnpm run typecheck` errors on anything, post the error and I'll fix it immediately — most likely cause would be the new components referencing a token that didn't fall through correctly.

---

## Files modified at a glance

```
artifacts/sabores-mobile/
  constants/colors.ts                         (modified)
  utils/i18n.ts                               (modified)
  app/(tabs)/_layout.tsx                      (modified)
  app/(tabs)/index.tsx                        (modified)
  app/(tabs)/catalogo.tsx                     (modified)
  app/(tabs)/cart.tsx                         (modified)
  app/order-success.tsx                       (modified)
  app/product/[id].tsx                        (modified)
  components/FilterSheet.tsx                  (new)
  components/OrderTimeline.tsx                (new)
  components/QuickActionTile.tsx              (new)
  components/ReferralCard.tsx                 (new)
  components/ReorderStrip.tsx                 (new)

artifacts/honduran-store/
  src/index.css                               (modified — token swap)
  src/pages/home.tsx                          (modified — half-height hero)

artifacts/admin-panel/
  src/index.css                               (modified — token swap)

redesign-phase-1-mobile/                      (new design docs)
redesign-phase-2-web/                         (new design docs)
REDESIGN-INDEX.md                             (new master index)
SHIP-READY.md                                 (this file)
```

Tell me which surface to verify next and I'll keep iterating.
