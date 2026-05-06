# Sabores Web Storefront — UX Audit

**Phase 2 of 3 (Mobile → Web → Admin)**
**Surface:** `artifacts/honduran-store` (React + Vite + wouter + Tailwind v4 + shadcn).
**Audience:** US Honduran diaspora, same as mobile.

The web storefront and the mobile app share an API and a brand, so most of the redesign principles from Phase 1 carry over. This document focuses on what's *web-specific*: navigation, density, forms, and the long-tail content pages (about, brands, contact, faq, shipping) that don't exist in the mobile app.

---

## 1. Navigation & header

The header is well-engineered: scroll-aware transparent state, mobile menu, sign-in dropdown, free-shipping bar above. The friction:

- **No mega-menu / category preview** when hovering "Productos." The diaspora user shopping for "lácteos" should see a 8-cell grid of categories with images, not a single text link to `/products`.
- **Search is hidden behind an icon** in the desktop header. For a 25-product catalog, search should be a persistent inline field.
- **Free-shipping top bar uses the same blue as the header.** Visual separation is faint when scrolled. Use the gold-tinted top bar from the mockup.
- **No "Idioma ES/EN" affordance in the desktop header.** It exists on mobile (the flag pill); the desktop loses it until the user finds it inside the account dropdown.

## 2. Home page

The hero is full-viewport (`min-h-[100dvh]`) with a Honduran-landscape background, two gradient overlays, and a 5xl→8xl serif headline. It's striking but eats the entire fold — users have to scroll past a single value-prop slab before they see *any* product. Below the hero: featured-categories grid, bestseller grid, cultural storytelling, brand exploration, newsletter.

- **Above-the-fold has no products.** A user landing here can't begin shopping without scrolling. For a transactional site this is a conversion leak.
- **Two hero CTAs ("Comprar ahora" / "Ver marcas")** with similar visual weight cause hesitation.
- **The cultural storytelling section is text-heavy** (paragraph blocks); could be a 3-card mini-essay instead.
- **The "Brand exploration" page (`/brands`)** is a deep stylistic experiment that will distract from conversion. Demote it from primary nav.

**Recommendation.** Halve the hero (~60 vh on desktop). Place a category grid + bestseller rail above the fold. Single primary CTA, one secondary text link. Move the brand exploration story below the bestseller grid as a "Conocé a quienes lo hacen" section that links to `/brands`.

## 3. Catalog (`/products`)

The page is a chip-row + grid. No sidebar filtering on desktop (where 25 % of viewport could be a filter rail). No sort. The chip row fetches all categories and lets you pick one — same friction as mobile.

**Recommendation.**

- **Left filter sidebar on desktop** (≥ md breakpoint): Sort, Categoría (collapsed group of toggles), Región, Tipo (dietary), Precio, Solo disponibles. Same shape as the mobile sheet, materialized as a permanent sidebar.
- **Sort dropdown above the grid** ("Recomendados ▾").
- **Product count chip** ("28 productos").
- **Result density**: 4-up grid on xl, 3-up on md, 2-up on sm. Cards are ~280 px wide max.
- **Infinite scroll or paginated load** ; current page renders all results.

## 4. Product detail (`/product-detail`)

Single image, sticky meta sidebar, add-to-cart. Missing the same things as mobile: gallery, reviews, pairs-with, accordions, share button.

**Recommendation.** Two-column layout on desktop:

- Left: image gallery with thumbnail strip. 4–5 images per product.
- Right: name, rating (link to reviews), price, badges, **chunky add-to-cart** with quantity stepper, **"Agregar a favoritos"** secondary button, sharing.
- Below the fold: tabbed accordion (Descripción · Ingredientes · Origen y productor · Cómo preparar · Envío y devoluciones).
- Bottom: "Combina bien con" rail.
- Bottom: reviews list.

## 5. Cart (`/cart`)

Fine bones; suffers from same web-specific quirks: no promo code field, no estimated delivery date, no save-for-later, the "Continuar comprando" link is buried.

**Recommendation.** Two-column layout on desktop:

- Left (`flex-2`): line items list with image · name · qty stepper · per-item subtotal · save-for-later & remove buttons.
- Right (`flex-1`): summary card with subtotal · shipping (with delivery estimate) · promo code accordion · total · "Pagar con tarjeta" / "Pagar con Apple Pay" CTAs.
- Below: "También te puede gustar" rail (cross-sell).

## 6. Checkout (`/checkout`)

Long single-page form, ~500 lines. Same diagnosis as mobile but worse on a wide screen: a desktop user sees fewer rows above the fold *because* the column is narrow and the form is single-column.

**Recommendation.** Two-column on desktop:

- Left (`flex-2`): the actual form, broken into accordion-able sections (1 Contacto, 2 Envío, 3 Pago).
- Right (`flex-1`): order summary card sticky-positioned, with line items, totals, and a "Volver al carrito" link. Sticks to viewport while user fills the form.
- Use **Stripe Payment Element** (web equivalent of mobile PaymentSheet) for native-feeling card + Apple/Google Pay.

## 7. Account (`/account`)

Currently a long settings page. Mirror the mobile dashboard: avatar greeting at top, quick-tile grid (Pedidos · Direcciones · Favoritos · Recompensas), settings list below.

## 8. Orders (`/orders`)

Same as mobile: needs status filter, reorder, tracking link, expanded order detail.

## 9. Long-tail content pages

`/about`, `/brands`, `/contact`, `/faq`, `/shipping` — all exist and are reasonable, but they currently rely on the same hero pattern and dense paragraphs. They benefit from the new design tokens automatically; the content rewrite is what they need.

**Recommendation.**

- Demote `/brands` from header nav (move to footer); it's a brand exploration showcase, not a page that converts.
- Promote `/about` and add a richer "Producers" section linked from home.
- Convert `/faq` into an accordion (currently flat list).
- Strengthen `/shipping` with a region-by-region delivery time table.

## 10. Footer

Already strong: newsletter strip, 4-column navigation. Two improvements:

- **Honduras flag** strip across the top of the footer (subtle, gold + white + blue stripe).
- **Trust badges row** (Stripe, UPS/FedEx, satisfaction guarantee) above the bottom credit.

---

## Top 8 changes for the web

1. **Half-height hero on home + category grid above the fold.**
2. **Mega-menu** under "Tienda" on desktop with category preview tiles.
3. **Persistent inline search** in the desktop header.
4. **Catalog filter sidebar** on desktop (mirrors mobile sheet).
5. **Two-column checkout** with sticky order summary.
6. **Two-column cart** with a sticky summary + Stripe Element.
7. **Two-column product detail** with image gallery + accordion + reviews.
8. **Account dashboard rewrite** mirroring the mobile pattern.

The mockups in `03-web-mockups.html` show all eight.
