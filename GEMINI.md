# GEMINI.md - MavMarket Project Overview

Welcome to the MavMarket project! This file provides essential context for developing, testing, and maintaining the MavMarket ecosystem.

## Project Overview

**MavMarket** is a university-focused marketplace (specifically for UTA students) that allows students to buy and sell items within their community. It consists of three primary components:

1.  **Mobile App (`MavMarketApp/`)**: A cross-platform mobile application built with **React Native (Expo)**, **Expo Router**, and **Supabase**. It handles the core user experience: browsing, messaging, and purchasing.
2.  **Admin Console (`ops-admin/`)**: A web-based dashboard for moderation and platform management. Built with **Next.js 16**, **React 19**, and **Tailwind CSS 4**.
3.  **Backend (`supabase/`)**: A **Supabase** backend providing Postgres database, Authentication, Storage (for item images), and Edge Functions (for Stripe payments).

## Core Architecture

### Mobile App (`MavMarketApp/`)

*   **Routing**: Uses **Expo Router** (see `app/` directory).
    *   `app/_layout.tsx`: Root layout with authentication gating.
    *   `app/(tabs)/`: Tab-based navigation (Home, Swipe, Create, Messages, Profile).
*   **UI Components**: Actual UI logic resides in `components/`. Screen transitions often use `Animated.View` overlays rather than router pushes for a native feel.
*   **Data Layer**: Business logic and Supabase interactions are centralized in `lib/`.
*   **Mock Data**: The app includes a robust mock data fallback (`data/mockData.ts`) to remain functional for UI development even without a live Supabase connection.

### Admin Console (`ops-admin/`)

*   **Framework**: Next.js App Router with React Server Components.
*   **Styling**: **Tailwind CSS 4** and **shadcn/ui** components.
*   **Auth**: Supabase SSR for server-side session management.

### Backend & Database

*   **Database**: Postgres with Row Level Security (RLS) enabled on all tables.
*   **Payments**: Integrated with **Stripe Checkout** via Supabase Edge Functions.
*   **Security**: Email domain enforcement (UTA emails only) is implemented both client-side and at the database level.

## Key Commands

### Mobile App (`MavMarketApp/`)

```bash
cd MavMarketApp
npm install          # Install dependencies
npm run start        # Start Expo dev server
npm run android      # Run on Android emulator/device
npm run ios          # Run on iOS simulator/device
npm test             # Run Jest tests
npm run test:coverage # Run tests with coverage report
```

### Admin Console (`ops-admin/`)

```bash
cd ops-admin
npm install          # Install dependencies
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm run lint         # Run ESLint
```

## Development Conventions

*   **Testing**:
    *   Tests for the mobile app's data layer live in `MavMarketApp/__tests__/lib/`.
    *   Aim for high coverage: **85% Statements**, **80% Branches**, **90% Functions**.
    *   Use the shared Supabase mock in `__tests__/helpers/supabaseMock.ts`.
*   **Styling**:
    *   Mobile: Standard React Native `StyleSheet`. Brand color is **UTA Blue (#0064B1)**.
    *   Web/Admin: Tailwind CSS utility classes.
*   **State Management**:
    *   Authentication is managed via `AuthProvider` in `lib/auth-context.tsx`.
    *   Theme is managed via `ThemeContext` in `lib/ThemeContext.tsx`.
*   **Security**: Never commit real Supabase keys or Stripe secrets. Use `.env.local` for local development.

## Project Layout

```text
RigProject/
├── MavMarketApp/       # React Native / Expo Mobile App
│   ├── app/            # Expo Router entry points
│   ├── components/     # UI Components
│   ├── lib/            # Data layer and utilities
│   ├── supabase/       # Migrations and local DB config
│   └── __tests__/      # Jest test suites
├── ops-admin/          # Next.js Admin Dashboard
│   ├── app/            # Next.js App Router
│   ├── components/     # shadcn/ui and custom components
│   └── lib/            # Admin utilities and Supabase client
└── supabase/           # Shared backend resources
    └── functions/      # Edge Functions (Stripe Webhooks, etc.)
```

## Reference Documentation

*   `CLAUDE.md`: Specific instructions for Claude Code interactions.
*   `Plan.md`: Implementation backlog and bug review notes.
*   `README.md`: High-level quickstart for the entire repository.
