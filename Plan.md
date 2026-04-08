# MavMarketApp Bug Review and Fix Plan

## Summary

This file is the implementation backlog for the mobile app in `MavMarketApp/`.

The goal is not to refactor the app broadly. The goal is to remove demo-breaking behavior, close obvious edge cases, and improve trust in the existing test suite. Findings below are based on:

- targeted code review of `components/`, `lib/`, and current tests
- `cmd /c npm run test -- --runInBand` in `MavMarketApp/`
- inspection of user-critical flows: listings, auth, messaging, reporting, payments, and profile views

Current test signal at the time of review:

- `8` test suites total
- `6` passing
- `2` failing
- failing areas: `__tests__/lib/messages.test.ts`, `__tests__/lib/reports.test.ts`

## Shared Agent Guardrails

Use these constraints for every bug-fix task below:

- Work surgically. Do not refactor unrelated screens, rename public APIs casually, or restyle components.
- Keep existing product behavior unless the bug requires changing it.
- Preserve mock-data fallback behavior where it is intentional, but do not let fallback hide successful empty results.
- Add or update tests for the exact bug being fixed.
- If the cleanest fix needs a backend migration, RPC, or Edge Function, say so explicitly in your summary and implement the smallest coherent end-to-end change you can support from this repo.
- Do not "fix" tests by removing production logic such as rate limiting, auth checks, or error handling.

## Backlog

### P0. Restore the Mobile Test Harness for Rate-Limited Flows

**Why this matters**

The mobile app now uses `supabase.rpc("is_rate_limited", ...)` in production code, but the shared Jest mock still exposes only `from(...)` and `channel(...)`. That means message/report tests fail before they reach the real behavior we want to validate.

**Evidence**

- `MavMarketApp/lib/messages.ts:120` calls `supabase.rpc(...)`
- `MavMarketApp/lib/reports.ts:27` calls `supabase.rpc(...)`
- `MavMarketApp/__tests__/helpers/supabaseMock.ts:109-111` defines `from` and `channel`, but no `rpc`
- `cmd /c npm run test -- --runInBand` currently fails in `__tests__/lib/messages.test.ts` and `__tests__/lib/reports.test.ts` with `TypeError: _supabase.supabase.rpc is not a function`

**Potential fix directions**

- Extend the shared mock client with an `rpc` method that supports both default and queued responses.
- Keep the mock ergonomics consistent with the existing `mockResolve()` and `mockResolveOnce()` helpers.
- Update the message/report tests to cover both `limited = false` and `limited = true`.

**How to test the fix**

- Run `cmd /c npm run test -- --runInBand`
- Confirm the current two failing suites pass
- Add assertions that `rpc("is_rate_limited", ...)` is called with the expected action names and parameters

**AI agent prompt**

```text
You are fixing a broken Jest test harness in `MavMarketApp`, not changing app behavior.

Problem:
- `lib/messages.ts` and `lib/reports.ts` now call `supabase.rpc("is_rate_limited", ...)`
- the shared mock in `__tests__/helpers/supabaseMock.ts` does not implement `rpc`
- current tests fail with `TypeError: _supabase.supabase.rpc is not a function`

Your task:
1. Update `__tests__/helpers/supabaseMock.ts` so the mock client supports `rpc` with the same queued/default response style already used for query chains.
2. Update `__tests__/lib/messages.test.ts` and `__tests__/lib/reports.test.ts` to cover:
   - not rate limited
   - rate limited
   - downstream write failure after the rate-limit check
3. Keep production code intact unless a test reveals a real bug.

Constraints:
- Do not remove rate limiting from the app just to make tests pass.
- Do not rewrite the whole mock framework.
- Keep the patch focused on the smallest coherent improvement.

Acceptance:
- `cmd /c npm run test -- --runInBand` passes.
- tests explicitly verify the rate-limit RPC path instead of only bypassing it.
```

### P0. Stop Showing Mock Listings When the Real Database Returns an Empty Result

**Why this matters**

The home screen currently treats "zero listings returned successfully" the same as "the backend failed," which means a real empty marketplace can still render fake demo items.

**Evidence**

- `MavMarketApp/components/HomePage.tsx:38` initializes `allListings` with `mockListings`
- `MavMarketApp/components/HomePage.tsx:50` only calls `setAllListings(data)` when `data.length > 0`

