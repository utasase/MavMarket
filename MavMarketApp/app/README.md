# MavMarketApp `app/`

Routing and top-level app state for the Expo Router app.

## Structure

- `_layout.tsx` -> root app gate (splash/login/app)
- `(tabs)/_layout.tsx` -> bottom tab navigator config
- `(tabs)/index.tsx` -> Home page wrapper
- `(tabs)/swipe.tsx` -> Discover/Swipe wrapper
- `(tabs)/messages.tsx` -> Messages wrapper
- `(tabs)/profile.tsx` -> Profile wrapper

## Pattern used here

Tab route files are intentionally thin wrappers:

- each route imports a component from `../components`
- route file returns that component directly

This keeps routing and screen implementation separate.

## When editing routes

- Add new tab screen in `(tabs)/_layout.tsx` and create matching file.
- Keep tab icon style consistent with existing `lucide-react-native` usage.
- Keep `headerShown: false` and current tab bar style unless intentionally redesigning navigation.
