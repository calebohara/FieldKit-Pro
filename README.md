# FieldKit Pro

A mobile-first field engineering toolkit for building automation and controls professionals. Helps technicians and engineers spend less time searching manuals and more time getting work done.

## Tech Stack

- **Framework:** Next.js 14+ (App Router) with TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend/Auth/DB:** Supabase (Auth, Postgres, Row Level Security)
- **Hosting:** Vercel

## Setup

1. Clone the repo
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment variables:
   ```bash
   cp .env.local.example .env.local
   ```
4. Add your Supabase credentials to `.env.local`
5. Run the development server:
   ```bash
   npm run dev
   ```

## Features

- **PPCL Tools** — Command reference, common errors, code analyzer
- **PID Loop Tuning** — Calculate PID values for HVAC loops
- **ABB Drive Tools** — Fault codes, parameters, configurations
- **Yaskawa Drive Tools** — Fault codes, parameters, setup guides

## Current Version

v0.1.0 — Foundation (auth, layout, landing page, database schema)

## Roadmap

- v0.2.0: PPCL tools (command reference, error lookup, code analyzer)
- v0.3.0: PID loop tuning calculator
- v0.4.0: Drive tools (ABB + Yaskawa)
- v1.0.0: Free/paid tiers, PWA, polish, deploy
- v1.1.0: Stripe integration
- v1.2.0: Bookmarks/favorites
- v1.3.0: Offline mode
