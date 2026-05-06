# Sabores Mobile — Functionality Roadmap

Each item is scoped (S/M/L), tagged with the user need it solves, and ordered by ROI for the diaspora-shopper audience.

Legend: **S** = a few days · **M** = ~1 sprint · **L** = multi-sprint

---

## Tier 1 — Quick wins (next 4 weeks)

### 1.1 · Native Stripe Payment Sheet — **M**
*Why.* Today checkout opens an external browser tab and the app polls for 5 minutes. ~30 % of users likely abandon. Native sheet keeps the user in-app, supports Apple Pay / Google Pay (one-tap conversion) and stored cards.
*How.* Replace `WebBrowser.openBrowserAsync` flow in `app/checkout.tsx` with `@stripe/stripe-react-native` PaymentSheet. Server already issues PaymentIntents, so the API surface barely changes. Apple Pay needs a merchant ID + entitlement; Google Pay needs the Google Pay API enabled in Stripe.
*Risk.* Apple Pay setup paperwork. Set aside a week.

### 1.2 · Reorder from past order — **S**
*Why.* The single highest-LTV grocery feature. A diaspora shopper ordering "the usual" once a month should tap one button.
*How.* On each `OrderCard`, add a "Volver a pedir" button. Server endpoint `POST /api/orders/:id/reorder` adds in-stock items to current cart, surfaces a toast for any out-of-stock items.
*Risk.* Low.

### 1.3 · Promote Pedidos to a top-level tab + redesigned status timeline — **S**
*Why.* Order tracking is a daily-open behaviour for a perishable parcel. Burying it in Account is the #1 support-ticket driver.
*How.* Modify `app/(tabs)/_layout.tsx` to expose `mis-pedidos` as a 4th tab. Add a `OrderDetailScreen` route with a 5-stop status timeline (Confirmado → En empaque → Enviado → En camino → Entregado).

### 1.4 · Catalog filter sheet — **M**
*Why.* 25+ products with no filtering means everyone scrolls. Diaspora shoppers want "sin gluten", "de Olancho", "menos de $15."
*How.* `Filter` button on the catalog header opens a bottom sheet with: Sort, Region, Dietary tags, Price range, In-stock-only. Persist via `AsyncStorage` per session. Server: extend `/api/products` query params with `tags`, `region`, `priceMin`, `priceMax`, `inStock`, `sort`.

### 1.5 · Branded hero on home + drop the Unsplash overlay — **S**
*Why.* First-impression credibility. The current overlay-on-stock-photo reads as a placeholder.
*How.* Use existing product photography. Fixed editorial hero with a real product (`cafe-de-marcala.jpg` works) and a light bottom gradient. Editable from the admin panel via a `home_hero` settings record.

### 1.6 · Dark mode — **S**
*Why.* The infrastructure is already in `useColors()`. Tokens already defined in this design system. Half the audience uses dark in the evening.
*How.* Ship the dark palette in `constants/colors.ts`. Honor `useColorScheme()`. QA pass on every screen.

### 1.7 · Multi-image gallery on product detail — **S**
*Why.* "Show me the package back, ingredients, and a serving photo" is what closes the sale on food.
*How.* Schema: `products.images` becomes a JSON array. Migration retains `imageUrl` as the first image. Mobile: replace single `<Image>` with a `FlatList` paginated strip + dot indicator + tap-to-zoom.

### 1.8 · Favorite / wishlist — **S**
*Why.* Browse-to-buy is multi-session for this catalog. Heart-it now, buy it Friday.
*How.* New `wishlist_items` table (customer_id + product_id). Heart icon on product card and product detail. Favorites tab in the Account dashboard.

### 1.9 · Spanish copy pass — **S**
*Why.* Mid-Spanish English fallbacks erode trust.
*How.* Apply the table in `03-content-rewrites.md`, remove every `(t as any).key ?? "English fallback"`.

