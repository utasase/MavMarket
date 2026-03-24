# `src/app/components/ui/`

Reusable generic UI primitives for the web app.

## What is here

A broad component toolkit (accordion, dialog, select, table, sidebar, tabs, etc.) plus small helpers:

- `utils.ts` (`cn` class merge helper)
- `use-mobile.ts` (mobile breakpoint hook)

## Role in project

This folder is infrastructure-level UI, not marketplace-domain logic.

Domain screens (`HomePage`, `SwipePage`, etc.) live one level up in `src/app/components/`.

## Editing guidance

- Keep components generic and composable.
- Avoid injecting marketplace-specific business logic into these primitives.
- If you add variants/utilities, prefer extending existing patterns over creating near-duplicates.