**User impact**

- A clean or freshly seeded database can display stale mock data
- Empty-state behavior is masked, so demos can misrepresent the real system

**Potential fix directions**

- On successful fetch, always replace `allListings` with the returned array, including `[]`
- Keep mock listings only for actual fetch failure / missing backend configuration
- Consider tracking a separate `usedFallbackData` or `loadFailed` flag if the UI needs to explain why mock content is visible

**How to test the fix**

- Unit test or component test the load path for:
  - successful fetch with non-empty results
  - successful fetch with `[]`
  - rejected fetch
- Verify that an empty successful result shows the empty state instead of mock cards

**AI agent prompt**

```text
Fix the home-feed data-source bug in `MavMarketApp/components/HomePage.tsx`.

Problem:
- the screen starts with `mockListings`
- after a successful database fetch, it only replaces state when `data.length > 0`
- a valid empty result therefore keeps fake listings on screen

Your task:
1. Change the load logic so successful fetches always become the source of truth, including an empty array.
2. Preserve the current fallback behavior for genuine fetch/configuration failures.
3. Add or update tests so the difference between "empty success" and "fetch failure" is explicit.

Constraints:
- Do not remove mock-data fallback entirely.
- Do not rewrite unrelated filtering, search, or layout logic.

Acceptance:
- empty real data shows the existing empty state
- failed real data can still fall back safely
- no regression in normal non-empty loading behavior
```

### P1. Open the Specific Conversation After Tapping "Message Seller"

**Why this matters**

The listing detail screen creates a conversation successfully but then routes the user to the messages tab without the conversation id, even though the messages screen already supports deep-linking into a specific conversation.

**Evidence**

- `MavMarketApp/components/ItemDetail.tsx:79` awaits `createConversation(...)`
- `MavMarketApp/components/ItemDetail.tsx:81` pushes `"/(tabs)/messages"` without passing the returned id
- `MavMarketApp/components/MessagesPage.tsx` already reads `conversationId` from route params and opens that chat when present

**User impact**

- "Message Seller" can feel broken because it lands in the inbox list instead of the opened thread
- users with many conversations need an extra manual click to find the right chat

**Potential fix directions**

- Capture the returned conversation id and route to `/(tabs)/messages?conversationId=<id>`
- Reuse the same deep-link pattern already used by the profile messaging flow

**How to test the fix**

- Verify `Message Seller` opens the targeted chat immediately
- Confirm the behavior still works for both existing and newly created conversations
- Add a test around the navigation payload if the component test setup allows it

**AI agent prompt**

```text
Fix the listing-to-chat navigation bug in `MavMarketApp/components/ItemDetail.tsx`.

Problem:
- `createConversation(...)` returns an id
- the current code ignores that id and routes only to `/(tabs)/messages`
- `MessagesPage` already supports `conversationId` route params, so this is an integration miss

Your task:
1. Update the "Message Seller" flow to route directly into the created/found conversation.
2. Reuse the existing route shape already handled by `MessagesPage`.
3. Add test coverage if feasible; if the current test setup makes UI navigation tests impractical, add at least a focused regression note in code comments or test scaffolding where appropriate.

Constraints:
- Do not change conversation creation semantics.
- Do not redesign the messages screen.

Acceptance:
- tapping "Message Seller" lands on the intended thread, not just the inbox list
- newly created and pre-existing conversations both work
```

### P1. Make the Buy Flow Settle Cleanly on Cancel as Well as Error

**Why this matters**

`ItemDetail` sets `buyingLoading = true` before opening the purchase confirmation alert. If the user taps `Cancel`, there is no callback that clears the loading state.

**Evidence**

- `MavMarketApp/components/ItemDetail.tsx:91` calls `setBuyingLoading(true)`
- `MavMarketApp/lib/payments.ts:87-101` handles success and error callbacks, but the `Cancel` button has no state-reset callback

**User impact**

- the buy button can remain disabled or appear stuck after a canceled purchase attempt
- repeated attempts may require reopening the screen

**Potential fix directions**

- Add an explicit cancel callback to `buyNow`
- Or move loading-state ownership so it starts only after the user confirms
- Or return a structured result (`cancelled`, `opened`, `failed`) and update the UI from the caller

**How to test the fix**

