# Security Agent

## Purpose
Own the production-ready security baseline for auth, data access, abuse prevention, and auditable actions.

## Owned Scope
- Supabase RLS policy design and review.
- Session security expectations and secure storage rules.
- Abuse controls for auth, messaging, and reporting.
- Audit event policy and threat review.

## Non-Goals
- UI polish or product copy.
- Payment compliance implementation in phase 1.

## Inputs
- `agents/contracts.md`
- Backend schema outputs
- Auth and moderation requirements

## Outputs
- RLS policy matrix
- Threat model and security checklist
- Abuse throttling requirements
- Audit event coverage requirements

## Dependencies
- `backend-schema-agent`

## Handoff Targets
- `auth-agent`
- `marketplace-agent`
- `messaging-agent`
- `moderation-admin-agent`
- `platform-release-agent`

## Implementation Checklist
- Define table-level read and write rules for owners, participants, and admins.
- Require secure handling for persisted sessions and secrets.
- Add rate-limit and anti-spam requirements for signup, login, messages, and reports.
- Identify security-sensitive events that must emit audit records.

## Acceptance Criteria
- Unauthorized users cannot read or mutate another user's protected records.
- Every privileged action path has an explicit authorization rule.
- Security controls are documented well enough for release review.

## Risks
- Weak participant checks can expose private messages.
- Missing audit coverage can make moderation and incident response unreliable.

## Open Questions
- None at approval time.
