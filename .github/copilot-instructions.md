# Copilot Instructions

## Build, test, and lint commands

This repository has two runnable app targets. Run commands in the target directory.

### `MavMarketApp` (Expo React Native)

- Install dependencies: `cd MavMarketApp && npm install`
- Start Expo dev server: `cd MavMarketApp && npm run start`
- Run iOS: `cd MavMarketApp && npm run ios`
- Run Android: `cd MavMarketApp && npm run android`
- Run web (Expo web): `cd MavMarketApp && npm run web`

### `mav_market_ui_files` (Vite React web)

- Install dependencies: `cd mav_market_ui_files && npm install`
- Start dev server: `cd mav_market_ui_files && npm run dev`
- Build production bundle: `cd mav_market_ui_files && npm run build`

### Test and lint status

- No first-party test scripts are defined in either app `package.json`.
- No first-party lint scripts are defined in either app `package.json`.
- Single-test invocation is not available yet (no configured test runner script).

## High-level architecture

The repo contains two implementations of the same Mav Market experience:

- `MavMarketApp/`: Expo + React Native app (`expo-router`, native components, `Animated`/`PanResponder`).
- `mav_market_ui_files/`: Vite + React web app (`react-router`, Tailwind, `motion/react`).

Both share the same product-level flow and data model:

- App flow: splash -> login/signup -> tabbed marketplace app.
- Main tabs: Home, Discover/Swipe, Messages, Profile.
- Overlays: item detail, settings panel, reviews viewer.
- Data source: local mock data typed by `ListingItem`, `Conversation`, `UserProfile`, `Notification` in each target’s `mockData.ts`.

Routing and composition:

- React Native entry is `MavMarketApp/index.ts` (`expo-router/entry`).
- RN root state gate lives in `MavMarketApp/app/_layout.tsx` and routes tabs in `MavMarketApp/app/(tabs)/_layout.tsx`.
- Web entry is `mav_market_ui_files/src/main.tsx`.
- Web root state gate lives in `mav_market_ui_files/src/app/App.tsx` and routes are declared in `src/app/routes.ts` through `Layout`.

Cross-module interaction patterns to preserve:

- Home/Swipe pages own selected item state and open `ItemDetail` overlays.
- `ItemDetail` invokes `ReviewsViewer`; Home invokes `SettingsPanel`.
- Messaging uses conversation data from `mockData.ts` and local UI state for active thread/messages.

## Key repository conventions

- Treat `MavMarketApp` as the primary implementation target. Use `mav_market_ui_files` as behavior/UI reference.
- Keep both targets in sync for data contracts and feature behavior; update both `mockData.ts` files when interfaces change.
- Keep route/screen naming aligned (`index/home`, `swipe`, `messages`, `profile`) for easier cross-target mapping.
- In RN, edit `app/` routes and `components/`; root `App.tsx` is Expo template content and not the main runtime path.
- Use `useSafeAreaInsets` in RN pages for top/bottom layout safety.
- Preserve platform-specific animation strategy:
  - RN: `Animated` and `PanResponder`.
  - Web: `motion/react` with `AnimatePresence`.
- Preserve platform-specific image strategy:
  - RN: `Image` with `{ uri: ... }`.
  - Web: `ImageWithFallback`.
- Keep UTA email validation behavior aligned across targets (`@mavs.uta.edu` and `@uta.edu`) unless intentionally changing auth rules.
- Preserve established visual language (notably `#0064B1`, `#111827`, neutral grays) used consistently across core screens.
- In web `vite.config.ts`, keep both plugins (`@vitejs/plugin-react` and `@tailwindcss/vite`) enabled; the file notes both are required.
