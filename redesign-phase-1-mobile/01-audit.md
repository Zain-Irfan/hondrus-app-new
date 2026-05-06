# Sabores de Honduras — Mobile App UX Audit

**Phase 1 of 3 (Mobile → Web → Admin)**
**Audience confirmed:** Honduran diaspora in the USA. USD pricing, UPS/FedEx flat-rate shipping, primarily Spanish with EN toggle.
**Scope of this doc:** A friction-by-friction read of the live Expo app (`artifacts/sabores-mobile`) — what works, what hurts, and what to change.

---

## 1. Information architecture

The current tab bar is **Inicio · Catálogo · Cart · Cuenta**, with `mis-pedidos` rendered as a `hidden` tab reachable only by deep link or the Account tab. Order tracking is a first-class shopper need (especially for a perishables-by-mail business where every package is a moment of nostalgia for the buyer), so burying it costs trust and inflates support volume.

**Recommendation.** Promote orders. The new tab order should be **Inicio · Tienda · Carrito · Pedidos · Cuenta**. "Catálogo" reads as developer language; "Tienda" is what a shopper looks for. Reserve the Account tab for profile/addresses/preferences and stop using it as the parking lot for everything that didn't fit elsewhere.

## 2. Home screen (`app/(tabs)/index.tsx`)

The hero is a generic Unsplash image with a 72 % blue overlay — it reads as a stock placeholder, not as Sabores. The CTA, "Shop Now," is in English even in the Spanish flow. The free-shipping progress bar sits *between* the hero and the search field, where it competes with both rather than nudging behavior near the cart total. Categories below render as a 2-up grid of corner-radius cards with all-caps labels — usable, but visually heavy when stacked next to two horizontal product rails ("Bestsellers" and "New Arrivals") that look identical.

**Issues**

- Hero image is decorative stock, not branded; the overlay is so dark the image becomes noise.
- "Shop Now" CTA hard-coded in English (line 112 falls back through `(t as any).shopNow`).
- Two horizontal product rails render with the same card, same chip, same color — shoppers can't visually distinguish "popular" from "new."
- No personalized hook ("Welcome back, Diego" / "Reorder your last cart") for return shoppers — one of the highest-converting patterns for grocery delivery.
- Footer "Fast Shipping" banner repeats the free-shipping message already shown above; redundant.

**Recommendation**

- Replace the hero with a real Honduran-product hero (coffee bean close-up, baleadas plate) and drop the dark overlay; use a light-on-image gradient at the bottom only where text sits.
- Move the free-shipping progress into a **slim sticky bar** at the very top (matches the web pattern already in `free-shipping-top-bar.tsx`).
- Differentiate the two rails: "Más vendidos" gets gold rank chips (1, 2, 3…); "Recién llegados" gets a "Nuevo" badge and a different card chrome.
- Add a **"Continuar comprando"** rail above bestsellers when the user has cart items or recent views.
- Add a **storytelling row** ("Conoce a nuestros productores") with 2–3 origin stories — emotional drivers convert this audience.

## 3. Catalog (`app/(tabs)/catalogo.tsx`)

Search + category pills + grid is the right structure. Recent and popular searches in the empty state is a nice touch. But:

- Filters are limited to *one* category. Users can't filter by price, dietary tag (sin gluten, sin lactosa), region (Olancho, Marcala…), or stock status — all relevant for this catalog.
- No sort control. Every catalog grid arrives in DB-default order.
- The "no results" empty state shows two large CTAs with the same visual weight ("Borrar filtros" + "Volver al inicio"); the secondary should de-emphasize.
- Category pills don't show product counts, so users don't know whether tapping "Lácteos" leads to 2 or 25 items.
- The TextInput uses `autoCapitalize="none"` on a *catalog* search, which is fine, but Spanish queries with proper nouns ("Marcala") become awkward.

**Recommendation**

- Add a **filter sheet** (slide-up) with: sort, price range, dietary tags, region, in-stock-only.
- Show the **active filter count** as a badge on the filter button.
- Show counts on category pills (`Lácteos · 4`).
- Default sort = "Recomendados" (curated featured + bestseller boost).
- Empty state: keep the icon, drop one CTA, add **"Ver más vendidos"** as the primary action.

## 4. Product detail (`app/product/[id].tsx`)

Solid bones — image, badges, category chip, origin chip, price, rating, description, tags, sticky bottom add-to-cart bar with quantity stepper. What's missing for a food/grocery app catering to a homesick audience:

