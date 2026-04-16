# MavMarket Development Roadmap

## Summary

This document outlines the planned improvements and bug fixes for the MavMarket mobile application. The primary goals are to ensure a smooth user experience, handle edge cases gracefully, and maintain high code quality through a robust test suite.

The following backlog is based on a comprehensive review of the current implementation and test coverage.

## Project Guardrails

When addressing the tasks below, we adhere to the following principles:
- **Surgical Changes**: Focus on the specific issue without unnecessary refactoring.
- **Behavior Preservation**: Maintain existing functionality unless a change is required to fix a bug.
- **Robust Testing**: Always include or update tests to verify fixes and prevent regressions.
- **Backend Consistency**: Ensure that any required database or API changes are properly documented and implemented.

## Backlog

### P0. Restore the Mobile Test Harness for Rate-Limited Flows

**Why this matters**
The mobile app uses rate-limiting RPCs in production, but the current test mock lacks support for these calls. This causes tests to fail before they can validate the actual business logic.

**Action Plan**
- Extend the shared Supabase mock client to support `rpc` calls.
- Maintain consistency with existing mock helpers like `mockResolve()` and `mockResolveOnce()`.
- Update message and report tests to cover both rate-limited and non-limited scenarios.

### P0. Stop Showing Mock Listings When the Real Database Returns an Empty Result

**Why this matters**
The home screen currently falls back to mock data even when the database successfully returns an empty set of listings. This can misrepresent the real state of the marketplace.

**Action Plan**
- Update the loading logic to treat a successful empty result as the source of truth.
- Reserve mock data fallback only for genuine connection or configuration failures.
- Ensure the UI correctly displays an "empty state" when no real listings are available.

### P1. Open the Specific Conversation After Tapping "Message Seller"

**Why this matters**
Tapping "Message Seller" on a listing currently takes the user to the general inbox instead of the specific conversation thread, creating friction for the user.

**Action Plan**
- Capture the ID of the created or retrieved conversation.
- Use deep-linking to route the user directly to `/(tabs)/messages?conversationId=<id>`.

### P1. Make the Buy Flow Settle Cleanly on Cancel

**Why this matters**
If a user cancels a purchase confirmation, the "Buy" button may remain in a loading state, preventing further interaction.

**Action Plan**
- Implement a callback to clear the loading state when the user cancels the purchase alert.
- Ensure the UI remains responsive after both cancelled and failed checkout attempts.

### P1. Improve Password Reset Feedback

**Why this matters**
The app currently reports success for password reset requests even if the API call fails, which can mislead users.

**Action Plan**
- Inspect the API response for errors and provide appropriate feedback to the user.
- Maintain existing email validation rules.

### P1. Harden Messaging and Report Writes

**Why this matters**
Messaging and reporting involve multiple database writes. A failure in a later step can leave the system in an inconsistent state (e.g., a message is sent but the conversation summary is not updated).

**Action Plan**
- Investigate transactional boundaries for these multi-step processes.
- Implement error handling that ensures a coherent user-facing result even if a partial failure occurs.

### P2. Hide Inactive Listings on Public Profiles

**Why this matters**
Public profiles currently show all listings for a seller, regardless of status. This can leak private states (like drafts or removed items) to other users.

**Action Plan**
- Implement status-based filtering for listings shown on public profiles.
- Ensure the profile owner can still see all of their own listings.

## Verification Checklist

For each implemented fix, we verify:
- All Jest tests pass (`npm run test`).
- Manual smoke tests for the affected flow (Login, Home, Messages, etc.).
- Both success and error paths are handled correctly.
