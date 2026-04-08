---
name: MavMarket Backlog
description: Prioritized list of remaining tasks audited 2026-04-04 — pick up here next session
type: project
---

## Critical (Security / Data Risk)
1. **Notifications RLS missing** — no RLS policy on `notifications` table; add select/insert/update policies scoped to `user_id = auth.uid()`
2. **Non-UTA email bypass** — client-side only; fix with a Supabase Auth pre-signup hook (Edge Function) or DB trigger on `auth.users`
3. **Duplicate direct conversations** — `NULL listing_id` doesn't satisfy unique constraint; add a partial unique index: `CREATE UNIQUE INDEX ON conversations (buyer_id, seller_id) WHERE listing_id IS NULL`

## High (Broken Features)
4. **No notification creation** — `createNotification()` function doesn't exist; nothing fires when messages sent, reviews left, etc. Need to build this and call it from `sendMessage`, `createReview`, etc.
5. **Seller can't initiate messages** — `conversations_insert` RLS only allows `buyer_id = auth.uid()`; update policy to also allow seller to insert when `seller_id = auth.uid()`
6. **Saved items hidden** — only accessible in Settings panel; needs a dedicated tab or easily discoverable screen
7. **Admin panel incomplete** — can't view actual reported listing/user from moderation panel

## Medium (UX)
8. **Silent failures** — save/unsave, message send, upload errors show nothing to user; add alerts or toasts
9. **No loading skeletons** — HomePage and SwipePage appear frozen while fetching real data
10. **Mock data flash on load** — user sees "Test User" and fake listings briefly; fix initial state
11. **Notification preferences ignored** — toggles stored in DB but never checked when creating notifications
12. **Direct vs listing conversations look identical** — no visual distinction in messages list

## Low (Data / Maintenance)
13. **UTA coordinates hardcoded in 3 files** — consolidate into a single constants file
14. **`draft`, `reserved`, `removed` listing statuses unused** — no UI for them yet
15. **No review uniqueness constraint in DB** — add `UNIQUE(reviewer_id, seller_id, listing_id)` to reviews table
16. **No index on `is_admin`** — add `CREATE INDEX ON public.users (is_admin) WHERE is_admin = true`
17. **No message read receipts** — no "seen" indicators on individual messages

**Why:** Audited 2026-04-04 after completing all 9 original gap tasks. These are the next wave.
**How to apply:** Start from top (Critical) and work down. Ask user which to tackle each session.
