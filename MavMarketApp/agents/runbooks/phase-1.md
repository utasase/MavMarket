# Phase 1 Runbook

## Goal
Turn the current mock Expo app into a production-oriented mobile marketplace foundation with real auth, listings, chat, trust, moderation, and release scaffolding.

## Execution Sequence
1. `orchestrator-agent`
   Lock contracts, map ownership, and split work into non-overlapping tracks.
2. `backend-schema-agent`
   Define Supabase tables, storage buckets, migrations, typed interfaces, and seed assumptions.
3. `security-agent`
   Add RLS design, abuse controls, secure session rules, and audit event policy.
4. `mobile-foundation-agent`
   Refactor the app shell, providers, navigation guards, and environment wiring.
5. `auth-agent`
   Replace mock login with real Supabase auth and bootstrap profile creation.
6. `marketplace-agent`
   Replace mock listings with backend-backed browse, detail, create, edit, save, and status flows.
7. `messaging-agent`
   Replace mock inbox and chat with persisted conversations, realtime subscriptions, and unread state.
8. `profile-trust-agent`
   Connect profiles, ratings, reviews, favorites, and report entrypoints.
9. `moderation-admin-agent`
   Add report creation, moderation statuses, admin review requirements, and audit links.
10. `platform-release-agent`
    Add environment separation, Expo/EAS readiness, and release checklists.
11. `payment-architecture-agent`
    Add future-facing payment extension points without changing v1 behavior.

## Acceptance Gates
- Schema and RLS are accepted before feature agents rely on them.
- Mobile foundation is accepted before auth or feature screen rewrites expand.
- Messaging does not ship until participant authorization is verified.
- Release work does not mark complete until the app is buildable in a preview profile.
