# `src/app/components/`

UI and feature components for the web app.

## Primary feature components

- `HomePage.tsx`
- `SwipePage.tsx`
- `MessagesPage.tsx`
- `ProfilePage.tsx`
- `LoginPage.tsx`
- `SplashScreen.tsx`
- `Layout.tsx`

## Overlay/support components

- `ItemDetail.tsx`
- `SettingsPanel.tsx`
- `ReviewsViewer.tsx`
- `PickupMap.tsx`
- `StarRating.tsx`
- `MavLogo.tsx`
- `AppIcon.tsx` / `AppIconShowcase.tsx`

## Subfolders

- `figma/` -> generated/shared fallback image helper (`ImageWithFallback`)
- `ui/` -> reusable generic component set (Radix-style building blocks)

## Behavioral conventions

- View components are stateful and generally derive filtered/visible data from `data/mockData.ts`.
- Overlay flows are conditional renders + animated mount/unmount via `AnimatePresence`.
- `ImageWithFallback` is the default image helper for resilience against broken remote URLs.

## Note on `ui/`

`ui/` contains many generic primitives; only a subset may be used in current marketplace flows.
Treat it as a reusable toolkit rather than feature-specific documentation.
