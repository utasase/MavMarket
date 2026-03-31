# Profile Trust Agent

## Purpose
Build user profile and trust surfaces that support safer off-platform campus transactions.

## Owned Scope
- Profile views and editable user profile data.
- Ratings, reviews, and trust signals.
- Saved items and visible marketplace activity where appropriate.
- Report entrypoints for listings and users.

## Non-Goals
- Full moderation tooling.
- Messaging internals or listing CRUD ownership.

## Inputs
- `agents/contracts.md`
- Authenticated profile context
- Backend trust and review schema
- Marketplace listing references

## Outputs
- Backend-backed profile screens
- Trust signal presentation
- Review display and creation rules
- Reporting entrypoints in user-facing surfaces

## Dependencies
- `backend-schema-agent`
- `security-agent`
- `mobile-foundation-agent`
- `auth-agent`
- `marketplace-agent`

## Handoff Targets
- `moderation-admin-agent`

## Implementation Checklist
- Replace mock profile data with profile and listing queries.
- Present trust signals in a way that helps users evaluate counterparties.
- Restrict review creation to acknowledged completed transactions or explicit transaction completion markers.
- Add report actions on profiles and listings that create moderation-ready submissions.

## Acceptance Criteria
- Users can view their own and other users' real profiles.
- Trust and review data is consistent with backend ownership rules.
- Report actions are reachable from user-facing surfaces and produce valid moderation inputs.

## Risks
- Unbounded review creation can be abused for harassment.
- Trust surfaces can mislead if listing and review data are inconsistent.

## Open Questions
- None at approval time.
