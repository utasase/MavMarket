# Phase 1 Progress Handoff

**Date**: 2026-03-30  
**Status**: ~70% complete — feature work largely done, moderation/security/release gaps remain  
**Next agent priority**: `moderation-admin-agent` → `security-agent` → `platform-release-agent`

---

## What Was Delivered This Session

### Bug Fixes
- **SwipePage crash**: `components/SwipePage.tsx:84` — `listings` → `allItems` (would crash on "View Results")

### Schema Migrations (all run in Supabase — do not re-run)
| File | What it adds |
|------|-------------|
| `supabase/migrations/20240003_reviews.sql` | `reviews` table + trigger to update `users.rating` on insert |
| `supabase/migrations/20240004_reports.sql` | `reports` table with `report_target_type` and `report_status` enums |
| `supabase/migrations/20240005_message_reads_and_prefs.sql` | `message_reads` table + `notification_preferences jsonb` column on `users` |

### New Library Files
| File | Exports |
|------|---------|
| `lib/reviews.ts` | `getReviews(sellerId)`, `createReview()`, `hasReviewed()` |
| `lib/reports.ts` | `createReport()`, `REPORT_REASONS`, `ReportTargetType` |

### Updated Library Files
| File | What changed |
|------|-------------|
| `lib/messages.ts` | `getConversations` now joins `message_reads` and computes `unread` from DB; added `markConversationRead()` |
| `lib/profile.ts` | Added `getNotificationPreferences()`, `updateNotificationPreferences()` |

### Updated Components
| Component | What changed |
|-----------|-------------|
| `components/ReviewsViewer.tsx` | Now accepts `Review[]` from `lib/reviews.ts` instead of mock data; removed `generateMockReviews` |
| `components/ItemDetail.tsx` | Loads real reviews, shows "Leave Review" modal for non-owners, adds "Report this listing" link |
| `components/ProfilePage.tsx` | Loads real reviews for own profile; `FriendProfile` shows real reviews + "Report" button |
| `components/MessagesPage.tsx` | Calls `markConversationRead` on conversation open; clears unread badge optimistically |
| `components/SettingsPanel.tsx` | Notification toggles now load from and persist to `users.notification_preferences` |
| `components/HomePage.tsx` | Price filter now has interactive tier chips ($50/$100/$250/$500/Any) |

### New Config Files
- `MavMarketApp/eas.json` — EAS build profiles: `development`, `preview`, `production`

---

## Phase 1 Gate Status

| Gate | Status | Blocker |
|------|--------|---------|
| Auth data path functional | ✅ | — |
| Listings data path functional | ✅ | — |
| Chat data path functional | ✅ | — |
| Reporting entrypoints on listings and profiles | ✅ | — |
| Moderation data path functional | ⚠️ Partial | No admin review surface, no audit trail |
| RLS blocks unauthorized access | ✅ Existing tables | Storage bucket unprotected (see below) |
| Preview release configuration exists | ⚠️ Partial | EAS credentials empty, no documented build process |
| Known deferred items documented | ⚠️ Partial | This document; needs formal deferred list |

---

## Critical Gaps for Phase 1 Sign-Off

### 1. Moderation Admin Surface (moderation-admin-agent scope)

**What exists**: `reports` table, `createReport()`, UI reporting entry points  
**What's missing**:
- No `moderation_actions` table — cannot record who took which action
- No `audit_events` table — moderation decisions are not auditable
- No admin review queue — reports sit in the DB with no way to act on them
- No status workflow implementation — `status` column exists but nothing moves it

**Migration needed** (run in Supabase SQL editor):
```sql
-- Moderation actions: records each moderator decision on a report
create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.reports(id) on delete cascade not null,
  moderator_id uuid references public.users(id) on delete set null,
  action text not null check (action in ('escalate', 'resolve', 'dismiss', 'warn_user', 'remove_listing')),
  reason text,
  created_at timestamptz default now()
);
alter table public.moderation_actions enable row level security;
-- Only admins should read/write this — implement after admin role is defined

-- Add updated_at to reports for workflow tracking
alter table public.reports add column updated_at timestamptz default now();
alter table public.reports add column moderator_id uuid references public.users(id) on delete set null;

-- Audit events: immutable log of security-sensitive actions
create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.users(id) on delete set null,
  action text not null,
  target_table text,
  target_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
alter table public.audit_events enable row level security;
-- Append-only: no update or delete policies
create policy "audit_insert" on public.audit_events
  for insert to authenticated with check (actor_id = auth.uid());
```

**Minimal admin surface needed** (can be a simple React Native screen gated behind a hardcoded admin user ID check for phase 1):
- List of open reports with target type, reason, and timestamp
- Tap to view context (target listing title or user name)
- Action buttons: Dismiss / Resolve / Escalate
- Each action writes a `moderation_actions` row and updates `reports.status`

