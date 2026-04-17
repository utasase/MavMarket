# MavMarket Project Context

MavMarket is a university-focused marketplace for UTA students to buy and sell within their campus community. The project consists of a mobile application and a Supabase backend with integrated Stripe payments.

## Project Overview

- **Purpose**: A campus marketplace for students.
- **Frontend**: Built with **Expo SDK 55**, **React Native 0.83**, **React 19**, and **Expo Router**.
- **Backend**: Powered by **Supabase** (Auth, Database, Realtime, Storage, and Edge Functions).
- **Payments**: Integrated with **Stripe** via Supabase Edge Functions.
- **Architecture**:
  - `MavMarketApp/`: Main Expo mobile application.
  - `MavMarketApp/app/`: Expo Router route tree and layout gates.
  - `MavMarketApp/components/`: UI components, screens, and overlays.
  - `MavMarketApp/lib/`: Data access layer, auth, messaging, and business logic.
  - `MavMarketApp/supabase/migrations/`: SQL migrations defining the database schema.
  - `supabase/functions/`: Stripe-related Supabase Edge Functions (Checkout and Webhooks).

## Core Technologies & Libraries

- **State & Context**: Custom `AuthProvider` and `ThemeProvider`.
- **Navigation**: File-based routing with `expo-router`.
- **Icons**: `lucide-react-native`.
- **Database Client**: `@supabase/supabase-js`.
- **Styling**: Standard React Native `StyleSheet` with a dynamic theme provided by `ThemeContext`.
- **Testing**: **Jest** with `jest-expo`.

## Development Conventions

### Coding Style
- **Functional Components**: Use functional components with Hooks (`useState`, `useEffect`, `useRef`).
- **Theming**: Always use the `useTheme` hook to access colors and styles. Avoid hardcoding colors unless they are specific brand constants.
- **Icons**: Use `Lucide` icons from `lucide-react-native`.
- **Safe Area**: Use `useSafeAreaInsets` for proper padding on different devices.

### Data Access
- Logic for interacting with Supabase lives in `MavMarketApp/lib/`.
- UI components should call these library functions instead of interacting with Supabase directly.
- **Mock Data**: The app is designed to fall back to mock data (`data/mockData.ts`) if Supabase environment variables are missing. Ensure new features maintain this graceful fallback.

### Database
- New schema changes must be added as new SQL files in `MavMarketApp/supabase/migrations/`.
- Row Level Security (RLS) is strictly enforced. Always verify policies when adding new tables or columns.

## Key Commands

All commands should be run from the `MavMarketApp/` directory unless specified.

- **Start Development**: `npm run start`
- **Run Android**: `npm run android`
- **Run iOS**: `npm run ios`
- **Run Web**: `npm run web`
- **Run Tests**: `npm test`
- **Run Coverage**: `npm run test:coverage`
- **Smoke Test**: `npm run smoke:hosted` (Requires hosted Supabase environment variables)

## Environment Variables

The project expects the following variables (typically in `MavMarketApp/.env.local` or shell environment):

- `EXPO_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key.
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for admin tasks/smoke tests.
- `STRIPE_SECRET_KEY`: For Stripe Edge Functions.
- `STRIPE_WEBHOOK_SECRET`: For Stripe Webhook handling.

## Testing Strategy

- **Unit/Component Tests**: Found in `MavMarketApp/__tests__/`. Focus on lib logic and major screen rendering.
- **Smoke Tests**: `scripts/smokeHostedSupabase.mjs` exercises core flows (auth, listing, messaging) against a live Supabase instance.
