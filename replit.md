# Sabores de Honduras — Honduran Products Online Store

## Overview

A full-stack ecommerce store for authentic Honduran products, shipping nationwide via UPS/FedEx. Built for the Honduran diaspora in the USA. Inspired by DoorDash's conversion-focused UX adapted for parcel shipping.

**Language**: 100% Spanish throughout all 12 pages
**Color scheme**: Patriotic Honduran flag colors — deep royal blue (#002B7F) primary, gold (#D4AF37) secondary/accent, white background
**Product images**: All 25 products and 8 categories have real product photos stored in `artifacts/honduran-store/public/images/`

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui + framer-motion (artifacts/honduran-store)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec in lib/api-spec/openapi.yaml)
- **Build**: esbuild (CJS bundle)
- **Routing**: wouter

## Admin Panel (artifacts/admin-panel)

A separate backstage cockpit for store management, accessible at `/admin-panel/`.

- **Authentication**: Password login stored in `localStorage` as `adminKey`, sent as `x-admin-key` header
- **Dashboard**: KPI metrics (revenue, orders, products, categories) + recent orders table + status breakdown
- **Products**: Full CRUD — table with search, edit dialog (all fields), delete confirmation
- **Orders**: Table with expandable row details (items, shipping address), status + tracking number updates
- **Categories**: Read-only grid showing all categories with images and product counts
- **API key**: `ADMIN_PASSWORD` env var (default: `admin123`)
- **Routes**: `GET/POST /api/admin/stats`, `GET/POST/PUT/DELETE /api/admin/products`, `GET/PUT /api/admin/orders`, `GET /api/admin/categories`

## Authentication (Storefront)

- **Provider**: Clerk (whitelabel — proxied via api-server using `clerkProxyMiddleware`).
- **Env vars**: `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`.
- **Web flow**: `<ClerkProvider>` wraps the app in `App.tsx`. Sign-in / sign-up are dedicated routes (`/sign-in/*?`, `/sign-up/*?`) styled with the `shadcn` theme + brand colors. The `useUser` hook in `hooks/use-user.tsx` wraps `useClerkUser` so existing pages (header, account, orders, checkout) keep their original `{email, user, login, logout, refreshProfile}` API.
- **API auth**: `clerkMiddleware()` is mounted globally in `app.ts`. Protected routes (`/api/orders`, `/api/orders/:id`, `/api/account/profile`) use `requireAuth` (in `middlewares/requireAuth.ts`) which resolves the email from `clerkClient.users.getUser()` and exposes it as `req.userEmail`. The legacy `x-customer-email` header is no longer consulted.
- **Customer record**: `GET /api/account/profile` auto-creates the customer row on first sign-in, so new Clerk users seamlessly get a Sabores customer record keyed by email.
- **Mobile (Expo)**: still on the legacy email-only flow (out of scope for this iteration).

## Configurable settings

- **Free-shipping threshold**: stored in the `app_settings` table under key `free_shipping_threshold`. Read/write helpers live in `artifacts/api-server/src/settings.ts` (`getFreeShippingThreshold`, `setFreeShippingThreshold`, default $75). The threshold drives both the `/store/shipping` quote endpoint and order-creation logic. The admin panel surface lives at `/admin-panel/settings` (Envío gratis card) and uses `GET/PUT /api/admin/settings/free-shipping`.

## Shipping (single flat rate)

- Carrier/method selection has been **removed** from web checkout, mobile checkout, and the admin panel. Every order ships at one fixed rate.
- Server: `resolveShippingOption()` in `artifacts/api-server/src/routes/orders.ts` ignores its input and always returns `{ carrier: "Standard", service: "Standard Shipping", days: 5, cost: 9.99 }`. Free over the configured threshold (server-side check uses `getFreeShippingThreshold()`).
- New public endpoint `GET /api/store/shipping-config` returns `{ standardRate, freeShippingThreshold }` so storefront UIs always display values that match what the server will charge — even if the admin changes the free-shipping threshold.
- Web hook `artifacts/honduran-store/src/hooks/use-shipping-config.tsx` wraps the call in React Query (5-min stale time, falls back to $9.99 / $75). Used by both `pages/cart.tsx` and `pages/checkout.tsx`.
- Web component `artifacts/honduran-store/src/components/free-shipping-progress.tsx` (test id `free-shipping-progress`) shows a progress bar + nudge message ("$X.XX away from free shipping" / "You unlocked free shipping!") on the cart page. Uses the live threshold.
- Web component `artifacts/honduran-store/src/components/free-shipping-top-bar.tsx` (test id `free-shipping-top-bar`) is a slim site-wide bar fixed at `top-0` (z-60, h-9) showing the same nudge on every page. It is hidden over the transparent home hero until the user scrolls (`Header` component owns the show/hide via the `transparent` flag and shifts itself to `top-9` when the bar is visible). Inner pages use `pt-32` instead of `pt-24` to leave room for both bar and header.
- Web cart page (`pages/cart.tsx`) now shows the real shipping line (`$9.99` or `GRATIS`) and a real estimated total. The legacy zip-code "Calculadora de Envío" form was removed since it would contradict the flat rate.
- Mobile hook `artifacts/sabores-mobile/hooks/useShippingConfig.ts` does the same (process-wide cache, fallback to $9.99 / $75). `components/FreeShippingProgress.tsx` consumes it so the home-tab progress bar stays in sync with admin changes; `app/checkout.tsx` uses it for totals.
- Admin panel: the "Métodos de Envío" sidebar link, `/shipping` route, and `pages/shipping.tsx` page were removed.
- The `shipping_methods` DB table and admin CRUD endpoints remain (unused) for backward compatibility; they no longer affect customer pricing.

