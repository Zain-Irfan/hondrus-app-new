# Sabores de Honduras — Phase 2 Web Redesign

This folder is the handoff for the **web storefront** redesign (`artifacts/honduran-store`).

| # | File | What it is | Length |
|---|---|---|---|
| 01 | `01-audit.md` | UX audit of the current web storefront — what to change and why. | ~4 min |
| 02 | `02-design-system.md` | Web-specific design tokens (breakpoints, navigation, mega-menu, sidebar filters, sticky summary). Delta on top of the mobile design system. | ~3 min |
| 03 | `03-web-mockups.html` | **Open in your browser.** Six desktop mockups: Home, Catalog with sidebar filters, Product detail, Cart, Checkout, Account dashboard. | interactive |

## How to view

Double-click `03-web-mockups.html`. Each mockup is a 1280-wide browser frame; scroll the page to step through screens.

## Confirmed scope

- **Mirror the mobile redesign** at the design-system level — same colors, same type, same components scaled up for desktop.
- **Web-specific additions:** mega-menu, persistent inline search, sidebar filter rail, two-column cart and checkout with sticky summary, account dashboard.
- **Long-tail content pages** (about, brands, contact, faq, shipping) inherit the new tokens automatically; their content rewrite is in the mobile content doc and reused.

## What's next

After approval, the implementation work in `artifacts/honduran-store` is:

1. **Tokens** — replace `index.css` shadcn variables with the values in `02-design-system.md` §6.
2. **Header** — refactor `components/layout/header.tsx`: persistent search, mega-menu, lang pill.
3. **Home** — refactor `pages/home.tsx`: half-height hero, category grid + bestsellers above the fold, producer rail.
4. **Catalog** — `pages/products.tsx` gets a 280px sidebar with all filter sections.
5. **Product** — `pages/product-detail.tsx` adopts gallery + accordion + reviews.
6. **Cart** — `pages/cart.tsx` becomes two-column with sticky summary + Apple Pay button.
7. **Checkout** — `pages/checkout.tsx` becomes a 3-step progressive form with sticky summary; Stripe Payment Element replaces the WebBrowser polling flow.
8. **Account** — `pages/account.tsx` becomes the dashboard pattern; settings live on a sub-route.
