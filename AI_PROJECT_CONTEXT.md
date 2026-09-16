# UniPlay Project Context for AI Assistants

> Living repository guide for coding assistants. Verified against the workspace on 2026-09-14. Read this before changing code, then confirm behavior in the live files because this document can become stale.

## 1. Product and Architecture

UniPlay is a sports-terrain reservation platform for Universite ESPRIT. Students can browse sports and terrains, inspect available time slots, reserve a slot with other students, review upcoming bookings, and see reservation history. Administrators have a separate dashboard for users, sports, terrains, generated slots, reservations, cancellation, statistics, and CSV export.

The system is a decoupled client/server application:

- Backend: Django REST Framework API under `backend/`.
- Frontend: React 19 single-page application built with Vite under `frontend/`.
- Database: PostgreSQL configured in `backend/config/settings.py`.
- Media: Django-served files under `backend/media/` during development.
- Transport: JSON REST over HTTP; multipart form data is used for terrain image uploads.
- Authentication: JWT access/refresh tokens from Simple JWT, stored by the browser in `localStorage`.

The frontend normally runs on `http://localhost:5173`; Vite proxies `/api` to `http://127.0.0.1:8000`. The backend API is mounted under `/api/`.

## 2. Repository Reality and Scope

Application files are concentrated in these directories:

```text
backend/
  manage.py
  config/                 Django settings, root URLs, ASGI and WSGI
  apps/accounts/          custom user, registration, JWT, password reset
  apps/sports/            sports, terrains, public catalog and slots
  apps/reservations/      slots, reservations, participants and booking rules
  apps/admin_panel/       dedicated admin dashboard API
  common/                 currently empty placeholder modules
  media/                  development terrain images
frontend/
  src/                    React application
  public/images/          default sport images
  package.json            frontend scripts and dependencies
  vite.config.js          Vite server and API proxy
README.md                 older project description; some paths and versions are stale
AI_PROJECT_CONTEXT.md     this guide
```

Generated or disposable content exists locally but is not application source: `frontend/node_modules/`, Python virtual-environment directories (`Include/`, `Lib/`, `Scripts/`, `.venv/`), Python `__pycache__/`, and build output. Do not edit or document generated dependency files as project logic.

There is no tracked backend `requirements.txt` or environment template in the current tree, despite the older README mentioning both. The virtual environment exists locally, but dependency reproducibility is currently weak.

## 3. How to Run

### Backend

From `backend/`, with the project virtual environment activated and PostgreSQL running:

```powershell
python manage.py migrate
python manage.py runserver
```

The development server is expected at `http://127.0.0.1:8000/`.

Useful commands:

```powershell
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py test
```

The configured database is PostgreSQL database `UniPlay` on localhost port `5432`, using the credentials currently present in settings. The database must exist and be reachable before Django starts. The project uses the custom user model `accounts.User`.

### Frontend

From `frontend/`:

```powershell
npm install
npm run dev
npm run build
npm run lint
npm run preview
```

`VITE_API_URL` is read by Axios. In development it should resolve to the API prefix expected by the frontend, normally `/api` when relying on the Vite proxy. There is no committed `.env` file in the current tree.

### API documentation

Django exposes the OpenAPI schema at `/api/schema/` and Swagger UI at `/api/schema/swagger-ui/`.

## 4. Backend Configuration

[backend/config/settings.py](backend/config/settings.py) configures:

- Django 6-era settings with DRF, Simple JWT, token blacklist, CORS, and drf-spectacular.
- `AUTH_USER_MODEL = "accounts.User"`.
- PostgreSQL as the default database.
- UTC timezone and timezone-aware datetimes.
- JWT access lifetime of 60 minutes and refresh lifetime of 7 days.
- Rotating refresh tokens with blacklist-after-rotation enabled.
- CORS for local Vite origins on ports 5173.
- Gmail SMTP for password reset messages.
- Local media at `/media/` when `DEBUG` is true.
- Global DRF authentication using JWT and global default permission `IsAuthenticated`, unless a view overrides it.

