# Gatherly

Your all-in-one event planner for local events in Timișoara: discover what's on,
RSVP, keep favorites and organize your own events.

## Repository layout

```
backend/    .NET 10 Web API (EF Core + PostgreSQL, Identity + JWT)
frontend/   React 19 + Vite + TypeScript single-page app (Material UI)
README.md
```

The two apps run separately: the frontend talks to the API over HTTP.

## Quick start

You need the **.NET 10 SDK**, **PostgreSQL** and **Node.js 22+**.

```bash
# 1. Backend: http://localhost:5115 (creates the database, migrates and seeds demo data)
cd backend
dotnet run --project src/Gatherly.API

# 2. Frontend: http://localhost:3000 (in a second terminal)
cd frontend
npm install
npm run dev
```

Sign in with the seeded demo organizer: `organizer@gatherly.dev` / `Gatherly123`.

---

## Frontend

React 19, Vite, TypeScript, Material UI, React Router, TanStack Query,
Leaflet/OpenStreetMap, Lenis (smooth scrolling). Tests with Vitest + React Testing Library.

### Structure

```
frontend/
  src/
    api/          HTTP client (auth header, error normalisation), endpoints, DTO types
    auth/         AuthProvider (JWT in localStorage, auto sign-out), RequireAuth route guard
    components/   Layout (navbar, footer), Hero, EventCard, EventGrid, EventMap,
                  GuestGate, FormLayout, HelpDialog, Reveal, SmoothScroll, ...
    pages/        EventsPage (home), EventDetailPage, EventFormPage, AuthPages,
                  MePage (My events / Attending / Favorites), ProfilePage, NotFoundPage
    i18n/         English + Romanian strings, provider and t() helper
    lib/          Pure helpers: formatting, date ranges, .ics export, client-side
                  filters/sorting, form validation, images, smooth scroll
    theme/        MUI theme and design tokens
    notify/       Snackbar notifications
    assets/photos Bundled stock photos (see CREDITS.md)
    test/         Test setup and render helpers
  *.test.ts(x)    Unit and component tests live next to the code they cover
```

### Scripts

```bash
npm run dev     # dev server on http://localhost:3000 (fixed port, matches backend CORS)
npm run build   # typecheck + production build into dist/
npm run lint    # oxlint
npm test        # Vitest (unit + component tests)
```

### Configuration

Copy `frontend/.env.example` to `frontend/.env.local` to override:

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:5115` | Base URL of the backend API |
| `VITE_SUPPORT_EMAIL` | `support@gatherly.dev` | Contact address in the Help dialog and footer |

### Features

- **Home:** search as you type, categories, Today / This weekend / This week,
  date range, radius filter (with "use my location"), sort by date / price / popularity,
  free only, pagination.
- **Event details:** RSVP (Going / Interested / No, capacity aware), favorites, map,
  directions, add to Google Calendar or download `.ics`, share, ticket link for
  Ticketmaster events.
- **Organizers:** create, edit and delete events, with a map pin for the location.
- **Account:** My events (upcoming / past), Attending, Favorites, profile, sign in / sign up.
- **Visitors** (signed out) can browse the first 4 events and read event details;
  everything else asks them to sign in.
- **UI:** English by default with a one-click switch to Romanian, help & contact dialog,
  smooth scrolling with reveal animations, responsive down to phone width.

### Design

Dark theme with a pink→peach accent, Michroma for headings and Poppins for body text;
tokens live in `src/theme/theme.ts`. Photos get a purple duotone + scanline treatment
(`DuotonePhoto`). Events without an image use a category photo; all photos are bundled in
`src/assets/photos` (Unsplash License, see `CREDITS.md`), so the UI works offline.
The map uses OpenStreetMap tiles inverted for night mode and still needs internet.

### Notes

- Strings live in `src/i18n/messages.ts`; TypeScript and a test make sure both
  languages have exactly the same keys.
- The API has no price filter or price/popularity sort, so "Free only" and those sorts
  fetch up to 100 matching events and filter/sort them in the browser.
- A local event with no price is treated as free (as in the seed data); for imported
  Ticketmaster events an empty price means "unknown".
- The visitor limit is a UX choice in the frontend only; `GET /api/events` is still public.

---

## Backend

.NET 10 Web API, EF Core (code-first) + PostgreSQL, ASP.NET Identity + JWT.
Run all commands below from `backend/`.

### Structure

```
backend/
  Gatherly.slnx
  src/
    Gatherly.API             Controllers, middleware, Program.cs
    Gatherly.Application     DTOs, validators, interfaces
    Gatherly.Domain          Entities, enums (no dependencies)
    Gatherly.Infrastructure  ApplicationDbContext, Identity, EF migrations,
                             JWT token service, Ticketmaster sync, seeder
  tests/
    Gatherly.UnitTests       Validators + Ticketmaster mapping
    Gatherly.IntegrationTests
```

### API overview

| Area | Endpoints |
| --- | --- |
| Auth | `POST /api/auth/register`, `POST /api/auth/login` |
| Users | `GET/PUT /api/users/me` |
| Events | `GET /api/events` (filters: `category`, `from`, `to`, `search`, `latitude`/`longitude`/`radiusKm`, pagination), `GET /api/events/{id}`, `POST/PUT/DELETE /api/events`, `GET /api/events/mine` |
| RSVP | `POST/DELETE /api/events/{id}/rsvp` (`Interested`/`Going`/`NotGoing`, capacity enforced), `GET /api/events/attending` |
| Favorites | `POST/DELETE /api/events/{id}/favorite`, `GET /api/events/favorites` |
| Integrations | `POST /api/integrations/ticketmaster/sync` — imports Timișoara events from the Ticketmaster Discovery API |

### Local setup

PostgreSQL must be running on `localhost:5432`. The dev connection string in
`src/Gatherly.API/appsettings.json` uses user `postgres` / password `postgres` and
database `gatherly_dev`.

**Windows:** install PostgreSQL with the official installer
(https://www.postgresql.org/download/windows/). If you chose a different password for
`postgres`, store your own connection string as a user secret instead of editing the file:

```bash
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=gatherly_dev;Username=postgres;Password=<your password>" --project src/Gatherly.API
```

**macOS:**

```bash
brew install postgresql@17
brew services start postgresql@17
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"
createuser -s postgres
createdb -U postgres gatherly_dev
```

Then:

```bash
# Apply migrations manually (optional: Development does this on startup)
dotnet ef database update -p src/Gatherly.Infrastructure -s src/Gatherly.API

# Run on http://localhost:5115
dotnet run --project src/Gatherly.API
```

In Development the app auto-migrates and seeds a demo organizer
(`organizer@gatherly.dev` / `Gatherly123`) plus 12 sample Timișoara events.

### API docs

- Swagger UI: `http://localhost:5115/swagger` (dev only, Bearer auth supported)
- Scalar: `http://localhost:5115/scalar/v1`

### Config

`src/Gatherly.API/appsettings.json` holds the dev connection string, JWT settings and
the allowed CORS origin (`http://localhost:3000`, the frontend dev server).
Override secrets via user-secrets:

```bash
dotnet user-secrets set "Jwt:Key" "<strong-key>" --project src/Gatherly.API
dotnet user-secrets set "Ticketmaster:ApiKey" "<key>" --project src/Gatherly.API
```

Get a free Ticketmaster API key at https://developer.ticketmaster.com.

### Tests

```bash
dotnet test
```
