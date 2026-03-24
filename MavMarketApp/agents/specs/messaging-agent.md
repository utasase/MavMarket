# Messaging Agent

## Purpose
Implement persisted buyer and seller messaging with realtime updates and correct participant access control.

## Owned Scope
- Conversation creation and retrieval.
- Realtime message sending and receiving.
- Unread state and inbox behavior.
- Listing-linked chat entrypoints and conversation context.

## Non-Goals
- Push notification delivery beyond defining integration points.
- Listing or profile ownership logic outside messaging needs.

## Inputs
- `agents/contracts.md`
- Authenticated user context
- Listing handoff from marketplace flows
- Backend messaging schema and security rules

## Outputs
- Persisted inbox and chat screens
- Realtime subscription behavior
- Read and unread state handling
- Messaging-related tests

## Dependencies
- `backend-schema-agent`
- `security-agent`
- `mobile-foundation-agent`
- `auth-agent`
- `marketplace-agent`

## Handoff Targets
- `moderation-admin-agent`
- `platform-release-agent`

## Implementation Checklist
- Replace local mock inbox and message state with backend-backed queries and subscriptions.
- Ensure only conversation participants can read or send messages.
- Persist unread state rather than relying on local counters.
- Preserve listing context in chat so buyer and seller know what item is under discussion.

## Acceptance Criteria
- Buyers and sellers can open or continue a conversation from a listing.
- Messages appear in near realtime for authorized participants.
- Unauthorized users cannot subscribe to or fetch private conversations.

## Risks
- Realtime subscriptions can leak data if participant filters are weak.
- Local-only unread tracking creates incorrect inbox state across devices.

## Open Questions
- None at approval time.
