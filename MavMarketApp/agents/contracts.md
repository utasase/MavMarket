# Shared Contracts

These contracts are the stable boundary between agents. Agents should add implementation detail in code, not redefine these interfaces ad hoc.

## App Architecture
- The app stays in Expo managed workflow and uses `expo-router`.
- App state must move from local screen toggles to provider-based session and data access boundaries.
- Feature screens may call shared hooks and service wrappers, not raw table access from arbitrary components.

## Data Access
- Supabase access must be wrapped by typed repository or service modules.
- Mutations must return stable typed results with explicit success or failure states.
- Feature agents may extend DTOs, but breaking changes require orchestrator approval.

## Authentication
- Supported auth in phase 1 is UTA email/password only.
- Allowed email domains are `mavs.uta.edu` and `uta.edu`.
- Protected routes require a valid persisted session.
- Account bootstrap must create a profile record on first successful signup.

## Listings
- Listings have owner, category, condition, description, price, status, pickup preference, and image references.
- Images upload through a validated storage path owned by the authenticated seller.
- Listing status must support at least `draft`, `active`, `reserved`, `sold`, and `removed`.

## Messaging
- Conversations are tied to participants and may reference a listing.
- Messages are persisted and streamed through Supabase realtime.
- Realtime subscriptions must be scoped to authorized participants only.
- Unread counts are derived from persisted state, not local-only counters.

## Profiles And Trust
- Profiles expose user identity, avatar, bio, trust signals, and marketplace activity.
- Reviews are tied to a completed off-platform transaction acknowledgment, not arbitrary public posting.
- Reporting entrypoints must exist on both listings and user profiles.

## Moderation
- Reports must capture reporter, target type, target id, reason, optional note, and status.
- Moderation statuses must support at least `open`, `under_review`, `resolved`, and `dismissed`.
- Moderation actions must emit audit events.

## Security
- User-owned data must be protected by RLS.
- Secrets stay outside repo-tracked files.
- Security-sensitive events must be auditable.
- Abuse controls must exist for auth attempts, reporting spam, and message spam.

## Payments
- No active in-app payment capture or payout is implemented in phase 1.
- Future payment support must remain additive and must not reshape v1 listing or conversation flows.
