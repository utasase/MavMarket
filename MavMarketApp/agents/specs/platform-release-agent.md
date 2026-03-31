# Platform Release Agent

## Purpose
Prepare the Expo-managed app for repeatable preview and production release workflows.

## Owned Scope
- Expo and EAS release readiness.
- Environment separation for local, preview, and production.
- Build, signing, update, and operational readiness checklists.
- Analytics and crash-reporting integration requirements if added.

## Non-Goals
- Core product feature implementation.
- Native bare-workflow migration.

## Inputs
- `agents/contracts.md`
- Mobile shell outputs
- Security requirements
- Completed feature flows

## Outputs
- Environment strategy
- EAS build and preview expectations
- Release checklist
- Operational follow-up list

## Dependencies
- `security-agent`
- `mobile-foundation-agent`
- `auth-agent`
- `marketplace-agent`
- `messaging-agent`
- `moderation-admin-agent`

## Handoff Targets
- `payment-architecture-agent`

## Implementation Checklist
- Define environment variables and separation rules for local, preview, and production.
- Prepare Expo/EAS build assumptions and release checklists.
- Ensure secrets are not committed and environment injection is documented.
- Validate that accepted feature flows are compatible with preview builds.

## Acceptance Criteria
- The app has a documented path to produce preview builds.
- Environment handling is clear enough for repeatable releases.
- Release blockers and deferred operational gaps are explicit.

## Risks
- Undocumented environment setup can stall deployment.
- Missing preview validation can hide release-only failures.

## Open Questions
- None at approval time.
