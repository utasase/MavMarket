# Payment Architecture Agent

## Purpose
Design future payment support so Stripe Connect or a similar platform can be added later without rewriting core marketplace flows.

## Owned Scope
- Deferred payment architecture only.
- Future interface boundaries for checkout, payout, fees, and dispute metadata.
- Additive schema placeholders and service abstractions that do not change v1 behavior.

## Non-Goals
- Active in-app payment collection.
- Payout onboarding or compliance implementation in phase 1.

## Inputs
- `agents/contracts.md`
- Listing lifecycle outputs
- Security and release constraints

## Outputs
- Future payment boundary document
- Additive extension points
- Non-invasive schema recommendations

## Dependencies
- `backend-schema-agent`
- `security-agent`
- `marketplace-agent`
- `platform-release-agent`

## Handoff Targets
- None in phase 1

## Implementation Checklist
- Define the smallest future-facing interface for payment intents, seller payouts, and platform fees.
- Keep payment references optional and dormant in phase 1.
- Avoid reshaping listing, messaging, or review flows for speculative payment logic.
- Document the trigger point for a future Stripe Connect implementation wave.

## Acceptance Criteria
- Future payment work can start without rewriting accepted v1 features.
- Phase-1 product scope stays free of active payment behavior.
- Extension points are additive, not invasive.

## Risks
- Over-designing payments can stall phase 1.
- Under-designing payments can force avoidable schema churn later.

## Open Questions
- None at approval time.
