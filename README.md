# MavMarket

**MavMarket** is a university-focused marketplace (specifically for UTA students) that allows students to buy and sell items within their community.

The project consists of three primary components:

- **Mobile App (`MavMarketApp/`)**: A cross-platform mobile application built with **React Native (Expo)**, **Expo Router**, and **Supabase**. It handles the core user experience: browsing, messaging, and purchasing.
- **Admin Console (`ops-admin/`)**: A web-based dashboard for moderation and platform management. Built with **Next.js 16**, **React 19**, and **Tailwind CSS 4**.
- **Backend (`supabase/`)**: A **Supabase** backend providing Postgres database, Authentication, Storage, and Edge Functions (for Stripe payments).

## Quick Start

### Mobile App (`MavMarketApp`)

```bash
cd MavMarketApp
npm install
npm run start
```

### Admin Console (`ops-admin`)

```bash
cd ops-admin
npm install
npm run dev
```

## Project Layout

```text
RigProject/
├── MavMarketApp/       # React Native / Expo Mobile App
├── ops-admin/          # Next.js Admin Dashboard
└── supabase/           # Shared backend resources (Migrations, Functions)
```

## Documentation Index

- [`GEMINI.md`](GEMINI.md): Comprehensive project overview and architecture.
- [`MavMarketApp/README.md`](MavMarketApp/README.md): Mobile app specific details.
- [`ops-admin/README.md`](ops-admin/README.md): Admin console specific details.
