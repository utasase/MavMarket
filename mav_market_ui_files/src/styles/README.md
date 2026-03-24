# `src/styles/`

Global style layers for the web app.

## Files

- `index.css` -> style entrypoint and utility classes
- `fonts.css` -> Inter font import
- `tailwind.css` -> Tailwind v4 setup and source directives
- `theme.css` -> CSS variables and base style tokens

## Load chain

`index.css` imports:

1. `fonts.css`
2. `tailwind.css`
3. `theme.css`

This order controls precedence and token availability for downstream components.

## Notes

- Tailwind is wired through Vite plugin (`@tailwindcss/vite`).
- `theme.css` defines color/token variables used across UI classes.
