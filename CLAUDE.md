# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**MavMarket** — a Facebook Marketplace-style mobile app for UTA (University of Texas at Arlington) students. Built with Expo (React Native) + Expo Router + Supabase.

All app code lives in `MavMarketApp/`. Run all commands from that directory.

## Commands

```bash
cd MavMarketApp

# Install dependencies
npm install

# Start dev server (choose platform)
npm run start        # or: npx expo start
npm run android
npm run ios
npm run web
```

No linting or test runner is configured.

## Environment Setup

Copy credentials into `MavMarketApp/.env.local`:
```
EXPO_PUBLIC_SUPABASE_URL=<from Supabase dashboard → Settings → API>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
```

Without real credentials, the app runs on mock data (by design — `HomePage` silently catches errors and keeps `mockListings`).

To apply the database schema to a new Supabase project, run `MavMarketApp/supabase/migrations/20240001_init.sql` in the Supabase SQL editor, or use:
```bash
npx supabase db reset   # requires supabase CLI and local Docker
```

## Architecture

### Entry Point

`package.json` sets `"main": "expo-router/entry"` — Expo Router owns the entry point. `App.tsx` in `MavMarketApp/` is an unused Expo scaffold remnant; ignore it.

### Routing vs. Components

Expo Router files in `app/` are thin wrappers — each just renders a single component:
- `app/_layout.tsx` — root layout; wraps everything in `AuthProvider` and gates behind `SplashScreen` → `LoginPage` → `<Slot />`
- `app/(tabs)/_layout.tsx` — 4-tab bar (Home, Discover, Messages, Profile)
- `app/(tabs)/index.tsx` → `<HomePage />`, `messages.tsx` → `<MessagesPage />`, etc.

All actual UI logic lives in `components/`.

### Auth Flow

```
SplashScreen (always shown first)
  └─ LoginPage (if no Supabase session)
  └─ Tab Navigator (if session exists)
        ├─ HomePage
        ├─ SwipePage
        ├─ MessagesPage
        └─ ProfilePage
```

`AuthProvider` (`lib/auth-context.tsx`) wraps the whole app and exposes `useAuth()` → `{ session, user, loading }`. Auth state changes (login/logout) automatically cause `AppGate` in `_layout.tsx` to re-render and show/hide `LoginPage`.

Email validation enforces `@mavs.uta.edu` or `@uta.edu` on signup — **client-side only in `LoginPage.tsx`; this restriction is NOT enforced at the DB or RLS level yet.**

### Database Layer (`lib/`)

| File | Purpose |
|------|---------|
| `lib/supabase.ts` | Supabase client with AsyncStorage session persistence |
| `lib/auth-context.tsx` | React context for session state |
| `lib/listings.ts` | `getListings()`, `createListing()`, `deleteListing()`, `markListingAsSold()`, `updateListingStatus()` — filters on `status = 'active'`; exports `ListingStatus` type |
| `lib/messages.ts` | Conversations CRUD, `sendMessage()`, `subscribeToMessages()` (realtime), `createConversation()`, `markConversationRead()` — unread counts derived from `message_reads` table |
| `lib/profile.ts` | `getCurrentUserProfile()`, `getSellerListings()`, `updateUserProfile()`, `getNotificationPreferences()`, `updateNotificationPreferences()` |
| `lib/saved.ts` | `getSavedListingIds()`, `saveItem()`, `unsaveItem()` |
| `lib/notifications.ts` | `getNotifications()`, `markNotificationAsRead()` |
| `lib/storage.ts` | `pickAndUploadListingImage()` — opens image picker and uploads to Supabase Storage `listings` bucket |
| `lib/reviews.ts` | `getReviews(sellerId)`, `createReview()`, `hasReviewed()` |
| `lib/reports.ts` | `createReport()`, `REPORT_REASONS`, `ReportTargetType` |
| `lib/moderation.ts` | `getOpenReports()`, `takeModAction()`, `isCurrentUserAdmin()` — admin-only functions gated by `users.is_admin` |

### Mock Data Fallback

`data/mockData.ts` exports typed mock data for all entities (`ListingItem`, `Conversation`, `UserProfile`, `Notification`). Components use this as the initial state and replace it with live DB data when available — they never crash if Supabase is misconfigured.

