# Moderation Admin Agent

## Purpose
Implement the report and review architecture needed to moderate listings, users, and abuse signals.

## Owned Scope
- Report creation contract and status lifecycle.
- Admin review queue requirements and moderation action model.
- User-facing report reasons and minimal moderation UX expectations.
- Audit integration for moderation decisions.

## Non-Goals
- Full internal admin web console unless separately scoped.
- Automated image or text moderation in phase 1.

## Inputs
- `agents/contracts.md`
- Backend report schema
- Security audit policy
- Reporting entrypoints from profile and marketplace agents

## Outputs
- Report lifecycle definition
- Moderation action requirements
- Admin review surface requirements
- Audit-linked moderation flows

## Dependencies
- `backend-schema-agent`
- `security-agent`
- `marketplace-agent`
- `messaging-agent`
- `profile-trust-agent`

## Handoff Targets
- `platform-release-agent`

## Implementation Checklist
- Define allowed report reasons and required metadata.
- Model moderation statuses and actions for listings and user accounts.
- Ensure all moderation actions emit audit events.
- Keep the initial admin surface minimal, but decision-complete enough for review operations.

## Acceptance Criteria
- Users can report listings and profiles with structured reasons.
- Moderation state can move from open to review to resolution without ad hoc data changes.
- Review actions are auditable.

## Risks
- Missing target metadata can make reports unusable.
- Weak audit coverage creates operational and trust issues.

## Open Questions
- None at approval time.
