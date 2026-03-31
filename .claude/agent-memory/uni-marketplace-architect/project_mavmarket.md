---
name: MavMarket project overview
description: Core facts about the MavMarket React Native / Expo iOS app — stack, structure, and what has been cleaned up
type: project
---

MavMarket is a university marketplace iOS app built with Expo (SDK 54) and expo-router v6 (file-based routing). The project lives at `/Users/chatchawanillyes/Desktop/rigTest/RigProject/MavMarket`.

**Why:** University-focused marketplace (MavMarket = Mavericks branding). iOS-first but technically cross-platform via Expo.

**Stack:**
- React 19 / React Native 0.81 / Expo SDK 54
- expo-router v6 (file-based, typed routes enabled)
- react-native-reanimated v4 + react-native-gesture-handler
- react-native-safe-area-context + react-native-screens
- expo-symbols (SF Symbols on iOS), @expo/vector-icons (MaterialIcons fallback)
- expo-haptics (haptic feedback on tab press)
- TypeScript strict mode; path alias `@/` maps to project root

**Architecture — routing:**
- `app/_layout.tsx` — root Stack; wraps in ThemeProvider (dark/light). Declares `(auth)`, `(tabs)`, and `modal` screens. Auth redirect logic is a stub (TODO comment); implement by reading session token here and using `<Redirect>` to `(auth)/login`.
- `app/(auth)/_layout.tsx` — Stack for auth screens (headerShown: false)
- `app/(auth)/login.tsx` — Login screen stub (.edu email + password fields)
- `app/(auth)/register.tsx` — Register screen stub (name + .edu email + password fields)
- `app/(tabs)/_layout.tsx` — bottom tab navigator (Home, Explore)
- `app/(tabs)/index.tsx` — Home screen stub
- `app/(tabs)/explore.tsx` — Explore/browse stub
- `app/modal.tsx` — modal screen stub

**Kept components (reusable foundations):**
- `components/themed-text.tsx` — Text with theme-aware color + type variants (title, subtitle, defaultSemiBold, link)
- `components/themed-view.tsx` — View with theme-aware background
- `components/haptic-tab.tsx` — Tab bar button with iOS haptic on press
- `components/ui/icon-symbol.ios.tsx` — SF Symbols wrapper (iOS native)
- `components/ui/icon-symbol.tsx` — MaterialIcons fallback (Android/web)

**Constants / hooks:**
- `constants/theme.ts` — `Colors` (light/dark palettes) + `Fonts` (iOS system font families: sans, serif, rounded, mono)
- `hooks/use-color-scheme.ts` — re-exports RN `useColorScheme`
- `hooks/use-color-scheme.web.ts` — hydration-safe web variant
- `hooks/use-theme-color.ts` — resolves a color from `Colors` given the current scheme

**Cleanup performed (2026-03-19):**
Removed all Expo default boilerplate: HelloWave, ParallaxScrollView, ExternalLink, Collapsible, demo screen content, react-logo images, reset-project script. Screen files replaced with minimal stubs. `package.json` scripts trimmed to `start`, `ios`, `lint`.

**Backend: Supabase**
- Auth backend is Supabase. `.edu` email enforcement is handled server-side by Supabase; no client-side email regex needed or wanted.
- Session-check / auth redirect logic in root `_layout.tsx` is intentionally deferred — do not scaffold it until the user requests it.

**Auth group added + Android stripped (2026-03-19):**
- Added `app/(auth)/` group with `_layout.tsx`, `login.tsx`, `register.tsx`
- Registered `(auth)` in root `_layout.tsx` alongside `(tabs)`
- Removed `android-icon-background.png`, `android-icon-foreground.png`, `android-icon-monochrome.png` from `assets/images/`
- Stripped entire `android` block from `app.json`; `userInterfaceStyle: "automatic"` retained for dark mode support
- Future brand colors: blue/yellow (exact values TBD, awaiting design files)

**Login/Register navigation wired (2026-03-19):**
- Both screens import `useRouter` from `expo-router`
- Login "Register" link calls `router.push('/(auth)/register')`
- Register "Sign In" link calls `router.push('/(auth)/login')`
- All TODO comments removed from both files

**UI design implementation (2026-03-19):**
Full MavMarket UI from design files has been implemented. The project now has a complete, functional UI:

- **Colors**: `constants/colors.ts` — flat UTA-branded palette (utaBlue, utaOrange, grays, etc.). `constants/theme.ts` (old light/dark palette) kept intact for hook compatibility but is no longer used by screens.
- **Mock data**: `constants/mockData.ts` — ListingItem, Conversation, UserProfile, Notification interfaces + 10 listings, 3 conversations, 1 currentUser, 2 friends, 4 notifications.
- **New components**: `ItemDetail`, `MavLogo`, `PickupMap`, `ReviewsViewer`, `SettingsPanel`, `StarRating` — all in `components/`.
- **Tab structure replaced**: 4 tabs — Home (index), Discover (swipe cards), Messages, Profile. `explore.tsx` deleted; `_layout.tsx` rebuilt with lucide-react-native icons, no labels, UTA-blue active tint.
- **Root layout**: Rebuilt with `GestureHandlerRootView` (required for swipe gestures), removed ThemeProvider/DarkTheme (design is light-only).
- **Login screen**: Rebuilt — welcome splash → login/signup form flow with UTA email validation, animated transitions, MavLogo component.
- **Discover tab**: Swipe card UX. Uses `Gesture.Pan()` + `GestureDetector` (react-native-gesture-handler v2.28) + Reanimated 4 `useAnimatedStyle`. The old `useAnimatedGestureHandler` API was intentionally NOT used — it was removed in Reanimated 4.
- **New packages installed**: `lucide-react-native`, `react-native-svg`, `@react-native-community/slider`.

**Key compatibility note:** Reanimated 4.x removed `useAnimatedGestureHandler` and `PanGestureHandler`. Use `Gesture.Pan()` + `GestureDetector` from react-native-gesture-handler instead.

**How to apply:** When adding new screens, use ThemedText/ThemedView for automatic dark mode. Use IconSymbol (SF Symbols name) for icons. HapticTab is already wired into the tab bar. New screens should import Colors from `constants/colors.ts` (flat palette), not `constants/theme.ts`.