- Confirm cancel leaves the button enabled and non-loading
- Confirm checkout failure also restores UI state
- Confirm success still clears the temporary loading state after the checkout page opens

**AI agent prompt**

```text
Fix the stuck-loading payment bug across `MavMarketApp/components/ItemDetail.tsx` and `MavMarketApp/lib/payments.ts`.

Problem:
- `ItemDetail` starts a loading state before showing the confirmation alert
- `buyNow(...)` only reports success or failure
- if the user taps `Cancel`, the caller never gets a signal to clear loading

Your task:
1. Make the buy flow settle local UI state on all three outcomes:
   - user cancelled
   - checkout open succeeded
   - checkout setup/open failed
2. Keep the API small and readable.
3. Add tests or at minimum isolate the flow so outcome handling is testable.

Constraints:
- Do not redesign checkout itself.
- Do not silently swallow actual payment errors.

Acceptance:
- canceling purchase does not leave the button spinning/disabled
- errors still surface clearly
- success path still opens checkout normally
```

### P1. Do Not Claim Password Reset Succeeded When the API Call Failed

**Why this matters**

The forgot-password handler does not check the result of `resetPasswordForEmail`. It always shows success text even if the request failed.

**Evidence**

- `MavMarketApp/components/LoginPage.tsx:77` awaits `supabase.auth.resetPasswordForEmail(email)`
- `MavMarketApp/components/LoginPage.tsx:78` immediately sets success text without inspecting any returned error

**User impact**

- users can be told a reset email was sent when nothing actually happened
- support/debugging becomes harder because the UI reports success on backend failure

**Potential fix directions**

- Capture the returned `{ error }` and surface a user-friendly failure message
- Preserve the current success message only for real success
- Consider reusing the same error normalization strategy already used in `handleSubmit`

**How to test the fix**

- success case shows the current green success message
- failure case shows an error and does not show success
- validation still blocks empty or non-UTA emails before the API call

**AI agent prompt**

```text
Fix the false-success password-reset flow in `MavMarketApp/components/LoginPage.tsx`.

Problem:
- `resetPasswordForEmail(...)` is awaited
- its error result is ignored
- the UI always says "Password reset email sent!" even on failure

Your task:
1. Read the returned Supabase result and handle failure explicitly.
2. Keep the current validation rules for empty and non-UTA emails.
3. Add test coverage around success and failure messaging if the auth screen test setup allows it.

Constraints:
- Do not weaken email validation.
- Do not rewrite the whole auth screen.

Acceptance:
- success message appears only on real success
- failures display a clear error instead
```

### P1. Make `sendMessage` Safe Against Partial Success

**Why this matters**

The message flow performs several writes in sequence: rate-limit check, message insert, rate-limit log insert, and conversation summary update. If a later step fails, the earlier write may already be committed.

**Evidence**

- `MavMarketApp/lib/messages.ts:120` performs the rate-limit RPC
- `MavMarketApp/lib/messages.ts:129-137` performs multiple writes in separate client calls
- `MavMarketApp/__tests__/lib/messages.test.ts:163-169` already documents a known non-transactional gap when the conversation update fails after the message insert succeeds

**User impact**

- the UI can report send failure even though the message was persisted
- conversation previews can go stale while the underlying message exists
- a failed rate-limit-log write can also produce a misleading send failure after the message insert already succeeded

**Potential fix directions**

- Prefer one server-side transaction boundary via RPC or an Edge Function
- If that is not feasible in this pass, add explicit compensation/documented tradeoffs and tests for partial-failure behavior
- At minimum, decide which failure should be authoritative from the user's perspective

**How to test the fix**

- success path still sends and updates the conversation preview
- rate-limited path still throws the friendly throttle error
- partial downstream failure is either prevented transactionally or handled/documented explicitly

**AI agent prompt**

```text
Harden the message-send workflow in `MavMarketApp/lib/messages.ts`.

Problem:
- the function performs multiple writes in sequence
- a later failure can occur after the message row already exists
- tests already document at least one known partial-write gap

Your task:
1. Make the flow resilient against partial success.
2. Prefer a transactional server-side boundary if the schema/functions in this repo support it.
3. If a full transaction is not practical here, implement the smallest honest improvement and encode the remaining tradeoff in tests.

Important:
- account for the `rate_limit_log` insert as well as the conversation update
- do not remove rate limiting
- do not hide failures behind empty catches

Acceptance:
- the user-facing result is coherent
- tests cover downstream failure after an earlier write
- your final summary clearly states whether the fix is truly atomic or only improved
```

