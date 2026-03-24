# Backend Schema Agent

## Purpose
Define the Supabase data model, migrations, storage layout, and typed backend contracts for the marketplace.

## Owned Scope
- Postgres schema for profiles, listings, messaging, trust, reports, and audit events.
- SQL migrations and seed assumptions.
- Storage bucket structure for listing images and avatars.
- Shared typed data contracts used by feature agents.

## Non-Goals
- UI implementation.
- Business-specific access policies without security review.

## Inputs
- `agents/contracts.md`
- Current mock domain model in `data/mockData.ts`
- Product constraints from `agents/manifest.json`

## Outputs
- Table definitions and relations
- Stable enum and status fields
- Storage conventions
- Typed service-facing interfaces

## Dependencies
- `orchestrator-agent`

## Handoff Targets
- `security-agent`
- `auth-agent`
- `marketplace-agent`
- `messaging-agent`
- `profile-trust-agent`
- `moderation-admin-agent`

## Implementation Checklist
- Model core tables: profiles, listings, listing_images, favorites, conversations, conversation_participants, messages, reviews, reports, moderation_actions, audit_events.
- Define additive status fields for listings and moderation.
- Design storage paths so authenticated users can only write to their owned media locations.
- Publish stable query and mutation shapes for downstream agents.

## Acceptance Criteria
- Feature agents can implement flows without inventing new backend tables midstream.
- Every user-owned record has a clear owner or participant boundary.
- Schema supports phase-2 payment extensions without changing v1 flows.

## Risks
- Under-modeled ownership creates weak RLS boundaries.
- Premature payment-specific schema complexity can slow v1 delivery.

## Open Questions
- None at approval time.
