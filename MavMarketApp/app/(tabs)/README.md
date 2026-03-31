# MavMarketApp `app/(tabs)/`

Tab route wrappers for the mobile app.

## Files

- `_layout.tsx` -> bottom tab navigation configuration
- `index.tsx` -> Home route wrapper
- `swipe.tsx` -> Discover route wrapper
- `messages.tsx` -> Messages route wrapper
- `profile.tsx` -> Profile route wrapper

## Purpose

These files keep route wiring separate from heavy screen implementations in `../../components`.

If you add a tab:

1. create a wrapper route file here
2. register it in `_layout.tsx`
3. add/update corresponding feature component in `components/`
