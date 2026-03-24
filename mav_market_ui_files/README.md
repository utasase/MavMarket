# `mav_market_ui_files`

Vite + React implementation of the Mav Market UI.

This folder acts as a web implementation and reference surface parallel to the React Native app.

## Run locally

```bash
cd mav_market_ui_files
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Stack

- Vite
- React 18 + React Router
- Tailwind CSS v4 via `@tailwindcss/vite`
- `motion/react` for animations
- Large Radix/MUI component dependency set (not all pieces are used by the main app flow)

## Important structure

- `src/app/` -> core app logic, routes, feature components
- `src/styles/` -> font, theme, and Tailwind imports
- `src/imports/` -> generated asset imports
- `guidelines/` -> project guideline notes/template
- `expo-project/` -> separate Expo prototype snapshot/reference

## Contributor notes

- Keep parity with `MavMarketApp` when changing feature behavior.
- In `vite.config.ts`, keep both plugins enabled:
  - `@vitejs/plugin-react`
  - `@tailwindcss/vite`
