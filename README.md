# MavMarket

MavMarket is a university-focused marketplace for UTA students to buy and sell within their campus community. This repository contains the Expo mobile app, the Supabase schema and migrations that back it, and Stripe-related Supabase Edge Functions for checkout and payment webhooks.

## What Is In This Repo

- Mobile app built with Expo, React Native, and Expo Router
- Supabase-backed marketplace flows for auth, listings, messaging, notifications, reviews, saved items, follows, moderation, and payments
- Root-level Stripe Edge Functions for checkout-session creation and webhook processing
- Jest tests for core lib modules and major UI screens

## Core App Flows

- Browse listings from the home feed with search, category, price, and condition filters
- Open item details, message sellers, save listings, report content, and complete checkout
- Use the messages tab for listing conversations and notifications
- Manage your profile, listings, saved items, follows, and reviews
- Create listings from the center tab action

## Tech Stack

- Expo SDK 55
- React Native 0.83
- React 19
- Expo Router
- Supabase Auth, Database, Realtime, Storage, and Edge Functions
- Stripe Checkout and webhook handling
- Jest with `jest-expo`

## Repository Layout

```text
RigProject/
|- MavMarketApp/              # Expo mobile app
|  |- app/                    # Expo Router route tree
|  |- components/             # Screen components and UI overlays
|  |- lib/                    # Data access, auth, payments, messaging, moderation
|  |- __tests__/              # Jest coverage for components and lib modules
|  \- supabase/               # Local Supabase config and SQL migrations
\- supabase/
   \- functions/              # Stripe-related Supabase Edge Functions
```

## Quick Start

### Run the mobile app

```bash
cd MavMarketApp
npm install
npm run start
```

Optional platform targets:

```bash
npm run android
npm run ios
npm run web
```

### Supabase configuration behavior

The app reads:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

If those values are missing, the UI still runs against mock data. Network-backed lib calls fail gracefully, which makes it possible to work on the client without a live Supabase project.

## Environment Notes

Provide app env vars through Expo environment configuration, commonly in `MavMarketApp/.env.local`.

### MCP clients (optional)

The project-scoped `.codex/config.toml` is set up for the hosted Supabase and Stripe MCP servers and is only used when running an MCP-aware client against this repo.

It expects these auth env vars to already be available in the shell used to launch the MCP client:

- `SUPABASE_ACCESS_TOKEN`
- `STRIPE_API_KEY`

If you're forking this repo, either update the Supabase `project_ref` in `.codex/config.toml` to your own project or delete the file.

### Mobile app

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Hosted Supabase smoke test

Used by `npm run smoke:hosted`:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_SMOKE_EMAIL`
- `SUPABASE_SMOKE_PASSWORD`

Optional:

- `SUPABASE_SMOKE_NAME`
- `SUPABASE_SMOKE_ALLOW_SIGNUP`
- `SUPABASE_SMOKE_KEEP_USER`

### Root Edge Functions

The Stripe functions under `supabase/functions/` expect:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`

## Testing

From `MavMarketApp/`:

```bash
npm test
npm run test:coverage
npm run smoke:hosted
```

`smoke:hosted` exercises a hosted Supabase project end to end, including authenticated profile access, listing creation, conversations, transactional RPCs, notifications, reports, and listing reservation/release behavior.

## Backend Notes

- SQL migrations live in `MavMarketApp/supabase/migrations/`
- Local Supabase CLI config lives in `MavMarketApp/supabase/config.toml`
- Checkout-session creation lives in `supabase/functions/create-checkout-session/`
- Stripe webhook handling lives in `supabase/functions/stripe-webhook/`

## Additional Documentation

- [`MavMarketApp/README.md`](MavMarketApp/README.md) for mobile-app-specific details
