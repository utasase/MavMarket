# MavMarketApp

Expo + React Native implementation of Mav Market.

This is the primary mobile app surface in this repository.

## Stack

- Expo SDK 55
- React Native 0.83
- React 19
- `expo-router` (file-based routing)
- `lucide-react-native` + `react-native-svg` for icons/logo
- `react-native-safe-area-context` for notch-safe layouts

## Run locally

```bash
cd MavMarketApp
npm install
npm run start
```

Platform-specific:

```bash
npm run ios
npm run android
npm run web
```

## Directory map

- `app/` -> route tree and root app state gate
- `components/` -> reusable feature components and overlays
- `data/` -> typed mock domain data used across screens
- `assets/` -> app icon/splash assets referenced in `app.json`

## App flow

`app/_layout.tsx` controls startup state:

- splash
- login
- tab app (`<Slot />`)

Tabs are defined in `app/(tabs)/_layout.tsx`:

- `index` (Home)
- `swipe` (Discover)
- `messages`
- `profile`

## Contributor Notes

- Route edits should happen in `app/`, not `App.tsx`.
- All features should be verified with the shared Supabase backend or mock data.
- If data shape changes, update `data/mockData.ts` and ensure consistency with the backend schema.