[backend/config/urls.py](backend/config/urls.py) mounts:

- `/admin/` Django admin.
- `/api/auth/` account/auth URLs.
- `/api/users/validate-ids/` student-ID validation view.
- `/api/sports/` public and legacy sports URLs.
- `/api/reservations/` reservation URLs.
- `/api/admin/` dedicated admin-panel URLs.
- `/api/schema/` and Swagger UI.

## 5. Domain Model and Business Rules

### User

Defined in [backend/apps/accounts/models.py](backend/apps/accounts/models.py). Extends `AbstractUser`.

- `username`: unique student matricule used for login.
- `email`: unique.
- `first_name`, `last_name`, standard Django user fields.
- `is_active`: registration creates users inactive; admin approval is expected to activate them.
- `is_admin`: custom application admin flag. This is separate from Django `is_staff` and `is_superuser`.

### Sport

Defined in [backend/apps/sports/models.py](backend/apps/sports/models.py).

- Unique `name`.
- Optional `description`.
- Optional image `icon`, uploaded under `sports/icons/`.
- `is_active` controls public visibility.
- Has many terrains through the `terrains` reverse relation.

### Terrain

Belongs to a sport and has:

- `name`.
- Positive integer `capacity`.
- Positive integer `slot_duration` in minutes, default 60.
- Optional image `photo`, uploaded under `terrains/`.
- `status`: `available`, `maintenance`, or `inactive`.
- `opening_hours`: JSON object. The dedicated admin slot generator currently expects a simple object with `start` and `end` values such as `{ "start": "08:00", "end": "22:00" }`.

Public list/detail behavior excludes inactive terrains in most places. Maintenance terrains are visible in the student sport page but cannot be booked in the UI.

### TimeSlot

Defined in [backend/apps/reservations/models.py](backend/apps/reservations/models.py).

- Belongs to a terrain.
- Has `date`, `start_time`, `end_time`, and `is_available`.
- Ordered by date and start time.
- Unique database constraint on `(terrain, date, start_time, end_time)`.
- The admin panel creates slots in bulk from terrain opening hours and slot duration, for the current month remainder or the next month.

### Reservation

- Belongs to a terrain and a timeslot.
- Has an organizer user, creation timestamp, and status.
- Status values in the model are `confirmed` and `cancelled`; new reservations default to confirmed.
- A conditional unique constraint permits only one confirmed reservation per timeslot. Cancelled historical rows may remain.
- `can_cancel` is true only for confirmed reservations whose start is at least 12 hours away.
- A user can see a reservation when they are the organizer or a participant.
- Only the organizer can cancel from the student reservation endpoint.

### Participant

- Connects a reservation to a student user.
- Stores a snapshot of first and last name plus `added_at`.
- The database prevents the same student appearing twice in one reservation.
- Reservation creation automatically adds the organizer as the first participant.
- Invited IDs are deduplicated; the organizer is removed if included in the submitted IDs.
- Total capacity is organizer plus invited participants, and cannot exceed terrain capacity.

## 6. Backend Application Ownership

### `apps.accounts`

- `models.py`: custom `User`.
- `serializers.py`: user output, registration, custom JWT payload, student-ID validation, password reset validation.
- `views.py`: registration, login/refresh/logout, current user, participant user list, admin user list/detail, password reset request/confirmation, ID validation.
- `permissions.py`: `IsAdmin` checks authenticated user plus `is_admin`.
- `urls.py`: `/auth/...` route definitions.
- `admin.py`: currently empty.
- `tests.py`: currently empty.

Registration sets `is_active=False`. Login is handled by Simple JWT and adds a `user` object to the token response containing identity and admin status. Password reset intentionally returns the same success response whether an email exists, but sends mail when a matching account is found.

### `apps.sports`