### 1.10 · Push notifications (transactional only) — **M**
*Why.* "Tu pedido está en camino" pushed = customer doesn't open support to ask "where's my order?"
*How.* Expo Notifications + a `device_tokens` table. Triggers from the API when order status changes to `shipped`, `out_for_delivery`, `delivered`. Permission ask after first order placed (not on first launch).

---

## Tier 2 — Differentiators (next quarter)

### 2.1 · Producer storytelling — **M**
*Why.* Emotional differentiator. Every diaspora-targeted brand that wins (Magnolia Bakery, Maman, Smitten Ice Cream) leans on origin stories.
*How.* New `producers` table (name, region, story, photo). New `producers/[id]` route. Home rail "Conocé a quienes lo hacen." Each product links to its producer.

### 2.2 · Recipe pairing — **M**
*Why.* "What do I make with this?" is the natural next question for half the catalog.
*How.* New `recipes` table; a recipe lists required products; product detail shows "Ingrediente de…" rail.

### 2.3 · Saved addresses + send-as-gift mode — **M**
*Why.* Diaspora shoppers ship to themselves *and* to family in other states. Today the app supports one default address.
*How.* Multiple saved addresses (`addresses` table FK to customer). Address picker in checkout. Gift-mode toggle on checkout (different recipient name + a gift message, hides price on the packing slip).

### 2.4 · Referral program — **M**
*Why.* Highest-CAC channel for diaspora consumer; people *love* recommending nostalgic brands.
*How.* Each user gets a referral code. Code lookup at checkout grants $10 to friend, $10 credit to user when the friend's first order ships. Surfaced in a card on the order-success screen and the account dashboard.

### 2.5 · Delivery date estimate — **S**
*Why.* "When does it arrive?" is the second most asked question after "where is it?"
*How.* Carrier rate API (or a simple ZIP-to-zone lookup) gives a 3-day delivery window. Show on cart, checkout, and order detail.

### 2.6 · Ratings & lightweight reviews — **M**
*Why.* Social proof closes browse-to-buy in a category where shoppers can't taste first.
*How.* `reviews` table (customer_id, product_id, rating, optional text). After delivery + 3 days, prompt "How was your café?" via push. Show average + last 5 reviews on product detail.

### 2.7 · In-app order chat / WhatsApp deep-link — **M**
*Why.* Spanish-speaking shoppers prefer WhatsApp over email; building a real chat is overkill but a one-tap deep-link to a support WhatsApp is high-leverage.
*How.* "Chatear con soporte" button on order detail and the help center. `wa.me/+1XXXXXXXXXX?text={prefilled order number}`.

### 2.8 · Subscriptions ("Café cada mes") — **L**
*Why.* Coffee + crema + frijoles are repeat-purchase items. A subscription = predictable revenue + sticky retention.
*How.* Stripe Subscriptions. Product detail gets a "Una vez / Cada 30 días / Cada 60 días" selector.

---

## Tier 3 — Long bets (later)

### 3.1 · Multilingual EN copy parity — **M**
*Why.* Second-gen diaspora often prefer English UI even when buying nostalgic products.
*How.* Full EN translation parity. Server-side language preference saved on customer.

### 3.2 · "Compartir el carrito" — gift assist — **M**
*Why.* Adult children build a cart, share to a parent, parent pays. Common gift mechanic for the diaspora segment.
*How.* Cart shareable URL. Recipient checks out without losing the share session.

### 3.3 · Producer fulfillment dashboard — **L**
*Why.* If we want margin we eventually source direct. The producer needs a dashboard.
*How.* Out of mobile scope; lives in the admin panel work.

### 3.4 · Live commerce (video shopping) — **L**
*Why.* TikTok/Instagram-style live drops sell out artisan products. Niche but powerful.
*How.* Defer.

---

## Anti-roadmap (things we explicitly aren't doing)

- **Loyalty points / tiers.** Adds bookkeeping complexity for marginal lift. Referral covers the social loop.
- **In-app messaging between users.** Not a marketplace; a curated store.
- **Crypto / alt payments.** Stripe + Apple Pay + Google Pay covers ≥99 % of this audience.
- **AR product preview.** Wrong category.