- **No image gallery.** A single image. Diaspora shoppers want to see the package, the brand, the back label (ingredients in Spanish), the food prepared.
- **No "from this brand" or "pairs with"** rail. A bag of `cafe-de-marcala` should suggest `pan-de-coco` and `crema-hondurena`.
- **No reviews surface.** The rating star row shows `4.5 (12 reseñas)` but there's nowhere to read or write a review.
- **No sharing.** Share-to-WhatsApp is the primary recommendation channel for this audience; absent.
- **No favorites/wishlist.** A heart icon should live next to the price. Diaspora shoppers browse repeatedly before buying.
- **No nutritional / origin / ingredients accordion.** Tags are a flat row, but real packaging context would convert.
- **Quantity max = `product.stockQuantity`** — fine, but no warning when stock is low ("Quedan 3").
- The **bottom bar quantity selector + add button** is cramped on narrow phones (iPhone SE width); the price update on the button is welcome but the button is also bordered in gold — three pieces of chrome competing for attention.

**Recommendation**

- Multi-image gallery (paginated strip with dots), zoom on tap.
- Heart-favorite button overlapping top-right of the hero image.
- Section accordion: Descripción · Ingredientes · Origen · Cómo se usa.
- "También te puede gustar" rail at bottom.
- "Compartir con un amigo" share button.
- Reviews tab (even if MVP: stars only, no text required for first release).
- Move the quantity stepper *into* the add-to-cart button as a single combined unit when the item is in cart ("Agregado · Qty 2 +/−").

## 5. Cart (`app/(tabs)/cart.tsx`)

The cart is functional but visually heavy: every row has a 4-pixel left border in primary blue, a card background, image, info, qty controls inline, remove X, and an inline subtotal. That's a lot.

- The **summary card** repeats the free-shipping message and progress bar that's already shown elsewhere — the third surface this lives on (top bar candidate, summary card, footer banner). Pick one.
- The "Calcular envío" zip-input was correctly removed when shipping went flat-rate, but **no estimated delivery date** appears in its place ("Llega entre 5–7 mayo").
- **No promo code field.** A redemption surface is mandatory for this audience (referrals + email coupons drive much of the diaspora vertical).
- **No "save for later"** for items the shopper isn't ready to buy.
- The "Ir a pagar" CTA bar lives above the tab bar and uses two stacked layers (custom shadow + tab bar shadow) — looks heavy on iOS.
- Empty state is good — Need help? Phone + email cards. But the phone number is a placeholder (`+50400000000`).

**Recommendation**

- Slim the row: image · name · qty stepper · price right-aligned · X to remove. Drop the heavy left border.
- Show a **delivery estimate** under the shipping line with an icon (truck → "Llega 12–14 may, gratis").
- Add a **promo code accordion** above the totals.
- Add **"Guardar para después"** swipe action / kebab on each item.
- Clean the bottom bar — single elevation, inline label "Subtotal" + total + button.

## 6. Checkout (`app/checkout.tsx`)

Single long form (contact info + shipping address + summary + payment note + submit). The pattern is fine for a 6-field form, but it currently runs to ~12 inputs and a long order summary, all on one screen.

- **No step indicator.** No sense of progress.
- **Address autocomplete is great**, but the form still asks for line2, then a row of city/state, then ZIP/phone — all visible at once. Could be progressive.
- **Payment opens an external browser tab and the app polls for 5 minutes.** This is unusual UX; the awaiting screen is well-designed but the user just left the app and may not return. A native Stripe payment sheet would be a major upgrade.
- **The "Sign in for faster checkout" banner** is good, but it's wedged between the signed-in banner logic and the form. If the user sees both, the hierarchy is muddy.
- **Shipping is free above $75**, but there's no last-chance nudge here — "Add $4.20 to unlock free shipping" should appear above the submit button.
- **No saved-cards.** Returning users have to enter card info every time (because Stripe Checkout opens new each time).
- **No order notes** (allergies, gift message, leave-at-door).

**Recommendation**

- Split into 3 progressive steps: **Envío → Pago → Revisar y confirmar**, with a top progress dot.
- Move the customer name + email *into* the address step as "Datos de contacto" sub-section (one section, not two).
- Switch to **Stripe Payment Sheet** for native card entry — keeps the user in the app and supports Apple Pay / Google Pay (huge wins for this audience).
- Add an inline last-chance "Add X for free shipping" above submit.
- Add an order-notes free text field ("Mensaje para el destinatario / instrucciones").
- Move the security note ("pago seguro") onto the payment step, not the address step.

## 7. Order success (`app/order-success.tsx`)

Lovely. Honduran flag emoji, success card, two clean CTAs. Two small misses:

