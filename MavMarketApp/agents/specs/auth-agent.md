# Auth Agent

## Purpose
Implement real UTA-only account access and session lifecycle management on top of Supabase auth.

## Owned Scope
- Signup, login, logout, password reset, and session restoration flows.
- Email-domain enforcement for `mavs.uta.edu` and `uta.edu`.
- Profile bootstrap on first signup.
- Protected route integration with the mobile shell.

## Non-Goals
- Institutional SSO.
- Payments or moderation workflows beyond auth-related controls.

## Inputs
- `agents/contracts.md`
- Security policy
- Mobile shell providers
- Backend profile schema

## Outputs
- Working auth screens and flows
- Session-aware route guard integration
- Profile bootstrap mutation
- Auth-related tests

## Dependencies
- `backend-schema-agent`
- `security-agent`
- `mobile-foundation-agent`

## Handoff Targets
- `marketplace-agent`
- `messaging-agent`
- `profile-trust-agent`
- `platform-release-agent`

## Implementation Checklist
- Replace mock login behavior with real Supabase auth calls.
- Enforce allowed email domains before auth submission and in backend validation rules where possible.
- Persist and restore authenticated session state safely.
- Create a profile record on first successful account creation.

## Acceptance Criteria
- Only allowed UTA email domains can create accounts.
- Signed-out users cannot access authenticated routes.
- Session survives app restart and cleanly clears on logout.

## Risks
- Client-only email checks are insufficient without backend reinforcement.
- Weak session restore handling can create broken navigation loops.

## Open Questions
- None at approval time.
