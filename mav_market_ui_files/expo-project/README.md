# `expo-project/`

Secondary Expo-based project snapshot/reference inside the web folder.

This is **not** the main mobile target of the repository (that is `MavMarketApp/`), but it can be used as a reference surface.

## Stack snapshot

- Expo 52
- React Native 0.76
- `expo-router` with typed routes
- `react-native-reanimated` + `react-native-gesture-handler`
- shared marketplace-style components and mock data

## Structure

- `app/` -> router layouts and auth/tab route files
- `components/` -> shared UI building blocks (detail, settings, map, ratings, logo)
- `constants/` -> `colors.ts` and `mockData.ts`
- `app.json` -> Expo config and bundle IDs
- `package.json` -> scripts (`start`, `ios`, `android`)

## Run (if needed)

```bash
cd mav_market_ui_files/expo-project
npm install
npm run start
```

## Maintenance guidance

- Prefer changing `MavMarketApp` for primary mobile work.
- Use this folder only when you explicitly need to compare or salvage patterns from this earlier Expo surface.
