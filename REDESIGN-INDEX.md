# Sabores de Honduras — Redesign Master Index

A single page that points to every redesign artifact across the three surfaces (mobile, web, admin).

## Phases

| Phase | Surface | Folder | Status |
|---|---|---|---|
| 1 | Mobile (Expo) — audit + design system + mockups + content + roadmap | `redesign-phase-1-mobile/` | Delivered, awaiting review |
| 1.5 | Mobile — code port (additive, no regressions) | `artifacts/sabores-mobile/` | In flight (tokens, i18n, tab promotion, new components shipped) |
| 2 | Web storefront — audit + design system + mockups | `redesign-phase-2-web/` | Delivered, awaiting review |
| 2.5 | Web — code port | `artifacts/honduran-store/` | Pending mockup approval |
| 3 | Admin panel — audit + mockups + code | `redesign-phase-3-admin/` | Pending |

## What's done

### Phase 1 — Mobile design package
- `redesign-phase-1-mobile/00-README.md`
- `redesign-phase-1-mobile/01-audit.md` — friction audit of every screen
- `redesign-phase-1-mobile/02-design-system.md` — token system v2 with dark mode
- `redesign-phase-1-mobile/03-content-rewrites.md` — Spanish copy table
- `redesign-phase-1-mobile/04-feature-roadmap.md` — Tier 1/2/3 feature plan
- `redesign-phase-1-mobile/05-mobile-mockups.html` — 11 phone-frame mockups

### Phase 1.5 — Mobile code (started)
- `artifacts/sabores-mobile/constants/colors.ts` — v2 tokens added; v1 keys still resolve, dark palette ships
- `artifacts/sabores-mobile/utils/i18n.ts` — new ES + EN keys appended (filters, sort, reorder, timeline, referral, account dashboard)
- `artifacts/sabores-mobile/app/(tabs)/_layout.tsx` — Pedidos promoted to top-level tab in both NativeTabs and ClassicTabs
- `artifacts/sabores-mobile/components/FilterSheet.tsx` — new bottom-sheet filter component
- `artifacts/sabores-mobile/components/OrderTimeline.tsx` — new 5-stop status timeline
- `artifacts/sabores-mobile/components/QuickActionTile.tsx` — new account-dashboard tile
- `artifacts/sabores-mobile/components/ReorderStrip.tsx` — new home-screen reorder banner
- `artifacts/sabores-mobile/components/ReferralCard.tsx` — new $10/$10 referral card

All Phase 1.5 changes are **additive**. The existing screens still work unchanged — they're now ready to consume the new tokens, copy, and components when each screen is migrated.

### Phase 2 — Web design package
- `redesign-phase-2-web/00-README.md`
- `redesign-phase-2-web/01-audit.md` — web-specific UX audit
- `redesign-phase-2-web/02-design-system.md` — web tokens, breakpoints, mega-menu, sidebar
- `redesign-phase-2-web/03-web-mockups.html` — 6 desktop mockups

## What's next

1. **Open both mockup HTML files** and review:
   - `redesign-phase-1-mobile/05-mobile-mockups.html`
   - `redesign-phase-2-web/03-web-mockups.html`
2. **Decide per-screen whether** it lands as-is, needs iteration, or should be skipped.
3. Tell me which to keep and I'll continue the code port:
   - **Mobile:** swap each individual screen (`app/(tabs)/index.tsx`, `app/(tabs)/cart.tsx`, etc.) to consume the new tokens / components / copy.
   - **Web:** start the same migration in `artifacts/honduran-store`.
   - **Admin (Phase 3):** audit + mockups + code for `artifacts/admin-panel`.

## File locations to reach from your file manager

All paths are relative to the project root: `/Users/ifrah/Downloads/Diego/HN App/Honduras-Market-Hub/`.

- `redesign-phase-1-mobile/` — mobile design package
- `redesign-phase-2-web/` — web design package
- `artifacts/sabores-mobile/` — mobile source where Phase 1.5 code lives
- `artifacts/honduran-store/` — web source (untouched until you greenlight)
- `artifacts/admin-panel/` — admin source (Phase 3)