### 2. Listing Status Enum (backend-schema-agent + marketplace-agent scope)

**What exists**: `is_sold boolean` column on `listings`  
**What's required** per `contracts.md`: status `draft | active | reserved | sold | removed`

**Migration needed**:
```sql
create type public.listing_status as enum ('draft', 'active', 'reserved', 'sold', 'removed');
alter table public.listings add column status public.listing_status default 'active';
-- Backfill from is_sold
update public.listings set status = 'sold' where is_sold = true;
update public.listings set status = 'active' where is_sold = false;
-- After verifying data, is_sold can be dropped in a later migration
```

**Code changes needed**:
- `lib/listings.ts`: `getListings()` filter `status = 'active'` instead of `is_sold = false`
- `lib/listings.ts`: `markListingAsSold()` → `updateListingStatus(id, 'sold')`
- Add `reserveListing(id)` and `removeListing(id)` for the full status set
- `lib/profile.ts`: `getSellerListings()` — pass optional status filter

### 3. Abuse Controls (security-agent scope)

**What's missing**: No rate limiting on any action. Required by `contracts.md`.

Recommended approach for phase 1 (Supabase function-based throttle):
```sql
-- Track auth/report/message attempts for throttling
create table public.rate_limit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  action text not null,
  created_at timestamptz default now()
);
alter table public.rate_limit_log enable row level security;
create policy "rate_limit_insert" on public.rate_limit_log
  for insert to authenticated with check (user_id = auth.uid());

-- Helper function: returns true if user has exceeded limit
create or replace function public.is_rate_limited(
  p_user_id uuid, p_action text, p_max int, p_window_minutes int
) returns boolean language sql security definer as $$
  select count(*) >= p_max
  from public.rate_limit_log
  where user_id = p_user_id
    and action = p_action
    and created_at > now() - (p_window_minutes || ' minutes')::interval;
$$;
```

Enforce via DB trigger on `reports` (max 10 reports/day) and optionally in `messages` (max 100 messages/hour). Enforcement in app layer can supplement.

### 4. Release Readiness (platform-release-agent scope)

**What exists**: `eas.json` with three profiles and `APP_ENV` env var  
**What's missing**:
- `eas.json` submit section is empty (Apple/Google credentials)
- No environment separation (which Supabase project is preview vs prod?)
- No documented build process
- No release checklist

**Minimum needed for gate**:
1. Create a second Supabase project for production (current one becomes preview)
2. Add environment-specific secrets to EAS via `eas secret:create`
3. Run `npx eas build:configure` to link the project to an EAS project ID
4. Document the build command: `cd MavMarketApp && npx eas build --profile preview --platform android`
5. Write a one-page release checklist in `agents/runbooks/release-checklist.md`

---

## Deferred from Phase 1 (Document and Close)

These items are intentionally not in scope per `contracts.md` and `agents/orchestrator.md`. Document them as known gaps, not blockers:

| Item | Reason deferred |
|------|----------------|
| Follow/followers social graph | No backend tables; hardcoded to 0; not in contracts scope |
| Real map integration (PickupMap) | Deep-link to Maps app is sufficient for v1 |
| Privacy & Security / Help / About screens | UI stubs acceptable; content deferred |
| Payment architecture | Phase 2 by contract; no in-app payments in v1 |
| Transaction acknowledgment gating for reviews | Complex to implement without a checkout flow; reviews are soft-gated by `hasReviewed` |
| Push notifications | No Expo push token registration; notification prefs exist but no delivery |
| Password strength policy | Supabase default (min 6 chars); acceptable for campus-only app |

---

## Architecture Reminders for Next Agent

- **Route guards**: `app/_layout.tsx` → `AppGate` → checks `useAuth().session` → renders `LoginPage` or `<Slot />`
- **All Supabase access goes through `lib/`** — never query directly from components
- **Mock data fallback**: Components initialize with mock data, replace with DB data on load, never crash if Supabase is unreachable
- **UTA email enforcement**: Only `@mavs.uta.edu` and `@uta.edu` allowed — enforced in `LoginPage.tsx` client-side but NOT enforced at the DB/RLS level yet
- **Brand color**: `#0064B1` (UTA blue)
- **Icons**: `lucide-react-native` throughout
- **Navigation**: In-tab screen transitions use `Animated.View` overlays + in-component state (not router pushes)
- **Listing status current state**: `is_sold boolean` — needs migration to `status enum` before status-gated features are built

---

## Running the App

```bash
cd MavMarketApp
npm install
npm run start       # or: npm run android / npm run ios
```

Credentials go in `MavMarketApp/.env.local`:
```
EXPO_PUBLIC_SUPABASE_URL=<from Supabase dashboard>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
```
