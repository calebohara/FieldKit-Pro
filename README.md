# FieldKit Pro

**Your Field Engineering Toolkit. Always in Your Pocket.**

FieldKit Pro is a mobile-first web application built for building automation and controls engineers in the field. It provides fast, offline-capable reference tools, fault lookup tables, and tuning calculators — everything you need on a job site, without digging through binders or PDFs.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Auth & Database | Supabase (Auth + Postgres) |
| Hosting | Vercel |
| PWA | next-pwa |

---

## Features

- **PPCL Reference & Analyzer** - Full Alerton PPCL keyword reference with syntax analyzer for validating control programs
- **PID Loop Tuning Calculator** - Calculate P, I, and D gains with common tuning method presets
- **ABB Drive Tools** - Fault code lookup and parameter reference for ACS580 and ACS880 drives
- **Yaskawa Drive Tools** - Fault code lookup and parameter reference for GA500 and GA700 drives
- **Free / Pro Tier System** - Gated access to advanced features with a Pro subscription tier
- **PWA Support** - Installable as a Progressive Web App for near-native mobile experience
- **Dark Theme by Default** - Designed for low-light field environments and outdoor screen legibility

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- A Supabase account and project

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-org/fieldkit-pro.git
cd fieldkit-pro
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file in the project root with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Run the development server:

```bash
npm run dev
```

5. Apply Supabase migrations:

```bash
npx supabase db push
```

The app will be available at `http://localhost:3000`.

---

## Project Structure

```
src/
├── app/                  # Next.js App Router pages and layouts
│   ├── (auth)/           # Authentication routes (login, signup)
│   ├── dashboard/        # Protected dashboard and tool pages
│   └── api/              # API route handlers
├── components/           # Shared UI components
│   ├── SearchableTable/  # Core reusable data table with search and filter
│   ├── ui/               # Base design system components
│   └── tools/            # Tool-specific components (PID, drives, PPCL)
├── lib/
│   ├── data/             # Static reference data as TypeScript files
│   └── supabase/         # Supabase client, server, and middleware helpers
```

---

## Architecture Decisions

**Data stored in TypeScript files, not the database.** Reference data (drive fault codes, PPCL keywords, etc.) lives in `src/lib/data/` as typed TypeScript arrays. This approach eliminates database round-trips for read-only reference content, enables instant load times, and makes the tools functional even when the network is degraded. The database is reserved for user-specific data: profiles, saved bookmarks, and usage tracking.

**`SearchableTable` as the core reusable component.** All tabular reference tools are built on a single `SearchableTable` component that handles filtering, column visibility, and responsive layout. New data sets can be added by passing a typed data array and column config — no new component required.

**`next/dynamic` for code splitting.** Heavy tool components (PPCL analyzer, drive parameter tables) are loaded with `next/dynamic` and `ssr: false` to keep initial bundle size small and improve first-load performance on mobile networks.

**Dark theme by default.** The UI defaults to a dark color scheme to reduce eye strain in field environments, server rooms, and mechanical rooms where ambient lighting is often low or mixed.

**Mobile-first design.** All layouts are designed at 375px width first and scale up. Touch targets, spacing, and typography are optimized for gloved hands and small screens.

---

## Free vs Pro Tier

| Feature | Free | Pro |
|---|---|---|
| PPCL keyword reference | Full access | Full access |
| PPCL analyzer | Full access | Full access |
| Basic PID calculator | Full access | Full access |
| Drive fault lookups | 3 per day | Unlimited |
| Drive parameter reference | Limited | Full access |
| Advanced PID presets | - | Included |
| Priority support | - | Included |

**Tier assignment** is currently managed manually via the `role` field on the user profile in Supabase. To grant Pro access, update the user's role to `pro` directly in the Supabase dashboard.

Stripe payment integration is planned for v1.1 and will automate tier management on subscription purchase and cancellation.

---

## Deployment

The project is deployed on Vercel. The `vercel.json` file in the project root configures the framework preset and any necessary rewrites.

To deploy your own instance:

1. Push the repository to GitHub.
2. Import the project in the Vercel dashboard.
3. Add the `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables in the Vercel project settings.
4. Deploy.

Vercel will automatically build and deploy on every push to the `main` branch.

---

## Roadmap

| Version | Feature |
|---|---|
| v1.1 | Stripe integration for automated Pro tier billing |
| v1.2 | Bookmarks — save and organize fault codes and parameters |
| v1.3 | Full offline PWA support via service worker caching |
| v1.4 | Additional drive brands (Danfoss, Siemens, Delta) |
| v1.5 | Wiring diagrams and terminal reference sheets |
| v2.0 | AI assistant for fault diagnosis and parameter recommendations |

---

## License

MIT License. See [LICENSE](./LICENSE) for details.
