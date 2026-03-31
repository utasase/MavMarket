# Release Checklist

## Environments

| Environment | Purpose | Supabase Project |
|-------------|---------|-----------------|
| `development` | Local dev | Use `.env.local` with dev project keys |
| `preview` | Internal distribution / investor demo | Separate Supabase project (run all migrations) |
| `production` | Future public release | Separate Supabase project |

EAS profiles are defined in `MavMarketApp/eas.json`.

## Pre-Build Checklist

- [ ] All pending migrations run in the target Supabase project (run in order 20240001–20240007)
- [ ] `listings` bucket exists in Supabase Storage (public, with authenticated insert policy)
- [ ] `.env.local` contains correct `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` for the target environment
- [ ] Credentials are NOT committed to the repo
- [ ] `eas.json` environment `APP_ENV` matches the target (development / preview / production)
- [ ] EAS project is linked (`npx eas project:info` shows the correct project)

## Setting Environment Secrets in EAS

```bash
cd MavMarketApp

# Add Supabase credentials for the preview environment
npx eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "<url>" --env preview
npx eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<key>" --env preview
```

## iOS Build (configured)

```bash
cd MavMarketApp
npx eas build --profile preview --platform ios
```

Distribution: internal (TestFlight or direct install via expo.dev)

## Android Build

```bash
cd MavMarketApp

# First time only — generates a keystore and links the Android project
npx eas build:configure --platform android

# Then build
npx eas build --profile preview --platform android
```

## OTA Update (JS-only changes, no native rebuild)

```bash
cd MavMarketApp
npx eas update --branch preview --message "Description of change"
```

## Promoting to Production

1. Create a new EAS build with `--profile production`
2. Point `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` to the production Supabase project
3. Submit via `npx eas submit` or manually upload to App Store Connect / Google Play Console

## Pre-Demo Smoke Test

- [ ] Sign up with a `@mavs.uta.edu` address — succeeds
- [ ] Sign up with a `@gmail.com` address — blocked at client
- [ ] Create a listing with an image — appears in Home feed
- [ ] Swipe/discover flow loads listings
- [ ] Tap "Message Seller" on a listing — conversation starts
- [ ] Send a message — appears in real time on the other account
- [ ] Leave a review — shows on seller profile
- [ ] Report a listing — report appears in admin queue
- [ ] Admin account: open Profile → red shield icon visible → moderation queue shows report
- [ ] Mark a listing as sold — disappears from feed

## Known Deferred Items (not blockers)

| Item | Status |
|------|--------|
| Rate limiting (report spam, message spam) | Deferred — DB trigger not yet implemented |
| UTA email enforcement at DB/RLS level | Deferred — client-side only |
| Storage bucket RLS (path-scoped uploads) | Deferred — bucket is public |
| Push notification delivery | Deferred — prefs exist, no Expo push token |
| Follow/followers social graph | Deferred — hardcoded to 0 |
| Android EAS credentials | Needs `npx eas build:configure --platform android` |
| Production Supabase project | Needs to be created and migrated |
