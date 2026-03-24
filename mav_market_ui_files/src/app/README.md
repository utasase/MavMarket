# `src/app/`

Core product application logic for the web target.

## Key files

- `App.tsx` -> root app state machine (`splash` -> `login` -> `app`)
- `routes.ts` -> `createBrowserRouter` configuration
- `data/mockData.ts` -> typed local data used across features

## Route model

`routes.ts` defines:

- `/` with `Layout` + child routes:
  - index -> Home
  - `/swipe`
  - `/messages`
  - `/profile`
- `/icon` -> icon showcase/debug page

## Architectural pattern

- Top-level flow state is in `App.tsx`.
- Feature screens live under `components/`.
- Most screens consume local mock data and maintain UI state client-side.

When adding a feature route, update `routes.ts` and ensure tab navigation in `components/Layout.tsx` stays aligned.
