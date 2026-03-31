# Mav Market: Investor Demo With A Production Backbone

## Summary
This document is the master orchestration plan for taking Mav Market from a mock Expo frontend into an investor-ready product with a production-shaped architecture. The implementation should keep the current mobile app on Expo SDK 55 and `expo-router`, keep Supabase as the backend platform, and add a separate internal web admin surface for moderation and operations.

This plan assumes:
- Target milestone: investor demo
- Backend direction: keep Supabase
- Admin model: separate web admin surface
- Payments remain deferred from v1

## Recommended Stack And Why
- Expo SDK 55 + React Native 0.83 + React 19
  - Already in the repo, minimizes churn, and keeps fast mobile delivery.
- Expo Router protected routes
  - Best fit for replacing the current mock `splash/login/app` gate with provider-driven auth flow.
- Supabase Auth + Postgres + Storage + Realtime + RLS
  - Fastest path to real auth, data, chat, storage, and authorization with one operational surface.
- TanStack Query v5
  - Gives disciplined server-state caching, invalidation, retries, and optimistic updates across mobile screens.
- Supabase CLI + generated TypeScript types
  - Keeps schema, migrations, and app contracts synchronized instead of letting agents invent data shapes.
- `expo-image-picker`
  - Cleanest fit for listing image and avatar uploads in Expo-managed workflow.
- `expo-secure-store`
  - Use for sensitive session persistence; stronger mobile posture than generic local persistence alone.
- Next.js App Router for admin console
  - Fastest way to build a presentable internal review tool with preview deployments and a mature DX.
- Vercel for admin deployment
  - Simplifies preview URLs for internal review and operations.
- Jest + React Native Testing Library
  - Baseline testing stack for screen logic, repositories, and critical interaction flows.
- EAS Build + EAS Update
  - Required for repeatable preview builds, internal distribution, and safe JS-only updates.

## Architecture Direction
- Keep the existing Expo app as the primary consumer surface.
- Introduce `/supabase` for migrations, seed data, and local backend workflow.
- Introduce `/shared` for generated database types and shared contracts.
- Introduce `/ops-admin` as a separate internal admin app for moderation and operational review.
- Treat `agents/contracts.md` as the hard boundary for:
  - database types
  - repository interfaces
  - auth/session rules
  - report lifecycle states
  - audit event requirements
  - admin-role assumptions

## Delivery Phases
1. Orchestration hardening
   - Update the `agents` system itself so the agent graph matches the real work.
   - Add an `ops-admin-web-agent`.
   - Tighten each agent brief so handoffs are artifact-based and decision-complete.

2. Backend foundation
   - Design the Supabase schema and migrations.
   - Define storage layout.
   - Generate shared TypeScript database types.
   - Publish repository-facing contracts.

3. Security baseline
   - Define RLS policies for every exposed table.
   - Define storage ownership rules.
   - Define abuse controls for auth, chat, and reporting.
   - Define audit-event requirements.

4. Mobile foundation
   - Replace local app-state gating with providers and guarded routes.
   - Add Supabase client initialization.
   - Add TanStack Query and shared loading/error patterns.
   - Remove direct mock-data dependency from app entry flows.

5. Product feature tracks
   - Auth
   - Marketplace
   - Messaging
   - Profiles and trust
   - Reporting and moderation hooks

6. Admin and release readiness
   - Build internal admin console.
   - Add EAS environment separation and build profiles.
   - Add preview distribution and release checklist.
   - Validate investor demo path on physical devices.

## Required Backend Model
The schema should cover at least:
- `profiles`
- `listings`
- `listing_images`
- `favorites`
- `conversations`
- `conversation_participants`
- `messages`
- `reviews`
- `reports`
- `moderation_actions`
- `audit_events`

Key rules:
- RLS enabled on all exposed tables.
- Every user-owned row must have a clear owner boundary.
- Every private conversation path must be participant-scoped.
- Realtime must only expose authorized participant changes.
- Listing and avatar media must use owned storage paths.
- Payment-related fields must remain optional and dormant in v1.

## Mobile App Changes
- Replace `app/_layout.tsx` local state gate with:
  - `SessionProvider`
  - `QueryClientProvider`
  - protected route groups
- Preserve the current tab structure where possible:
  - home
  - swipe/discover
  - messages
  - profile
- Replace `data/mockData.ts` as the runtime source of truth with typed repositories.
- Keep the UI presentable for investors, but do not let demo polish override auth, authorization, or data integrity.

## Admin Surface
A separate `ops-admin` app should include:
- sign-in restricted to internal/admin accounts
- report queue
- report detail view
- resolution workflow
- audit lookup
- listing/user moderation status controls

This should stay out of the consumer mobile app to reduce security and UX complexity.

## Agent Plan
- `orchestrator-agent`
  - Lock scope boundaries, execution order, acceptance gates, and contract ownership.
- `backend-schema-agent`
  - Design schema, migrations, enums, relations, and generated type workflow.
- `security-agent`
  - Produce RLS matrix, storage rules, abuse controls, and audit requirements.
- `mobile-foundation-agent`
  - Refactor app shell, providers, route guards, service initialization, and shared query patterns.
- `auth-agent`
  - Implement UTA-only email/password auth, session restore, logout, password reset, and profile bootstrap.
- `marketplace-agent`
  - Implement browse, detail, create, edit, image upload, save/unsave, and seller status transitions.
