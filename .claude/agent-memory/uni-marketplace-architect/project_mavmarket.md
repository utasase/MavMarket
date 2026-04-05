---
name: MavMarket Project State
description: Stack, architecture, wiring status, and key gaps for the MavMarket Expo/RN app — audited 2026-04-04
type: project
---

MavMarket is a Facebook Marketplace-style mobile app for UTA (University of Texas at Arlington) students. Expo SDK 55 + Expo Router + Supabase. All app code lives in `MavMarketApp/`. Root is `/Users/chatchawanillyes/Desktop/rigTest/RigProject/MavMarketApp/`.

**Why:** University-exclusive marketplace enforcing @mavs.uta.edu / @uta.edu email validation.

**How to apply:** When recommending changes, always verify against the 7 existing migrations (all applied) and the contracts in `agents/contracts.md`. The DB schema is stable — focus on wiring the app to it correctly.

## Stack
- Expo SDK 55 / React Native 0.83.2 / React 19
- Expo Router (file-based routing) — `app/` files are thin wrappers, all logic in `components/`
- Supabase JS v2 + AsyncStorage session persistence
- lucide-react-native icons, UTA blue = `#0064B1`
- No linter configured; jest configured but no coverage enforced

## Auth Flow
SplashScreen → LoginPage (if no session) → Tab Navigator (Home, Discover, Messages, Profile).
AuthProvider in `lib/auth-context.tsx` exposes `useAuth()` → `{ session, user, loading }`.
Email validation (@mavs.uta.edu or @uta.edu) is client-side only in LoginPage — NOT enforced at DB/RLS level.
Auto-user-creation trigger (`handle_new_user`) fires on `auth.users` insert, populating `public.users`.

## Database (7 migrations, all applied)
Core tables: users, listings, conversations, messages, notifications, saved_items, reviews, reports, message_reads, moderation_actions, audit_events.
`listings.status` is an enum (draft|active|reserved|sold|removed) — migration 20240006 replaced the old `is_sold` boolean.
RLS enabled on all tables. Realtime enabled on `messages`.

## Wiring Status (audited 2026-04-04)

### FULLY WIRED
- Auth: login, signup, forgot password, sign out (supabase.auth.signInWithPassword / signUp)
- Listings: getListings, createListing, deleteListing, markListingAsSold, updateListingStatus
- Messages: getConversations, getMessages, sendMessage, subscribeToMessages (realtime), createConversation, markConversationRead
- Saved items: getSavedListingIds, saveItem, unsaveItem — all wired in HomePage with optimistic UI
- Reviews: getReviews, createReview, hasReviewed — wired in ItemDetail (leave review modal + duplicate guard)
- Reports: createReport — wired in ItemDetail (report listing) and ProfilePage FriendProfile (report user)
- Profile: getCurrentUserProfile, updateUserProfile, getSellerListings — wired in ProfilePage + EditProfileModal
- Notifications: getNotifications, markNotificationAsRead — wired in MessagesPage
- Notification preferences: getNotificationPreferences, updateNotificationPreferences — wired in SettingsPanel
- Moderation: getOpenReports, takeModAction, isCurrentUserAdmin — wired in ProfilePage + AdminModerationPanel
- Image upload: pickAndUploadListingImage — wired in CreateListingModal + EditProfileModal (avatar)
- Mock data fallback: all components silently fall back to mockData if Supabase not configured

### GAPS / KNOWN ISSUES
1. **App crashes without .env.local** — `lib/supabase.ts` uses non-null assertions (`!`) on EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY. If either is undefined, createClient gets undefined strings and crashes at module load time before any try/catch can help.
2. **SettingsPanel saved items use mock data** — `SettingsPanel.tsx` line 67: `const savedItems = listings.filter(...)` pulls from `data/mockData` listings import, not live DB listings. The panel displays mock items regardless of what the user has actually saved.
3. **"Message" button in FriendProfile is a no-op** — `ProfilePage.tsx` FriendProfile has a "Message" TouchableOpacity with no onPress handler.
4. **Email restriction not server-enforced** — @mavs.uta.edu / @uta.edu check only happens client-side. Anyone can call the Supabase API directly and sign up with any email.
5. **Storage bucket RLS not locked down** — listings bucket is public; noted as pending security task in CLAUDE.md.
6. **Rate limiting deferred** — `rate_limit_log` / `is_rate_limited()` migration not applied; in agents/runbooks/release-checklist.md.
7. **Seller profile navigation missing from ItemDetail** — ItemDetail shows seller name/avatar but has no tap action. FriendProfile component exists in ProfilePage but is unreachable from ItemDetail.
8. **`followers` / `following` always 0** — no followers/following columns in the DB; getCurrentUserProfile hardcodes these to 0.
9. **Avatar uploads go to listings bucket** — EditProfileModal calls `pickAndUploadListingImage()` for avatars; avatars land in the listings bucket with no namespacing.