- `models.py`: `Sport` and `Terrain`.
- `serializers.py`: public sport, sport detail, terrain list, and terrain detail representations.
- `views.py`: public catalog, terrain-by-sport, available timeslots, and a legacy admin sports CRUD path.
- `urls.py`: public routes plus `/sports/admin/` and `/sports/admin/<id>/`.
- `admin.py`: Django admin registrations.
- `permissions.py` and `tests.py`: present but currently empty.

Public sport detail includes non-inactive terrains and active/maintenance counts. Timeslot lookup excludes slots that have a confirmed reservation and returns a simplified JSON shape.

### `apps.reservations`

- `models.py`: `TimeSlot`, `Reservation`, `Participant` and cancellation property.
- `serializers.py`: slot, participant, reservation list/detail, and booking-create serializers.
- `views.py`: authenticated list/create and retrieve/cancel behavior.
- `urls.py`: collection and integer-detail routes.
- `admin.py`: Django admin registrations.
- `permissions.py` and `tests.py`: present but currently empty.

The booking serializer is the main validation boundary. It verifies terrain/slot ownership, rejects past slots, rejects unavailable/already-confirmed slots, validates student IDs, removes duplicate/self IDs, enforces capacity, and catches a database race via `IntegrityError`.

### `apps.admin_panel`

- `permissions.py`: `IsAdminUser`, checking authenticated user and `is_admin`.
- `serializers.py`: admin sport/terrain all-field serializers and enriched reservation serializer.
- `views.py`: dashboard KPIs, sport CRUD, terrain CRUD/soft-delete, slot generation, reservation search/cancel/CSV export.
- `urls.py`: router-based `/api/admin/` endpoints.
- `models.py`, `admin.py`, and `tests.py`: empty or unused placeholders.

Admin terrain deletion is a soft delete: it changes status to `inactive`. Admin sport deletion deactivates the sport, inactivates its terrains, and cancels confirmed reservations for those terrains. Admin CSV export computes display status as Annule, Termine, or Confirme based on cancellation and slot end time.

## 7. API Contract

All paths below are relative to `/api`. JWT-protected calls use `Authorization: Bearer <access-token>`.

### Authentication and accounts

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/auth/register/` | Public | Create inactive student account. |
| POST | `/auth/login/` | Public | Obtain access/refresh tokens plus user object. |
| POST | `/auth/refresh/` | Public | Refresh access token. |
| POST | `/auth/logout/` | Authenticated | Blacklist submitted refresh token. |
| GET | `/auth/me/` | Authenticated | Current user details. |
| GET | `/auth/users/` | Authenticated | Active non-admin students for participant selection. |
| POST | `/auth/validate-students/` | Authenticated | Return valid and invalid matricules. |
| POST | `/auth/password-reset/` | Public | Request reset email. |
| POST | `/auth/password-reset-confirm/` | Public | Validate uid/token and set a new password. |
| GET | `/auth/admin/users/` | Intended admin | List users with inactive accounts first. |
| PATCH/DELETE | `/auth/admin/users/<id>/` | Intended admin | Approve/update or delete a user. |
| POST | `/users/validate-ids/` | Authenticated | Root-level duplicate of student-ID validation. |

### Public sports and booking

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/sports/` | Public | Active sports with terrain counts. |
| GET | `/sports/<id>/` | Public | Active sport with visible terrains. |
| GET | `/sports/terrains/` | Public | All non-inactive terrains. |
| GET | `/sports/terrains/<id>/` | Public | Terrain detail. |
| GET | `/sports/<sport_id>/terrains/` | Public | Available terrains for a sport. |
| GET | `/sports/terrains/<terrain_id>/timeslots/` | Public | Available unconfirmed slots; supports `start_date` and `days`. |
| GET | `/reservations/` | Authenticated | Reservations organized or joined by current user. |
| POST | `/reservations/` | Authenticated | Create confirmed reservation with terrain, timeslot, and participant IDs. |
| GET | `/reservations/<id>/` | Authenticated participant/organizer | Reservation detail. |
| DELETE | `/reservations/<id>/` | Authenticated organizer only | Cancel if at least 12 hours before start. |

