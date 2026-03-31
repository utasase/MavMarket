# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**MavMarket** — a Facebook Marketplace-style mobile app for UTA (University of Texas at Arlington) students. Built with Expo (React Native) + Expo Router + Supabase.

All app code lives in `MavMarketApp/`. Run all commands from that directory.

## Commands

```bash
cd MavMarketApp

# Start dev server (choose platform)
npx expo start
npx expo start --android
npx expo start --ios

# Install dependencies
npm install
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

Email validation enforces `@mavs.uta.edu` or `@uta.edu` on signup.

### Database Layer (`lib/`)

| File | Purpose |
|------|---------|
| `lib/supabase.ts` | Supabase client with AsyncStorage session persistence |
| `lib/auth-context.tsx` | React context for session state |
| `lib/listings.ts` | `getListings()`, `createListing()`, `deleteListing()`, `markListingAsSold()` |
| `lib/messages.ts` | Conversations CRUD, `sendMessage()`, `subscribeToMessages()` (realtime), `createConversation()` |
| `lib/profile.ts` | `getCurrentUserProfile()`, `getSellerListings()`, `updateUserProfile()` |
| `lib/saved.ts` | `getSavedListingIds()`, `saveItem()`, `unsaveItem()` — requires `saved_items` table (see migration below) |
| `lib/notifications.ts` | `getNotifications()`, `markNotificationAsRead()` |
| `lib/storage.ts` | `pickAndUploadListingImage()` — opens image picker and uploads to Supabase Storage `listings` bucket |

### Mock Data Fallback

`data/mockData.ts` exports typed mock data for all entities (`ListingItem`, `Conversation`, `UserProfile`, `Notification`). Components use this as the initial state and replace it with live DB data when available — they never crash if Supabase is misconfigured.

### Database Schema (Supabase)

5 tables: `users` (extends `auth.users` via trigger), `listings`, `conversations`, `messages`, `notifications`. RLS is enabled on all tables — all queries require an authenticated session. Realtime is enabled on `messages`.

The `conversations` table has a unique constraint on `(listing_id, buyer_id, seller_id)` — `createConversation()` uses upsert so tapping "Message Seller" multiple times is idempotent.

The `saved_items` table is **not in the initial migration** — run this in the Supabase SQL Editor before using the save feature:
```sql
create table public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  listing_id uuid references public.listings(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, listing_id)
);
alter table public.saved_items enable row level security;
create policy "saved_items_select" on public.saved_items for select to authenticated using (user_id = auth.uid());
create policy "saved_items_insert" on public.saved_items for insert to authenticated with check (user_id = auth.uid());
create policy "saved_items_delete" on public.saved_items for delete to authenticated using (user_id = auth.uid());
```

Supabase Storage: enable the `listings` bucket (public) in the Supabase dashboard. Authenticated users need insert permission on the bucket to upload listing/avatar images.

### Key Patterns

- **Optimistic UI in chat**: `MessagesPage` appends the sent message immediately before the DB write, then removes it on failure.
- **Realtime**: `subscribeToMessages()` returns a `RealtimeChannel` — callers must call `channel.unsubscribe()` on unmount (already handled in `MessagesPage`).
- **No navigation library beyond Expo Router** — screen transitions within a tab (e.g., listing detail) are done with in-component state (`selectedItem`) and `Animated.View` slide-up overlays, not router pushes.
- **Icons**: `lucide-react-native` throughout. Brand color is `#0064B1` (UTA blue).
