# MavMarketApp `components/`

Feature-level UI components for the React Native app.

## Core surfaces

- `HomePage.tsx` -> marketplace feed with search, filters, categories
- `SwipePage.tsx` -> Tinder-style discovery cards
- `MessagesPage.tsx` -> conversations, notifications, in-thread chat
- `ProfilePage.tsx` -> own profile + friend profile drill-in
- `LoginPage.tsx` -> welcome/login/signup flow
- `SplashScreen.tsx` -> animated app launch screen

## Overlay and supporting components

- `ItemDetail.tsx` -> listing detail view with sticky actions
- `SettingsPanel.tsx` -> right-side settings/activity panel
- `ReviewsViewer.tsx` -> seller reviews modal
- `PickupMap.tsx` -> location display section for listing pickup
- `StarRating.tsx` -> reusable rating renderer
- `MavLogo.tsx` -> app mark used across screens

## Behavioral conventions

- Most screens own local state (`useState`) and derive filtered views from `data/mockData.ts`.
- Overlay flows are state-driven:
  - page sets `selectedItem` / visibility state
  - page renders overlay/modal component conditionally
- `useSafeAreaInsets` is used in main pages to avoid notch/home-indicator overlap.

## Design conventions

- Visual language is consistent across files:
  - UTA blue accent: `#0064B1`
  - dark text/action: `#111827`
  - neutral gray ramps for separators/backgrounds

Keep these values consistent unless you are doing an intentional design-system update.
