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

You need the **.NET 10 SDK**, **Node.js 22+**, and **PostgreSQL** (easiest: Docker Desktop).

```bash
# 0. Once: PostgreSQL + Mailpit (a local inbox that catches every email the app sends)
docker run -d --name gatherly-db   -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:17
docker run -d --name gatherly-mail -p 8025:8025 -p 1025:1025 axllent/mailpit
#    Next time (e.g. after a reboot): docker start gatherly-db gatherly-mail

# 1. Backend: http://localhost:5115 (creates the database, migrates and seeds demo data)
cd backend
dotnet run --project src/Gatherly.API

# 2. Frontend: http://localhost:3000 (in a second terminal)
cd frontend
npm install
npm run dev
```

| What | URL |
| --- | --- |
| Website | http://localhost:3000 |
| API docs (Swagger) | http://localhost:5115/swagger |
| Emails sent by the app (Mailpit) | http://localhost:8025 |

Sign in with the seeded demo organizer: `organizer@gatherly.dev` / `Gatherly123`.
Eight demo attendees use the same password: `ana.popescu@gatherly.dev`, `andrei.ionescu@gatherly.dev`,
`maria.dumitrescu@gatherly.dev`, `mihai.stan@gatherly.dev`, `elena.georgescu@gatherly.dev`,
`radu.marin@gatherly.dev`, `cristina.barbu@gatherly.dev`, `vlad.munteanu@gatherly.dev`.

### Try the main features

1. **Waitlist:** open *Banat Wine Tasting* (4/4, full) and press *Join waitlist*: you're #2 in line.
   Cancel a "Going" RSVP elsewhere and the first person waiting gets the spot plus an email.
2. **Attendees:** as the organizer, open any of your events: the *Attendees* card lists who's going,
   waiting and interested.
3. **Reviews:** as the organizer, go to *My events → Past* and open *JS Conference Timisoara*.
4. **Map:** on the home page switch from grid to *Map*; pins are coloured by category and follow the filters.
5. **For you:** RSVP to or favorite a few events; the *For you* row on the home page adapts.
6. **Emails:** RSVP "Going" and open http://localhost:8025 to see the confirmation; reminders arrive
   24 h before an event starts.

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
                  EventsMap (all events), ForYou, AttendeesCard, ReviewsSection,
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
  free only, pagination. Grid or **map view** (all matching events as category-coloured pins).
- **For you:** signed-in users get recommendations based on the categories of their RSVPs,
  favorites and reviews (popular events when there's no history yet).
- **Event details:** RSVP (Going / Interested / No), favorites, map,
  directions, add to Google Calendar or download `.ics`, share, ticket link for
  Ticketmaster events.
- **Waitlist:** "Going" on a full event joins the waitlist and shows your place in line;
  when a spot opens the first person is promoted automatically and emailed.
- **Reviews:** after an event ends, people who went can leave 1-5 stars and a comment;
  the average rating shows on the event.
- **Organizers:** create, edit and delete events, with a map pin for the location,
  and see the attendee list (going / waitlist / interested) of their events.
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
                             JWT token service, Ticketmaster sync, seeders,
                             Notifications/ (SMTP email sender, waitlist promotion,
                             RSVP emails, reminder background service)
  tests/
    Gatherly.UnitTests       Validators, Ticketmaster mapping, recommendation scoring,
                             email date formatting
    Gatherly.IntegrationTests
```

### API overview

| Area | Endpoints |
| --- | --- |
| Auth | `POST /api/auth/register`, `POST /api/auth/login` |
| Users | `GET/PUT /api/users/me` |
| Events | `GET /api/events` (filters: `category`, `from`, `to`, `search`, `latitude`/`longitude`/`radiusKm`, pagination), `GET /api/events/{id}`, `POST/PUT/DELETE /api/events`, `GET /api/events/mine`, `GET /api/events/recommended` |
| RSVP | `POST/DELETE /api/events/{id}/rsvp` (`Interested`/`Going`/`NotGoing`; `Going` on a full event returns `Waitlisted`), `GET /api/events/attending`, `GET /api/events/{id}/attendees` (organizer only) |
| Reviews | `GET /api/events/{id}/reviews`, `PUT/DELETE /api/events/{id}/reviews` (own review; only attendees, after the event ended) |
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
(`organizer@gatherly.dev` / `Gatherly123`), 52 Timișoara events (47 upcoming, 5 already over),
8 demo attendees with RSVPs, and reviews on the past events. Seeding only adds events whose
title doesn't exist yet, so restarting never duplicates or overwrites anything. Event dates are
relative to the day they were seeded; to start fresh, drop the database
(`dotnet ef database drop -p src/Gatherly.Infrastructure -s src/Gatherly.API`) and run again.

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

### Emails

The app sends emails when you RSVP (confirmation or waitlist place), when you're promoted from
the waitlist, and as a reminder before an event (`EventReminderService`, a background service).

- **Local (default):** the `Email` section in `appsettings.json` points at Mailpit
  (`localhost:1025`); open http://localhost:8025 to read them. Leave `Email:Host` empty to only
  log emails instead.
- **Real emails (e.g. Gmail):** create an [app password](https://myaccount.google.com/apppasswords)
  (needs 2-step verification), then:

  ```bash
  dotnet user-secrets set "Email:Host" "smtp.gmail.com" --project src/Gatherly.API
  dotnet user-secrets set "Email:Port" "587" --project src/Gatherly.API
  dotnet user-secrets set "Email:EnableSsl" "true" --project src/Gatherly.API
  dotnet user-secrets set "Email:UserName" "you@gmail.com" --project src/Gatherly.API
  dotnet user-secrets set "Email:FromAddress" "you@gmail.com" --project src/Gatherly.API
  dotnet user-secrets set "Email:Password" "<app password>" --project src/Gatherly.API
  ```

The reminder job is configured in the `Reminders` section: `LeadHours` (default 24) and
`IntervalMinutes` (5; 1 in `appsettings.Development.json` so it's quick to try). Each person gets
one reminder per event, and a fresh one if the event is rescheduled.

### Tests

```bash
dotnet test
```