- The "Tracking" row says `t.trackingValue(orderId)` but doesn't show the actual tracking number until the order ships — currently the value is the order id, which is confusing for users who later expect a UPS tracking link.
- No "Add to calendar" or "What's next?" timeline (Confirmed → En empaque → Enviado → En camino → Entregado).
- No share / referral prompt at the moment of highest customer happiness ("Comparte Sabores con un amigo y recibe $10 en tu próximo pedido").

**Recommendation**

- Replace the static tracking row with a **status timeline** (5 dots, current dot pulsed).
- Add an estimated delivery range ("Tu pedido llega entre martes 12 y jueves 14 de mayo").
- Add a **referral CTA card** below the actions.

## 8. My orders (`app/(tabs)/mis-pedidos.tsx`)

The order card pattern (date label, status pill, order #, stacked thumbnails, total, expandable items) is one of the strongest pieces of the current app. The friction:

- **No filter / search by date or status** — power users with order history scroll.
- **Reorder is missing.** Single most valuable feature for grocery: tap "Volver a pedir" on a past order to refill the cart.
- **No tracking link** to carrier (UPS) when status = shipped.
- **Cancelled / delivered orders look the same as active ones** — no visual de-emphasis.

**Recommendation**

- Group by status: **Activos · Entregados · Cancelados** as a tab strip at top.
- Each card gets a **"Volver a pedir"** button (and a **"Rastrear"** button when shipped).
- Tap on the order opens a full **Order Detail screen** with timeline, items, address, totals — currently the only way to dig in is the in-row toggle.

## 9. Account / cuenta (`app/(tabs)/cuenta.tsx`)

The signed-out view is fine: hero, sign-in / sign-up CTAs, "Ver mis pedidos as guest" and benefit list. The signed-in view is a 600+ line dashboard that includes profile editing, address editing, language picker, sign-out — much of it inline-edited TextInputs without a clear edit/save state.

- **No avatar, no name greeting at the top** of the signed-in dashboard.
- **No quick actions row** (Pedidos · Direcciones · Notificaciones · Ayuda).
- The address list (when implemented) should support **multiple saved addresses** — diaspora shoppers ship to themselves and to family in different states.
- **No language preference saved server-side** — if a user toggles to English, switching devices loses it.

**Recommendation**

- Top: avatar + name + "Miembro desde abril 2025."
- Quick-action grid (4 tiles): Mis Pedidos, Direcciones, Favoritos, Ayuda.
- Settings list below: Idioma · Notificaciones · Preferencias · Cerrar sesión.

## 10. Cross-cutting issues

- **Mixed Spanish/English fallbacks everywhere.** Many strings use `(t as any).key ?? "English fallback"`, meaning if a translation is missing, the user sees English mid-Spanish flow. Audit and ensure full ES coverage.
- **No dark mode.** The `useColors()` hook is wired for it but `constants/colors.ts` only ships a light palette. Half the audience uses dark in the evening; this would be a quick win.
- **Loading & empty states are inconsistent.** Some skeletons, some spinners, some `<Text>Loading…</Text>` text.
- **No haptics on success** outside of cart/order. Standard pattern: light haptic on every primary CTA tap.
- **Address autocomplete is restricted to US** (good), but the `placeholder="TX"` for state assumes the user knows the abbreviation and is in TX — should default-blank with helper text.
- **Accessibility**: most touch targets meet 44 pt, good. But the "+" add-to-cart button on product card is 34 × 34 — under spec. Some text colors (e.g. `mutedForeground` `#6b7280` on `card` `#f8f9ff`) measure ~4.0:1, just barely AA.

---

## Top 10 changes by ROI

1. **Native payment sheet** (Apple Pay / Google Pay / Stripe PaymentSheet) — single biggest checkout-conversion win.
2. **Reorder button on past orders** — biggest LTV/retention win for grocery.
3. **Promote Pedidos to a top-level tab + status timeline** — biggest support-ticket reducer.
4. **Filter sheet on catalog (sort + dietary + region + price)** — biggest discovery win for catalog of 25+ products.
5. **Multi-image gallery + favorites on product** — biggest browse-to-buy win.
6. **Branded hero (real Honduran imagery, not Unsplash overlay)** — biggest first-impression win.
7. **Dark mode** — biggest "feels modern" win for low effort.
8. **Cleaner cart row + delivery estimate** — biggest scannability win.
9. **Personalized home (continue shopping, recently viewed, reorder)** — biggest return-visit conversion.
10. **Spanish copy pass + remove English fallbacks** — biggest credibility / trust win.

These are the changes the mockups in `05-mobile-mockups.html` will demonstrate.
