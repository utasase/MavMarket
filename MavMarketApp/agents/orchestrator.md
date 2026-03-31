# Orchestrator Rules

## Objective
Coordinate bounded agents to build Mav Market without overlapping ownership, unstable interfaces, or schema drift.

## Delivery Order
1. Lock shared contracts and execution order from `manifest.json`.
2. Finalize schema and security invariants before feature implementation.
3. Build mobile foundation before product feature agents start UI refactors.
4. Release-facing work starts only after core product agents meet acceptance gates.
5. Payment work remains architecture-only in phase 1.

## Handoff Rules
- Every agent must consume the latest `agents/contracts.md` before editing code.
- Agents may propose interface changes, but only the orchestrator can approve contract changes that affect multiple agents.
- If two agents need the same file family, the orchestrator assigns a temporary owner and queues the other change.
- Schema changes require explicit review from both `backend-schema-agent` and `security-agent`.
- Auth or moderation changes that alter access control require a new audit pass before merge.

## Definition Of Done
- Owned acceptance criteria in the spec are satisfied.
- Changes do not violate any contract in `contracts.md`.
- Required upstream dependencies are already accepted.
- Tests for the owned scope pass locally.
- New risks and follow-up items are documented if anything is intentionally deferred.

## Conflict Resolution
- Security beats convenience when scopes conflict.
- Shared data contract disagreements are resolved in favor of the smallest stable interface.
- Product polish changes do not block correctness, access control, or data integrity work.
- Phase-2 payment design cannot expand v1 product scope.

## Release Gates
- Auth, listings, chat, reporting, and moderation data paths are functional.
- RLS rules block unauthorized access for all user-owned data.
- Preview release configuration exists for Expo/EAS.
- Known deferred items are documented and do not create silent security gaps.