### P1. Make `createReport` Safe Against Partial Success

**Why this matters**

The report flow has the same structural problem as messaging: it performs a rate-limit check, writes to `rate_limit_log`, and then inserts the report as separate steps.

**Evidence**

- `MavMarketApp/lib/reports.ts:27` performs the rate-limit RPC
- `MavMarketApp/lib/reports.ts:35-37` performs separate `rate_limit_log` and `reports` writes

**User impact**

- the app can consume rate-limit budget without creating the report
- retry behavior becomes unpredictable after partial failure

**Potential fix directions**

- Move the whole report-creation workflow behind one server-side transactional entrypoint
- Or add safer ordering / compensation if full atomicity is not available in this repo
- Update tests to model partial-failure scenarios explicitly

**How to test the fix**

- success path still creates the report
- rate-limited path still throws the current friendly message
- downstream failure after the first write is covered by tests and handled intentionally

**AI agent prompt**

```text
Harden the report-creation workflow in `MavMarketApp/lib/reports.ts`.

Problem:
- report creation is multi-step and non-atomic
- a failure after the rate-limit log write can leave the system in an inconsistent state

Your task:
1. Refactor the workflow so it is transactionally safe, or as close as this repo can realistically support.
2. Preserve the current public function shape if possible.
3. Add regression tests for:
   - rate-limited request
   - successful report creation
   - downstream failure after an earlier write

Constraints:
- do not remove rate limiting
- do not paper over partial failures with generic success messages

Acceptance:
- the write sequence is clearly safer than today
- test coverage explains the intended behavior under failure
```

### P2. Hide Inactive Listings on Public Profiles

**Why this matters**

`getSellerListings(...)` currently filters only by `seller_id`, and the same function is used for the current user profile and for public profile viewing. That means non-public listing states can leak into another user's profile view.

**Evidence**

- `MavMarketApp/lib/profile.ts:69-78` queries `listings` by `seller_id` with no status filter
- `MavMarketApp/components/ProfilePage.tsx:105` uses `getSellerListings(sellerUserId)` for friend/public profile display

**User impact**

- removed, draft, reserved, or otherwise inactive items may appear on another user's public profile
- moderation/state transitions can be undermined by profile views showing content that should no longer be public

**Potential fix directions**

- Add a parameter like `includeInactive = false`
- Use public-only filtering for viewed profiles and broader filtering only for the owner
- Decide explicitly whether sold listings should remain visible and encode that decision in tests

**How to test the fix**

- owner profile still behaves as intended
- public profile excludes disallowed statuses
- edge case: sold listings follow the chosen product rule consistently

**AI agent prompt**

```text
Fix the profile-listing visibility bug in `MavMarketApp/lib/profile.ts` and the public-profile load path in `MavMarketApp/components/ProfilePage.tsx`.

Problem:
- `getSellerListings(...)` is reused for both owner and public views
- it does not filter by listing status
- public profiles can therefore expose inactive content

Your task:
1. Separate owner-view behavior from public-view behavior in the smallest clean way.
2. Prevent non-public listing states from showing on another user's profile.
3. Add tests that pin the chosen visibility rules.

Constraints:
- do not guess silently about status policy; if the product rule for `sold` is ambiguous, document the chosen default in your summary and keep the code easy to adjust.
- do not rewrite the whole profile screen.

Acceptance:
- viewing another user's profile only shows statuses meant to be public
- owner behavior remains intentional and explicit
```

## Suggested Execution Order

1. Restore the Jest mock and rate-limit test coverage
2. Fix the home-feed empty-result bug
3. Fix the listing-to-chat routing bug
4. Fix the buy-flow cancel/loading bug
5. Fix forgot-password false success
6. Harden messaging/report writes
7. Lock down public-profile listing visibility

## Verification Checklist

After each fix, verify the local result instead of trusting the patch blindly:

- `cmd /c npm run test -- --runInBand`
- manual smoke pass of login, home, listing detail, messaging, reporting, and profile flows
- for any backend-integrated write flow, test both success and failure paths
