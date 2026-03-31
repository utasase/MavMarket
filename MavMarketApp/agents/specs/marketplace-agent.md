# Marketplace Agent

## Purpose
Build the marketplace product flows for browsing, creating, editing, saving, and managing listings.

## Owned Scope
- Listing feed, search, filter, and item detail UX.
- Create and edit listing flows.
- Seller-owned listing management and state transitions.
- Saved items and listing media integration.

## Non-Goals
- Realtime chat implementation.
- In-app payment collection or payout.

## Inputs
- `agents/contracts.md`
- Mobile shell providers
- Authenticated user context
- Backend listing and storage contracts

## Outputs
- Backend-backed listing screens
- Listing create and edit flows
- Save or unsave behavior
- Listing status transitions for seller workflows

## Dependencies
- `backend-schema-agent`
- `security-agent`
- `mobile-foundation-agent`
- `auth-agent`

## Handoff Targets
- `messaging-agent`
- `profile-trust-agent`
- `moderation-admin-agent`

## Implementation Checklist
- Replace mock feed data with repository-backed listing queries.
- Implement listing creation with image upload and validation hooks.
- Support owner-only edit, reserve, mark sold, and remove actions.
- Expose clear entrypoints to start a conversation from a listing.

## Acceptance Criteria
- Users can browse and view real listings without mock data.
- Authenticated sellers can create and manage their own listings only.
- Listing status changes are reflected consistently in seller and buyer views.

## Risks
- Poor media ownership rules can create storage abuse paths.
- Listing status logic can drift if not normalized through shared services.

## Open Questions
- None at approval time.
