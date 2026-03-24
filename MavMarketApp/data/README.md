# MavMarketApp `data/`

Local mock data and shared TypeScript interfaces for the mobile app.

## File

- `mockData.ts`

## What it contains

- Domain interfaces:
  - `ListingItem`
  - `Message`
  - `Conversation`
  - `UserProfile`
  - `Notification`
- Seed collections:
  - `categories`
  - `listings`
  - `conversations`
  - `currentUser`
  - `friends`
  - `notifications`

## Why it matters

Most components use this file directly for rendering stateful UI without backend calls.

## Editing rules

- Preserve interface compatibility across all consuming components.
- If you add/remove fields, update both implementations:
  - `MavMarketApp/data/mockData.ts`
  - `mav_market_ui_files/src/app/data/mockData.ts`
- Keep IDs stable when possible to avoid breaking local selection/saved-state behavior.
