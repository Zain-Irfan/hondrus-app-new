# Sabores de Honduras — Phase 1 Mobile Redesign

This folder is a self-contained handoff for the **mobile app** redesign. Read in this order:

| # | File | What it is | Length |
|---|---|---|---|
| 01 | `01-audit.md` | A friction-by-friction read of the current Expo app — every screen, every problem, recommended fix. | ~5 min |
| 02 | `02-design-system.md` | The new design system — color/type/spacing/elevation tokens, theme-able for light + dark, drop-in shape for `constants/colors.ts`. | ~5 min |
| 03 | `03-content-rewrites.md` | Spanish voice principles + a complete replacement copy table for every key in the i18n file. | ~5 min |
| 04 | `04-feature-roadmap.md` | Functionality additions (Tier 1 quick wins, Tier 2 differentiators, Tier 3 long bets) with effort estimates. | ~3 min |
| 05 | `05-mobile-mockups.html` | **Open this in your browser.** 11 phone-frame mockups of the redesigned screens, annotated with what changed. | interactive |

## How to view the mockups

Double-click `05-mobile-mockups.html` to open it in your default browser. Scroll right inside each row to see the next phone. Each phone has an annotation card under it explaining what changed vs the current build.

The mockups use the exact tokens from `02-design-system.md` (defined as CSS custom properties in the `<style>` block at the top), so adjusting a brand color is a one-line edit and every screen restyles.

## Confirmed scope (from your earlier answers)

- **Audience:** US Honduran diaspora (current direction kept).
- **Surface order:** mobile first, then web, then admin.
- **Visual direction:** Friendly, modern, Honduran-inspired — refined royal blue + gold, generous whitespace, cultural cues as accents not wallpaper.
- **Process:** Audit + mockups first. Code edits only after you approve.

## What I did NOT do (waiting on your approval)

- I did **not** edit any source code in `artifacts/sabores-mobile`. Once you approve the mockups, the code migration is mechanical because tokens map 1:1.
- I did **not** start the web storefront or admin panel work yet. That's Phase 2 and Phase 3.
- I did **not** generate translated content for languages beyond Spanish (EN parity is in the Tier 3 roadmap).

## What I want from you to move forward

1. **Mockup approval.** Open `05-mobile-mockups.html` and let me know which screens land, which need iteration, and which features in the roadmap to deprioritize.
2. **Brand decisions.** A few open questions for you:
   - Are you OK adopting **Fraunces** as the display serif, or do you want to stay Inter-only?
   - Comfortable with the **5-tab bar** (promoting Pedidos to top-level)?
   - Want the **referral program** ($10 / $10) in scope, or cut it for now?
3. **A real Honduran hero photo** to replace the Unsplash placeholder used in the mockup. If you can drop one into `artifacts/honduran-store/public/images/`, I'll wire it in.

Once you give the green light, the next step is:

- **Phase 1.5** — port the mockups to the live Expo source (touch `constants/colors.ts`, the screens in `app/(tabs)/`, `app/checkout.tsx`, `app/order-success.tsx`, `app/product/[id].tsx`, the `(tabs)/_layout.tsx` for the 5-tab promotion, the i18n table in `lib/i18n/es.ts`).
- **Phase 2** — repeat audit + tokens + mockups + code for the web storefront in `artifacts/honduran-store`.
- **Phase 3** — same flow for the admin panel in `artifacts/admin-panel`.
