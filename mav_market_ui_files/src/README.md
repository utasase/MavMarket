# `src/`

Source root for the web implementation.

## Entry

- `main.tsx` -> mounts React root and renders `app/App.tsx`

## Main folders

- `app/` -> product features, routes, and screen components
- `styles/` -> CSS layer imports (`fonts`, `tailwind`, `theme`, utilities)
- `imports/` -> generated asset wrappers (e.g., Figma asset bindings)
- `assets/` -> static assets used by the web app

## Styling load order

`styles/index.css` imports:

1. `fonts.css`
2. `tailwind.css`
3. `theme.css`

Keep this order unless intentionally restructuring style precedence.
