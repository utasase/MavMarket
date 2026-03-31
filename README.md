# RigProject

RigProject contains two parallel implementations of **Mav Market** (UTA student marketplace):

- `MavMarketApp/` -> Expo + React Native app (primary mobile target)
- `mav_market_ui_files/` -> Vite + React web implementation (UI reference/prototype)

This documentation set is intentionally "pseudo documentation": practical onboarding and maintenance notes for future contributors.

## Quick start

### Mobile app (`MavMarketApp`)

```bash
cd MavMarketApp
npm install
npm run start
```

Optional platform launch:

```bash
npm run ios
npm run android
npm run web
```

### Web app (`mav_market_ui_files`)

```bash
cd mav_market_ui_files
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Project layout

```text
RigProject/
  MavMarketApp/           Expo Router + React Native app
  mav_market_ui_files/    Vite + React web app
  .github/                Copilot repo instructions
```

## Feature model (both targets)

- App flow: splash -> login -> tab app
- Tabs: Home, Discover/Swipe, Messages, Profile
- Overlay surfaces: `ItemDetail`, `SettingsPanel`, `ReviewsViewer`
- Shared domain types: `ListingItem`, `Conversation`, `UserProfile`, `Notification`

## Documentation index

- [`AXON_GRAPH.md`](AXON_GRAPH.md)

### Mobile (`MavMarketApp`)

- [`MavMarketApp/README.md`](MavMarketApp/README.md)
- [`MavMarketApp/app/README.md`](MavMarketApp/app/README.md)
- [`MavMarketApp/app/(tabs)/README.md`](MavMarketApp/app/(tabs)/README.md)
- [`MavMarketApp/components/README.md`](MavMarketApp/components/README.md)
- [`MavMarketApp/data/README.md`](MavMarketApp/data/README.md)
- [`MavMarketApp/assets/README.md`](MavMarketApp/assets/README.md)

### Web (`mav_market_ui_files`)

- [`mav_market_ui_files/README.md`](mav_market_ui_files/README.md)
- [`mav_market_ui_files/src/README.md`](mav_market_ui_files/src/README.md)
- [`mav_market_ui_files/src/app/README.md`](mav_market_ui_files/src/app/README.md)
- [`mav_market_ui_files/src/app/components/README.md`](mav_market_ui_files/src/app/components/README.md)
- [`mav_market_ui_files/src/app/components/ui/README.md`](mav_market_ui_files/src/app/components/ui/README.md)
- [`mav_market_ui_files/src/app/data/README.md`](mav_market_ui_files/src/app/data/README.md)
- [`mav_market_ui_files/src/styles/README.md`](mav_market_ui_files/src/styles/README.md)
- [`mav_market_ui_files/src/imports/README.md`](mav_market_ui_files/src/imports/README.md)
- [`mav_market_ui_files/guidelines/README.md`](mav_market_ui_files/guidelines/README.md)

### Extra reference surface

- [`mav_market_ui_files/expo-project/README.md`](mav_market_ui_files/expo-project/README.md)