## Features

- Homepage with hero, featured categories, bestseller grid, cultural storytelling, brand exploration, newsletter
- Product catalog with 25+ authentic Honduran products (coffee, baleadas ingredients, rosquillas, semitas, cheeses, crema, beans, sweets, etc.)
- Category filtering and search
- Product detail pages with add-to-cart
- Shopping cart with item management and shipping estimator (UPS/FedEx rates)
- Checkout flow with address form and shipping option selection
- Address autocomplete on web + mobile checkout (Google Places API New). Selecting a suggestion auto-fills line1, city, state, and ZIP. The browser/mobile call our server proxy at `GET /api/places/autocomplete` and `GET /api/places/details` (in `artifacts/api-server/src/routes/places.ts`); the server holds the `GOOGLE_MAPS_API_KEY` so it never ships in client bundles. Restricted to US addresses. Components: `artifacts/honduran-store/src/components/address-autocomplete.tsx`, `artifacts/sabores-mobile/components/AddressAutocomplete.tsx`.
- Order history and order tracking with status timeline
- Customer account area
- Brand exploration page (5 store name concepts with logo directions)
- FAQ, Shipping Policy, and Contact pages
- Admin placeholders in product management

## Replit Setup

- Single workflow `Start application` runs the Express API server on port 5000 (built artifact at `artifacts/api-server/dist/index.mjs`). It also serves the built storefront and admin panel as static files.
- Build pipeline (run before starting / on deploy): `pnpm install`, `pnpm --filter @workspace/db run push`, build storefront + admin-panel + api-server.
- Required env vars: `DATABASE_URL` (auto-provisioned), `VITE_CLERK_PUBLISHABLE_KEY` (set, build-time), `ADMIN_PASSWORD` (set). For full Clerk auth flows the user must also add `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` secrets — when missing, `clerkMiddleware()` is skipped (see `artifacts/api-server/src/app.ts`) so the app still boots.
- Deployment target: `autoscale`.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## DB Schema

- `categories` — product categories (8 categories)
- `products` — product catalog (25+ Honduran products)
- `cart_items` — shopping cart items (session-based, x-session-id header)
- `orders` — placed orders with status, tracking, shipping info
- `customers` — customer profiles

## API Routes

- `GET /api/products` — list products (filter by category, search, featured, bestseller)
- `GET /api/products/:id` — get product
- `GET /api/categories` — list categories
- `GET /api/store/featured` — featured/bestseller summary for homepage
- `POST /api/store/shipping-estimate` — get UPS/FedEx shipping options
- `GET/POST/DELETE /api/cart` — cart management (session-based)
- `PUT/DELETE /api/cart/:itemId` — update/remove cart item
- `GET/POST /api/orders` — list/create orders
- `GET /api/orders/:id` — get order (tracking)
- `GET/PUT /api/account/profile` — customer profile

## Mobile App (artifacts/sabores-mobile)

Native iOS/Android app built with Expo, at `/sabores-mobile/`.

- **Framework**: Expo Router (file-based routing), React Native, @tanstack/react-query
- **Screens**: Home (featured/bestsellers/categories), Catalog (browse/filter/search), Product Detail, Cart, Checkout, Order Success, Order Tracking
- **Cart**: Persisted locally via AsyncStorage (CartContext)
- **API**: Connects directly to the same Express API server via `EXPO_PUBLIC_DOMAIN`
- **Tabs**: Inicio, Catálogo, Mis Pedidos (with NativeTabs liquid glass on iOS 26+)
- **Publishing**: iOS App Store via Replit Expo Launch (Publish button)
- **Google Play**: Not supported on Replit

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