- `messaging-agent`
  - Implement conversation creation, inbox, unread state, and participant-safe realtime chat.
- `profile-trust-agent`
  - Implement real profile surfaces, trust signals, reviews, saved items, and reporting entrypoints.
- `moderation-admin-agent`
  - Define report reasons, statuses, moderation actions, and audit-linked review model.
- `ops-admin-web-agent`
  - Build the internal web console in Next.js.
- `platform-release-agent`
  - Add EAS profiles, environment strategy, preview distribution, and release checklist.
- `payment-architecture-agent`
  - Document dormant extension points only; do not expand v1 product scope.

## Suggested Agent Prompts
- Orchestrator:
  - "Read `agents/manifest.json`, `agents/contracts.md`, and all current specs. Rewrite the execution plan so every downstream agent can work without making product or architecture decisions. Add any missing agent roles needed for an internal admin surface."
- Backend schema:
  - "Design the full Supabase schema, SQL migrations, storage layout, and generated TypeScript contract workflow for Mav Market. Downstream agents must be able to build features without inventing tables or statuses."
- Security:
  - "Write a production-ready security baseline for Supabase RLS, storage ownership, auth/session handling, abuse controls, and auditable actions. Reject any path that allows cross-user data leakage."
- Mobile foundation:
  - "Refactor the Expo app from mock local state into provider-driven architecture using Supabase client initialization, TanStack Query, and guarded routes. Preserve current route structure unless a change is necessary."
- Auth:
  - "Implement UTA-only email/password auth with domain restrictions, session restoration, logout, password reset, and profile bootstrap using shared contracts."
- Marketplace:
  - "Replace mock listings with typed repository-backed browse, detail, create, edit, media upload, save/unsave, and seller management flows."
- Messaging:
  - "Implement listing-linked conversations, persisted unread state, and participant-scoped realtime messaging using Supabase Realtime."
- Profile and trust:
  - "Implement real profiles, trust indicators, review constraints, and report entrypoints without creating overlapping ownership with marketplace or moderation."
- Moderation:
  - "Define structured report intake, moderation lifecycle states, review actions, and audit-event requirements for internal admin use."
- Admin web:
  - "Build a presentable internal moderation console in Next.js App Router with report queue, detail review, resolution actions, and audit visibility."
- Platform release:
  - "Prepare Expo/EAS environments, build profiles, preview distribution, release checklists, and operational readiness guidance for both mobile and admin surfaces."

## Work Outside Agentic Programming
- Create a real product brief for the investor demo:
  - target user
  - core story
  - demo script
  - deferred scope
- Set up external services:
  - Supabase project
  - Expo/EAS project
  - Apple Developer
  - Google Play Console
  - Vercel
  - domain/DNS
- Prepare legal and operational docs:
  - privacy policy
  - terms
  - moderation policy
  - campus safety guidance
  - incident response path
- Replace stock and placeholder content with realistic data and branded copy.
- Run a controlled UTA pilot with seeded data before any public-facing launch claims.

## Test And Acceptance Plan
- Unit tests for:
  - repositories
  - auth guards
  - listing mutations
  - unread logic
  - report creation
- Integration tests for:
  - signup/signin
  - listing creation
  - message flow
  - report flow
- End-to-end smoke tests for:
  - account creation
  - browse listings
  - create listing
  - message seller
  - resolve report in admin
- Release validation:
  - preview builds on physical devices
  - environment separation checks
  - EAS Update rollback procedure
- Security acceptance:
  - verify RLS isolation
  - verify participant-only chat access
  - verify admin-only moderation actions
  - verify storage ownership enforcement

## Documentation Basis
This plan should cite current primary documentation as of March 24, 2026:
- Expo SDK 55: [expo.dev/sdk](https://expo.dev/sdk)
- Expo Router auth/protected routes: [docs.expo.dev/router](https://docs.expo.dev/router/advanced/authentication/)
- Supabase Expo React Native setup: [supabase.com/docs](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)
- Supabase Row Level Security: [supabase.com/docs](https://supabase.com/docs/guides/database/postgres/row-level-security)
- Supabase Realtime: [supabase.com/docs](https://supabase.com/docs/guides/realtime/postgres-changes)
- Supabase generated types: [supabase.com/docs](https://supabase.com/docs/guides/api/rest/generating-types)
- Supabase CLI local development: [supabase.com/docs](https://supabase.com/docs/guides/local-development/cli/getting-started)
- TanStack Query: [tanstack.com/query](https://tanstack.com/query/latest/docs/framework/react/overview)
- Expo EAS environments: [docs.expo.dev/eas/environment-variables](https://docs.expo.dev/eas/environment-variables/)
- Expo `eas.json`: [docs.expo.dev/build/eas-json](https://docs.expo.dev/build/eas-json/)
- EAS Update: [docs.expo.dev/eas-update](https://docs.expo.dev/eas-update/introduction/)
- Next.js App Router: [nextjs.org/docs/app](https://nextjs.org/docs/app)
- Vercel preview deployments: [vercel.com/docs](https://vercel.com/docs/deployments/generated-urls)

## Assumptions
- `agents/plan.md` is the canonical orchestration document, not just a note file.
- The repo should remain mobile-first, with admin split into a separate web app.
- Investor-demo quality means polished core flows with real backend behavior, not full public-launch completeness.
- Payments, SSO, automated moderation, and full growth tooling remain explicitly deferred.