### Database Schema (Supabase)

Current tables (all RLS-enabled, authenticated session required):

| Table | Notes |
|-------|-------|
| `users` | Extends `auth.users` via trigger; has `notification_preferences jsonb` column |
| `listings` | `status listing_status enum` (`draft\|active\|reserved\|sold\|removed`) — run migration 20240006 |
| `conversations` | Unique constraint on `(listing_id, buyer_id, seller_id)` — `createConversation()` upserts safely |
| `messages` | Realtime enabled |
| `notifications` | |
| `saved_items` | Added in migration `20240002` |
| `reviews` | Added in migration `20240003`; trigger auto-updates `users.rating` on insert |
| `reports` | Added in migration `20240004`; has `report_target_type` and `report_status` enums |
| `message_reads` | Added in migration `20240005`; drives `unread` counts in conversations |

Supabase Storage: `listings` bucket (public). Authenticated users need insert permission to upload listing/avatar images. **Storage bucket RLS is not fully locked down yet** — a pending security task.

### Supabase Migrations

Two `supabase/` directories exist:
- `MavMarketApp/supabase/migrations/` — app-level migrations (use these)
- Root-level `supabase/` — separate config, likely for local dev with the Supabase CLI

**Already applied** (do not re-run):
| File | What it adds |
|------|-------------|
| `20240001_init.sql` | Core tables: users, listings, conversations, messages, notifications |
| `20240002_saved_items.sql` | `saved_items` table + RLS |
| `20240003_reviews.sql` | `reviews` table + `users.rating` trigger |
| `20240004_reports.sql` | `reports` table with status/target enums |
| `20240005_message_reads_and_prefs.sql` | `message_reads` table + `users.notification_preferences` |
| `20240006_listing_status.sql` | Replaces `is_sold boolean` with `status listing_status enum`; drops `is_sold` |
| `20240007_moderation_infra.sql` | `is_admin` on users, `moderation_actions`, `audit_events`, admin RLS policies |

**Still deferred:**
- `rate_limit_log` / `is_rate_limited()` — abuse controls for message/report spam; see `agents/runbooks/release-checklist.md`

### Agent Coordination System

`MavMarketApp/agents/` defines a multi-agent build orchestration system:

- `plan.md` — **master orchestration plan**; canonical reference for stack decisions, delivery phases, and agent prompts
- `manifest.json` — agent registry: 10 agents, phases, dependencies, handoff targets
- `contracts.md` — **read before touching shared interfaces** — hard boundaries for auth model, data shapes, RLS invariants, messaging, moderation statuses
- `orchestrator.md` — sequencing rules, conflict resolution, release gates
- `handoffs/phase-1-progress.md` — **current phase 1 status** (~70% complete as of 2026-03-30); lists what's done, what's missing, and pending migration SQL
- `runbooks/` — phase-scoped execution plans
- `specs/` — per-agent acceptance criteria

Agent execution order (all phase 1 unless noted): `orchestrator-agent` → `backend-schema-agent` → `security-agent` → `mobile-foundation-agent` → `auth-agent` → `marketplace-agent` → `messaging-agent` → `profile-trust-agent` → `moderation-admin-agent` → `platform-release-agent` → `payment-architecture-agent` (phase 2, architecture-only).

`plan.md` also calls for an `ops-admin-web-agent` (Next.js internal admin console) that does not yet exist in `manifest.json` — add it before that work starts.

When implementing any feature that touches auth, listings, messaging, or moderation, check `agents/contracts.md` first.

### Key Patterns

- **Optimistic UI in chat**: `MessagesPage` appends the sent message immediately before the DB write, then removes it on failure.
- **Realtime**: `subscribeToMessages()` returns a `RealtimeChannel` — callers must call `channel.unsubscribe()` on unmount (already handled in `MessagesPage`).
- **No navigation library beyond Expo Router** — screen transitions within a tab (e.g., listing detail) are done with in-component state (`selectedItem`) and `Animated.View` slide-up overlays, not router pushes.
- **Icons**: `lucide-react-native` throughout. Brand color is `#0064B1` (UTA blue).
