# `src/app/data/`

Mock data and shared interfaces for the web implementation.

## File

- `mockData.ts`

## Data contract

Includes interfaces and seed objects for:

- listings and categories
- messaging conversations/messages
- user/friend profile data
- notifications

## Cross-target parity requirement

This file should stay structurally aligned with:

- `MavMarketApp/data/mockData.ts`

When modifying interfaces or key fields, update both files in the same change to avoid mobile/web drift.
