---
name: React Native iOS Conversion
description: MavMarketApp Expo React Native project created from mav_market_ui_files web app
type: project
---

A brand-new Expo React Native iOS project was scaffolded at `/Users/chatchawanillyes/Desktop/rigTest/RigProject/MavMarketApp` from the web source at `mav_market_ui_files/`.

**Why:** Convert the UTA Mav Market web app (React + Tailwind + motion/react) into a native iOS app using Expo.

**How to apply:** All future RN work for this project should reference `/Users/chatchawanillyes/Desktop/rigTest/RigProject/MavMarketApp/`. The web source remains at `mav_market_ui_files/` for reference only.

## Tech Stack
- Expo SDK 55, expo-router (file-based routing, `app/` directory)
- React Native 0.83.2, React 19.2.0
- `moti` for animations (replaces `motion/react`)
- `lucide-react-native` + `react-native-svg` for icons/logo
- `react-native-safe-area-context` + `react-native-screens`
- TypeScript (strict mode)

## App Flow
splash (2.2s auto-dismiss) → login (welcome/login/signup modes) → tab app

## Navigation
expo-router `(tabs)` layout with 4 tabs:
- `index` → HomePage
- `swipe` → SwipePage
- `messages` → MessagesPage
- `profile` → ProfilePage

## Key Implementation Notes
- SwipePage uses React Native `PanResponder` + `Animated` (not moti) for drag gesture — moti doesn't support gesture-driven motion values
- SettingsPanel uses `Modal` with `MotiView` slide-in (transparent modal + absolute panel)
- ReviewsViewer uses `Modal` with `presentationStyle="pageSheet"`
- MavLogo is an SVG lettermark "M" on blue background (no actual logo asset available from Figma)
- `cardGradient` is a plain dark View overlay on swipe cards (expo-linear-gradient not installed)
- All `Image` components use `{ uri: url }` source format
- `whiteSpace: "nowrap"` on category chips styled as `any` cast since it's web-only but harmless on native