### Dedicated admin panel

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/admin/dashboard/stats/` | `is_admin` | Student/reservation KPIs and cancellation rate. |
| CRUD | `/admin/sports/` and `/admin/sports/<id>/` | `is_admin` | Admin sport CRUD. |
| CRUD | `/admin/terrains/` and `/admin/terrains/<id>/` | `is_admin` | Terrain CRUD; delete means inactive. |
| POST | `/admin/terrains/<id>/generate_slots/` | `is_admin` | Generate current or next month slots with `{target: "current"|"next"}`. |
| GET | `/admin/reservations/` | `is_admin` | Global reservations; optional `search`. |
| POST | `/admin/reservations/<id>/cancel/` | `is_admin` | Cancel any reservation. |
| GET | `/admin/reservations/export_csv/` | `is_admin` | Download CSV export. |

## 8. Frontend Architecture

### Bootstrap and providers

[frontend/src/main.jsx](frontend/src/main.jsx) mounts the app inside `StrictMode`, `BrowserRouter`, `QueryClientProvider`, and `AuthProvider`. React Query retries queries once and does not refetch on window focus by default.

[frontend/src/App.jsx](frontend/src/App.jsx) declares all routes and two layout wrappers:

- `AppLayout`: `ProtectedRoute`, student `Navbar`, and page content.
- `AdminAppLayout`: `AdminRoute`, `AdminLayout`, and admin page content.

### Student routes

| Route | Component | Behavior |
|---|---|---|
| `/login` | `LoginPage` | Login and redirect admins to `/admin`, students to `/`. |
| `/register` | `RegisterPage` | Submit registration; account remains pending until approval. |
| `/forgot-password` | `ForgotPasswordPage` | Request password reset email. |
| `/reset-password` | `ResetPasswordPage` | Read `uid` and `token` query parameters and set password. |
| `/` | `HomePage` | Greeting, active sports, upcoming reservations, cancellation, campus information. |
| `/sports/:sportId` | `SportPage` | Show visible terrains and open `BookingModal`. |
| `/reservations` | `ReservationsPage` | Show past and cancelled reservation history. |

### Admin routes

`AdminRoute` requires `user.is_admin`; non-admin users are redirected home.

- `/admin`: `AdminDashboard` loads KPI cards and dashboard data.
- `/admin/users`: `AdminUsers` approves/deactivates/deletes users and toggles admin status.
- `/admin/sports`: `AdminSports` uses the legacy sports admin endpoints.
- `/admin/terrains`: `AdminTerrains` and `TerrainFormModal` use the dedicated admin panel, including multipart image upload and slot generation.
- `/admin/reservations`: `AdminReservations` uses search, cancellation, and CSV export.

### Shared components

- `Navbar.jsx`: current-user query, home navigation, logout, and local token cleanup.
- `AdminLayout.jsx`: sidebar navigation and logout for admin pages.
- `AuthLayout.jsx`: shared visual shell for authentication pages.
- `BookingModal.jsx`: seven-day date selector, React Big Calendar, participant searchable fields, booking mutation, and query invalidation.
- `ProtectedRoute.jsx`: waits for auth restoration and redirects unauthenticated users to login.
- `AdminRoute.jsx`: waits for auth restoration and checks `is_admin`.

### Services and state

- `services/api.js`: Axios instance, `VITE_API_URL` base URL, Bearer token request interceptor, and one-attempt 401 refresh interceptor.
- `services/auth.js`: small auth API wrappers.
- `services/admin.js`: dedicated admin API wrappers for dashboard, terrains, reservations, slot generation, and CSV.
- `context/AuthContext.jsx`: restores `/auth/me/` from an access token, stores tokens in local storage, and exposes `user`, `loginUser`, `logoutUser`, `loading`, and `isAdmin`.
- TanStack Query owns server cache. Common keys include `me`, `sports`, `sport`, `reservations`, `timeslots`, and `users`.

### Styling and assets

The primary stylesheet is `frontend/src/styles/index.css`, which imports Tailwind and defines brand tokens: ink/carbon black, crimson red, steel gray, fog gray, and Anton/Inter/JetBrains Mono font names. `tailwind.config.js` still contains an older `esprit` color extension and forms plugin. Sport defaults are `frontend/public/images/padel.png`, `football.png`, and `basketball.png`; the logo is in `frontend/src/assets/images/`.

## 9. Key End-to-End Flows

### Student booking

1. Student logs in and receives access/refresh tokens.
2. `HomePage` loads active sports and user reservations.
3. A sport opens `SportPage`, which loads sport detail and visible terrains.
4. Selecting an available terrain opens `BookingModal`.
5. The modal loads `/sports/terrains/<id>/timeslots/` and `/auth/users/`.
6. The student chooses a slot and optional participant matricules.
7. POST `/reservations/` validates all booking rules and creates the reservation plus participants.
8. The modal invalidates `reservations` and `timeslots`, then navigates to `/reservations`.

### Cancellation

The homepage displays future, non-cancelled reservations. Student cancellation sends `DELETE /reservations/<id>/`; the backend checks organizer ownership and the 12-hour rule, then changes status to `cancelled` rather than deleting the row. The history page displays cancelled or ended reservations.

### Admin terrain/slot workflow

1. Admin enters an `/admin/*` route after `AdminRoute` checks `is_admin`.
2. `AdminTerrains` uses multipart POST/PATCH for terrain data and images.
3. The dedicated admin view soft-deletes terrains and can generate missing slots for the current or next month.
4. Students see generated, unconfirmed slots through the public timeslot endpoint.

## 10. Current Caveats and Risks for Future Changes

These are observations from the current code, not assumptions. Preserve them in mind when fixing or extending behavior:

- `DEBUG=True`, permissive local settings, database credentials, and SMTP credentials are configured directly in `backend/config/settings.py`. Treat these as secrets/configuration debt; do not copy credentials into new documentation or commits. Move them to environment variables before deployment.
- Several admin-like account endpoints in `accounts/views.py` use `AllowAny` with comments saying they should be restricted in production. The legacy admin sport endpoints in `sports/views.py` also use `AllowAny`. The dedicated `/api/admin/` panel does enforce `IsAdminUser`. Do not infer that every `/admin`-named endpoint is protected.
- `frontend/src/services/auth.js` calls `axios.post` in `refreshToken` without importing Axios. The main Axios interceptor performs refresh independently, but this wrapper is currently broken if called.
- Admin sports UI and admin terrain/reservation UI use two different backend surfaces: `/sports/admin/...` versus `/admin/...`. Avoid silently merging them without checking frontend assumptions.
- `SportPage.jsx` hardcodes `http://localhost:8000` when building relative terrain photo URLs, while the Axios base URL is configurable. This can break non-local deployments.
- `BookingModal.jsx` hardcodes calendar min/max date objects using 2026 and derives dates with local/UTC conversions. Date and timezone changes require careful testing.
- `TerrainTimeSlotsView` treats `days` as an end-date offset while the frontend asks for 7 days, so the inclusive query can cover eight calendar dates. Confirm intended semantics before changing it.
- The frontend references fallback image names such as `/images/generic-sport-default.png` and `/images/terrain-placeholder.jpg`, but those files are not present in the current `public/images` inventory.
- The HTML title is still `frontend`, not `UniPlay`.
- The older root README describes files that are not present and claims versions/configuration that do not exactly match the live package files. Prefer the actual imports, routes, package manifests, migrations, and settings.
- Backend app test files are empty. There is no visible automated coverage for booking race conditions, permissions, password reset, slot generation, or frontend workflows.
- `common/` modules and several app permission/admin/model files are placeholders. Do not assume shared helpers exist there.
- Use database constraints and serializer validation together when touching reservations; checking only in the frontend is insufficient.

## 11. Change Guidance for AI Assistants

Before changing behavior:

1. Identify the owning layer: route, view, serializer, model constraint, service, query, or component.
2. Trace the corresponding API path from `backend/config/urls.py` through app URLs to the view and serializer.
3. Check both student and admin callers; the project has parallel legacy and dedicated admin APIs.
4. Preserve status strings (`confirmed`, `cancelled`, `available`, `maintenance`, `inactive`) unless a coordinated API/database/frontend change is intended.
5. Keep reservation validation server-side and preserve the conditional confirmed-timeslot uniqueness constraint.
6. Use React Query query keys and invalidate affected keys after mutations.
7. Keep upload requests as `multipart/form-data` and avoid forcing JSON headers for `FormData`.
8. Validate with `npm run lint`, `npm run build`, and targeted Django tests or `python manage.py check` when dependencies/database are available.
9. Do not expose configuration secrets in code, logs, documentation, or responses.
10. Update this guide when routes, models, dependencies, setup commands, or major workflows change.

## 12. File Reference Map

- Backend settings and root routes: [backend/config/settings.py](backend/config/settings.py), [backend/config/urls.py](backend/config/urls.py)
- Accounts domain: [backend/apps/accounts/models.py](backend/apps/accounts/models.py), [backend/apps/accounts/serializers.py](backend/apps/accounts/serializers.py), [backend/apps/accounts/views.py](backend/apps/accounts/views.py), [backend/apps/accounts/urls.py](backend/apps/accounts/urls.py)
- Sports domain: [backend/apps/sports/models.py](backend/apps/sports/models.py), [backend/apps/sports/serializers.py](backend/apps/sports/serializers.py), [backend/apps/sports/views.py](backend/apps/sports/views.py), [backend/apps/sports/urls.py](backend/apps/sports/urls.py)
- Reservation domain: [backend/apps/reservations/models.py](backend/apps/reservations/models.py), [backend/apps/reservations/serializers.py](backend/apps/reservations/serializers.py), [backend/apps/reservations/views.py](backend/apps/reservations/views.py), [backend/apps/reservations/urls.py](backend/apps/reservations/urls.py)
- Admin API: [backend/apps/admin_panel/views.py](backend/apps/admin_panel/views.py), [backend/apps/admin_panel/serializers.py](backend/apps/admin_panel/serializers.py), [backend/apps/admin_panel/urls.py](backend/apps/admin_panel/urls.py)
- Frontend route composition: [frontend/src/App.jsx](frontend/src/App.jsx), [frontend/src/main.jsx](frontend/src/main.jsx)
- Frontend transport/auth: [frontend/src/services/api.js](frontend/src/services/api.js), [frontend/src/services/auth.js](frontend/src/services/auth.js), [frontend/src/context/AuthContext.jsx](frontend/src/context/AuthContext.jsx)
- Booking UI: [frontend/src/pages/SportPage.jsx](frontend/src/pages/SportPage.jsx), [frontend/src/components/BookingModal.jsx](frontend/src/components/BookingModal.jsx)
- Admin UI: [frontend/src/components/AdminLayout.jsx](frontend/src/components/AdminLayout.jsx), [frontend/src/services/admin.js](frontend/src/services/admin.js), [frontend/src/pages/admin/](frontend/src/pages/admin/)

## 13. Validation Snapshot

Verified from the repository root on 2026-09-14:

- `Push-Location backend; python manage.py check` passes with no Django system-check issues.
- `Push-Location frontend; npm run build` passes. Vite reports a bundle-size warning because the main JavaScript chunk is over 500 kB.
- `Push-Location frontend; npm run lint` currently fails on existing source issues, including the undefined `axios` reference in `services/auth.js`, an unused `useAuth` import in `AuthLayout.jsx`, unused error handling in `AdminReservations.jsx`, React hook lint rules in auth/admin components, and `require` in `tailwind.config.js`.
- Backend app `tests.py` files are empty, so passing Django system checks is not evidence of business-rule test coverage.
