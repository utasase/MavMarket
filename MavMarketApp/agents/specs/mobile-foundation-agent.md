# Mobile Foundation Agent

## Purpose
Refactor the Expo app from mock local state into a provider-based mobile shell ready for real backend-backed features.

## Owned Scope
- App shell, providers, navigation boundaries, and route guards.
- Environment configuration and shared service initialization.
- Shared UI primitives and reusable loading or error states.
- Baseline state and query architecture used by feature agents.

## Non-Goals
- Direct auth business rules.
- Feature-specific data modeling outside shared UI and app shell needs.

## Inputs
- `agents/contracts.md`
- Current Expo router structure
- Security and schema constraints

## Outputs
- Stable app bootstrap flow
- Shared providers for session and backend access
- Route guard pattern for authenticated screens
- Consistent shared UI shell

## Dependencies
- `orchestrator-agent`
- `backend-schema-agent`
- `security-agent`

## Handoff Targets
- `auth-agent`
- `marketplace-agent`
- `messaging-agent`
- `profile-trust-agent`
- `platform-release-agent`

## Implementation Checklist
- Replace local splash/login/app toggles with provider-driven routing.
- Introduce centralized backend client setup and environment injection.
- Establish screen-level loading, empty, and error patterns.
- Preserve current route structure where possible to avoid unnecessary churn.

## Acceptance Criteria
- Downstream agents can build against stable providers and guarded routes.
- The app no longer depends on local mock auth state to enter the product.
- Shared initialization paths are reusable across all screens.

## Risks
- Over-refactoring the route tree can slow all downstream agents.
- Unclear provider boundaries can leak direct backend calls into UI code.

## Open Questions
- None at approval time.
