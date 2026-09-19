# UniPlay: Complete Project Handoff for AI Assistants

**Document purpose:** This file is a full technical and product brief for another AI assistant joining the UniPlay project. It explains what the application is, how the repository is organized, how the frontend and backend communicate, which business rules are important, where behavior is implemented, how to run and validate the project, and which parts require caution.

**Repository:** `UniPlay`
**Current state:** Active development
**Last verified:** 2026-09-16
**Primary language:** Python and JavaScript/JSX
**Primary UI language:** French
**Target institution:** Universite ESPRIT

> This document describes the live repository as it exists now. The older `README.md` contains useful historical intent but includes stale paths and setup claims. Prefer this file, the actual source code, migrations, package manifest, settings, and route definitions when they disagree.

---

## 1. Product Summary

UniPlay is a full-stack sports-facility reservation platform for students and administrators at Universite ESPRIT.

Students can:

- Create an account using a student matricule.
- Wait for administrator approval before accessing the application.
- Log in with JWT authentication.
- Browse active sports such as padel, football, and basketball.
- Browse the terrains belonging to a sport.
- See terrain status, capacity, images, and campus information.
- Inspect available booking slots over a seven-day window.
- Reserve one available time slot.
- Invite other registered students by matricule.
- View upcoming reservations from the home page.
- Cancel their own confirmed reservation when the cancellation deadline permits it.
- View finished and cancelled reservations in their history.
- Edit profile information and photo.
- Change their password.
- Request and complete a password reset.
- Submit reclamations/messages to the administration.

Administrators can:

- Access a separate admin interface.
- View dashboard statistics.
- Approve, deactivate, delete, and manage students/users.
- Toggle application admin status for users.
- Create, update, deactivate, and manage sports.
- Create and update terrains, including images, capacity, opening hours, and slot duration.
- Generate current-month and next-month time slots.
- Inspect global reservations.
- Search reservations.
- Cancel reservations as an administrator.
- Export reservations as CSV.
- View a monthly planning grid for a selected terrain.
- Read reclamations and inspect the sender's full details.

The application is intentionally split into a student experience and an admin experience. Both are React routes backed by the same Django REST API, but they use different route guards and layouts.

---

## 2. High-Level Architecture

```text
Browser
  |
  | React SPA, React Router, Axios, TanStack Query
  | HTTP JSON / multipart requests
  v
Django REST Framework API
  |
  | JWT authentication, serializers, permissions, business validation
  v
PostgreSQL
  |
  +-- User, Sport, Terrain
  +-- TimeSlot, Reservation, Participant
  +-- Reclamation

Django development media:
  backend/media/
```

### Backend

- Django project under `backend/`.
- Django REST Framework for API endpoints.
- PostgreSQL database.
- Simple JWT for access and refresh tokens.
- `drf-spectacular` for OpenAPI schema and Swagger UI.
- CORS support through `django-cors-headers`.
- Local media serving while `DEBUG=True`.

### Frontend

- React 19 single-page application under `frontend/`.
- Vite development/build tooling.
- React Router for client-side navigation.
- Axios for API transport.
- TanStack React Query for server state and cache invalidation.
- Tailwind CSS 4-style configuration and custom design tokens.
- React Big Calendar for the student booking calendar.
- `date-fns` for date localization and calendar helpers.

### Communication

- Frontend API requests are sent through `frontend/src/services/api.js`.
- The Axios base URL is read from `VITE_API_URL`.
- Vite proxies `/api` to `http://127.0.0.1:8000` during development.
- Backend API endpoints are mounted below `/api/`.
- JWT access tokens are stored in browser `localStorage` and attached as Bearer tokens.

---

## 3. Repository Layout

```text
UniPlay/
|
|-- AI_PROJECT_CONTEXT.md              Existing assistant-oriented context guide
|-- README.md                          Older project overview; partly stale
|-- UNIPLAY_AI_HANDOFF.md              This document
|-- pyvenv.cfg                         Local Python environment metadata
|
|-- backend/
|   |-- manage.py                      Django command-line entry point
|   |-- config/
|   |   |-- settings.py                Django configuration
|   |   |-- urls.py                    Root URL routing
|   |   |-- asgi.py                    ASGI entry point
|   |   `-- wsgi.py                    WSGI entry point
|   |
|   |-- apps/
|   |   |-- accounts/                  Users, authentication, password reset, reclamations
|   |   |   |-- models.py
|   |   |   |-- serializers.py
|   |   |   |-- views.py
|   |   |   |-- urls.py
|   |   |   |-- permissions.py
|   |   |   `-- migrations/
|   |   |
|   |   |-- sports/                    Sports, terrains, public catalog, timeslot lookup
|   |   |   |-- models.py
|   |   |   |-- serializers.py
|   |   |   |-- views.py
|   |   |   |-- urls.py
|   |   |   `-- migrations/
|   |   |
|   |   |-- reservations/              Slots, reservations, participants, booking rules
|   |   |   |-- models.py
|   |   |   |-- serializers.py
|   |   |   |-- views.py
|   |   |   |-- urls.py
|   |   |   `-- migrations/
|   |   |
|   |   `-- admin_panel/                Dedicated admin dashboard API
|   |       |-- views.py
|   |       |-- serializers.py
|   |       |-- urls.py
|   |       `-- permissions.py
|   |
|   |-- common/                        Placeholder/shared utility area
|   `-- media/                         Development-uploaded files
|
`-- frontend/
    |-- package.json
    |-- vite.config.js
    |-- tailwind.config.js
    |-- postcss.config.js
    |-- index.html
    |-- public/images/                  Public fallback and sport images
    `-- src/
        |-- App.jsx                    Route composition
        |-- main.jsx                   React providers/bootstrap
        |-- styles/index.css            Main Tailwind import and design tokens
        |-- App.css                     Mostly leftover Vite styles
        |-- components/
        |-- context/
        |-- pages/
        |-- router/
        `-- services/
```

Generated/dependency directories such as `frontend/node_modules/`, Python virtual-environment directories, `__pycache__/`, and build output are not application source and should not be treated as product logic.

---

## 4. Backend Configuration and Startup

### 4.1 Django entry point

Run backend commands from `backend/` because `manage.py` sets:

```python
DJANGO_SETTINGS_MODULE = "config.settings"
```

The application imports local apps as top-level packages such as `apps.accounts`, not as `backend.apps.accounts`. This distinction matters because the project is run from the `backend` directory.

### 4.2 Installed applications

The configured Django/DRF stack includes:

- Django admin/auth/contenttypes/sessions/messages/staticfiles.
- `rest_framework`.
- `rest_framework_simplejwt`.
- JWT token blacklist support.
- `corsheaders`.
- `drf_spectacular`.
- `apps.accounts`.
- `apps.sports`.
- `apps.reservations`.

### 4.3 Database

The live settings configure PostgreSQL on localhost:

- Database: `UniPlay`
- Host: `localhost`
- Port: `5432`
- User/password: configured directly in local settings

Do not copy database credentials into new documentation, commits, logs, or responses. The current configuration has security/configuration debt because local credentials and other sensitive settings are kept directly in `settings.py`.

### 4.4 Authentication settings

- Custom user model: `accounts.User`.
- JWT access token lifetime: approximately 60 minutes.
- JWT refresh token lifetime: approximately 7 days.
- Refresh rotation and blacklist-after-rotation are enabled.
- Global DRF authentication uses JWT.
- Global default permission is authenticated access unless a view overrides it.
- Registration deliberately creates inactive users.
- Admin approval is required before a newly registered student can use the application.

### 4.5 Important configuration caveats

- `DEBUG=True` is currently enabled.
- Local CORS origins are configured for frontend development.
- Gmail SMTP is configured for password reset email.
- Media is served locally at `/media/` in development.
- There is no committed environment template in the current tree.
- There is no tracked backend `requirements.txt` in the live repository despite older README claims. The local virtual environment exists, but dependency reproduction needs improvement.

---

## 5. Backend URL Map

Root routes are defined in `backend/config/urls.py`.

| URL | Purpose |
|---|---|
| `/admin/` | Django's built-in admin site |
| `/api/auth/` | Account and authentication routes |
| `/api/users/validate-ids/` | Root-level student matricule validation endpoint |
| `/api/sports/` | Public sports, terrains, and timeslot routes; also legacy sport admin routes |
| `/api/reservations/` | Student reservation routes |
| `/api/admin/` | Dedicated admin-panel routes |
| `/api/schema/` | OpenAPI schema |
| `/api/schema/swagger-ui/` | Swagger UI |
| `/media/` | Development media files when `DEBUG=True` |

### 5.1 Account and authentication API

These paths are relative to `/api`:

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/auth/register/` | Public | Register an inactive student account |
| POST | `/auth/login/` | Public | Return JWT tokens and user metadata |
| POST | `/auth/refresh/` | Public | Refresh an access token |
| POST | `/auth/logout/` | Authenticated | Blacklist a refresh token |
| GET | `/auth/me/` | Authenticated | Return current user |
| GET | `/auth/users/` | Authenticated | Return active non-admin students for invitations |
| POST | `/auth/validate-students/` | Authenticated | Validate submitted matricules |
| POST | `/auth/password-reset/` | Public | Request password reset email |
| POST | `/auth/password-reset-confirm/` | Public | Confirm reset with `uid`, `token`, and new password |
| GET | `/auth/admin/users/` | Intended admin | List/manage users for admin UI |
| PATCH/DELETE | `/auth/admin/users/<id>/` | Intended admin | Update or delete a user |
| POST | `/users/validate-ids/` | Authenticated | Duplicate/root-level matricule validation route |

The login response includes a nested `user` object containing id, username, email, name, `is_admin`, and `is_active`. The frontend uses this object to decide whether to redirect to the admin dashboard or student home page.

Password-reset request behavior intentionally avoids revealing whether an email exists. The server returns a generic response and sends an email only when a matching user exists.

### 5.2 Public sports and booking API

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/sports/` | Public | List active sports and terrain counts |
| GET | `/sports/<id>/` | Public | Retrieve a sport with visible terrains |
| GET | `/sports/terrains/` | Public | List non-inactive terrains |
| GET | `/sports/terrains/<id>/` | Public | Retrieve one terrain |
| GET | `/sports/<sport_id>/terrains/` | Public | Retrieve terrains for a sport |
| GET | `/sports/terrains/<terrain_id>/timeslots/` | Public | Retrieve available unconfirmed slots; accepts `start_date` and `days` |
| GET | `/reservations/` | Authenticated | List reservations organized or joined by current user |
| POST | `/reservations/` | Authenticated | Create a reservation and optional participants |
| GET | `/reservations/<id>/` | Organizer/participant | Retrieve reservation detail |
| DELETE | `/reservations/<id>/` | Organizer only | Cancel a reservation if the deadline permits |

### 5.3 Dedicated admin API

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/admin/dashboard/stats/` | `is_admin` | KPI statistics |
| CRUD | `/admin/sports/` and `/admin/sports/<id>/` | `is_admin` | Dedicated sport CRUD |
| CRUD | `/admin/terrains/` and `/admin/terrains/<id>/` | `is_admin` | Terrain CRUD and soft-delete |
| POST | `/admin/terrains/<id>/generate_slots/` | `is_admin` | Generate current or next month slots |
| GET | `/admin/planning/` | `is_admin` | Monthly terrain planning grid |
| GET | `/admin/reservations/` | `is_admin` | Global reservation list; supports `search` |
| POST | `/admin/reservations/<id>/cancel/` | `is_admin` | Cancel any reservation |
| GET | `/admin/reservations/export_csv/` | `is_admin` | Download reservation CSV |
| GET | `/admin/reclamations/` | `is_admin` | List reclamations |
| GET | `/admin/reclamations/<id>/` | `is_admin` | View reclamation details |

The admin router is registered in `backend/apps/admin_panel/urls.py` with DRF `DefaultRouter`. Planning is an explicit API view in the same module.

---

## 6. Domain Model

### 6.1 User

Defined in `backend/apps/accounts/models.py` as a subclass of `AbstractUser`.

Important fields:

- `username`: unique student matricule and login identifier.
- `email`: unique email address.
- `first_name`, `last_name`: standard identity fields.
- `phone_number`: required phone number field.
- `classe`: class/group information.
- `specialite`: specialty/program information.
- `photo`: optional uploaded profile photo.
- `is_active`: account approval/activation state.
- `is_admin`: application-level admin flag.

`is_admin` is not the same thing as Django `is_staff` or `is_superuser`. Frontend admin access uses the application-level flag.

### 6.2 Sport

Defined in `backend/apps/sports/models.py`.

Fields:

- `name`: unique sport name.
- `description`: optional description.
- `icon`: optional image uploaded under `sports/icons/`.
- `is_active`: public visibility flag.

Relationship:

- One sport has many terrains through the `terrains` reverse relation.

### 6.3 Terrain

Defined in `backend/apps/sports/models.py`.

Fields:

- `name`.
- `sport`: foreign key to `Sport`.
- `capacity`: maximum number of participants.
- `slot_duration`: duration in minutes, default 60.
- `photo`: optional image uploaded under `terrains/`.
- `status`: one of `available`, `maintenance`, or `inactive`.
- `opening_hours`: JSON configuration used by slot generation.

Current dedicated admin slot generation expects a simple opening-hours object with `start` and `end`, for example:

```json
{
  "start": "08:00",
  "end": "22:00"
}
```

Do not assume the older README's day-by-day opening-hours example matches the live generator. The live generator reads `opening_hours.start` and `opening_hours.end`.

Behavior:

- Inactive terrains are generally hidden from public lists.
- Maintenance terrains remain visible on the student sport page but are not bookable in the frontend.
- Deleting a terrain in the dedicated admin panel is a soft delete that sets `status` to `inactive`.

### 6.4 TimeSlot

Defined in `backend/apps/reservations/models.py`.

Fields:

- `terrain`.
- `date`.
- `start_time`.
- `end_time`.
- `is_available`.

Constraints and behavior:

- Unique database constraint on `(terrain, date, start_time, end_time)`.
- Ordered by date and start time.
- Generated in bulk from terrain opening hours and slot duration.
- The public endpoint returns slots that are not already occupied by a confirmed reservation.

### 6.5 Reservation

Defined in `backend/apps/reservations/models.py`.

Fields:

- `terrain`.
- `timeslot`.
- `organizer`.
- `created_at`.
- `status`, currently `confirmed` or `cancelled`.

Constraints and behavior:

- Only one confirmed reservation may exist for a timeslot.
- Cancelled reservations remain as historical records.
- `can_cancel` is true only for confirmed reservations whose start time is at least 12 hours in the future.
- The organizer or a participant can view a reservation.
- Only the organizer can cancel through the student endpoint.
- Admins can cancel globally through the dedicated admin endpoint.

### 6.6 Participant

Defined in `backend/apps/reservations/models.py`.

Fields:

- `reservation`.
- `student`.
- Snapshot fields `first_name` and `last_name`.
- `added_at`.

Rules:

- The organizer is automatically recorded as the first participant.
- Submitted invitation IDs are deduplicated.
- The organizer is removed if included in the invitation list.
- Total participants cannot exceed terrain capacity.
- A student cannot appear twice in the same reservation.
- The database enforces uniqueness per reservation/student.

### 6.7 Reclamation

Defined in `backend/apps/accounts/models.py`.

Fields:

- `sender`: foreign key to the custom user.
- `message`: text content.
- `created_at`: creation timestamp.

The student can create a reclamation. Admins can list reclamations and open a detailed view showing the sender's identity and account information.

---

## 7. Reservation Business Rules

The booking serializer is the main validation boundary. The frontend must never be considered the authority for these rules.

A booking must:

1. Reference an existing terrain.
2. Reference a timeslot belonging to that terrain.
3. Use a timeslot that is not in the past.
4. Use a timeslot without a confirmed reservation.
5. Use valid active student matricules for invited participants.
6. Remove duplicate invited IDs.
7. Exclude the organizer if the organizer's own ID is submitted.
8. Include the organizer in the participant count.
9. Stay within the terrain capacity.
10. Survive a possible concurrent booking race through the database constraint and `IntegrityError` handling.

The frontend presents available slots and prevents obvious invalid actions, but the backend serializer/model constraint must remain authoritative.

Cancellation must:

- Target the organizer's own reservation for student cancellation.
- Require status `confirmed`.
- Occur at least 12 hours before the slot start.
- Change status to `cancelled` rather than deleting the record.

---

## 8. Slot Generation and Planning

### 8.1 Generation

`backend/apps/admin_panel/views.py` contains `_generate_slots_for_terrain(terrain, target)`.

Supported targets:

- `current`: from today through the end of the current month.
- `next`: the complete next calendar month.

Generation uses:

- `terrain.opening_hours.start`.
- `terrain.opening_hours.end`.
- `terrain.slot_duration`.

Existing slots are skipped. Terrain creation automatically generates current and next month slots. Terrain updates delete future slots that have no reservation history and regenerate them to match the new opening hours/duration. Slots linked to reservation history are preserved because the reservation relationship protects them.

### 8.2 Admin planning endpoint

The planning endpoint accepts:

```text
GET /api/admin/planning/?terrain=<id>&year=<year>&month=<month>
```

It returns:

- Selected terrain metadata.
- Every day in the requested month.
- Rows derived from current terrain opening hours and slot duration.
- Each row's start/end label.
- A cell for every day with either a confirmed reservation ID or `null`.

The frontend page is `frontend/src/pages/admin/AdminPlanning.jsx`. It renders a month selector, terrain selector, sticky time column, date columns, reservation indicators, and a reservation-detail modal.

Important distinction:

- The planning grid is an admin visualization.
- It derives row labels from current terrain configuration.
- It checks confirmed reservations against stored timeslots.
- It is not itself the booking API.

---

## 9. Frontend Architecture

### 9.1 Bootstrap

`frontend/src/main.jsx` mounts:

1. `React.StrictMode`.
2. `BrowserRouter`.
3. `QueryClientProvider`.
4. `AuthProvider`.
5. `App`.

React Query defaults currently retry queries once and do not refetch on window focus.

### 9.2 Route composition

`frontend/src/App.jsx` defines two wrapper layouts:

#### Student wrapper: `AppLayout`

- Uses `ProtectedRoute`.
- Renders the student `Navbar`.
- Provides a minimum-height fog background.
- Renders student page content.

#### Admin wrapper: `AdminAppLayout`

- Uses `AdminRoute`.
- Renders `AdminLayout` with sidebar navigation.
- Renders admin page content.

### 9.3 Student routes

| Route | Page | Description |
|---|---|---|
| `/login` | `LoginPage` | Login and redirect based on admin status |
| `/register` | `RegisterPage` | Create an inactive student account |
| `/forgot-password` | `ForgotPasswordPage` | Request reset email |
| `/reset-password` | `ResetPasswordPage` | Complete reset using URL parameters |
| `/` | `HomePage` | Sports catalog, greeting, upcoming reservations, campus area |
| `/sports/:sportId` | `SportPage` | Terrain catalog and booking entry point |
| `/reservations` | `ReservationsPage` | Finished and cancelled reservation history |
| `/profile` | `ProfilePage` | Profile view |
| `/parametres` | Redirect | Redirects to `/parametres/profil` |
| `/parametres/profil` | `EditProfilePage` | Profile editing and photo update |
| `/parametres/mot-de-passe` | `ChangePasswordPage` | Change current password |
| `/parametres/reclamations` | `ReclamationsPage` | Submit a reclamation |

### 9.4 Admin routes

All admin routes use `AdminRoute` and `AdminLayout`.

| Route | Page | Description |
|---|---|---|
| `/admin` | `AdminDashboard` | KPI dashboard |
| `/admin/users` | `AdminUsers` | User/admin account management |
| `/admin/students` | `AdminStudents` | Student-focused management view |
| `/admin/sports` | `AdminSports` | Sport management |
| `/admin/terrains` | `AdminTerrains` | Terrain management, uploads, slot generation |
| `/admin/planning` | `AdminPlanning` | Monthly terrain planning grid |
| `/admin/reservations` | `AdminReservations` | Global reservations, search, cancellation, export |
| `/admin/reclamations` | `AdminReclamations` | Reclamation list and detail modal |

`AdminLayout.jsx` defines the sidebar labels and active route behavior. The admin sidebar currently includes dashboard, users, students, terrains, sports, planning, reservations, reclamations, and logout.

### 9.5 Shared components

- `Navbar.jsx`: student navigation, current-user information, home/profile/logout actions.
- `AdminLayout.jsx`: admin sidebar and logout.
- `AuthLayout.jsx`: visual shell for authentication pages.
- `BookingModal.jsx`: date selector, React Big Calendar, participant search, booking submission.
- `ParametersLayout.jsx`: settings sidebar for profile, password, and reclamations.
- `TerrainFormModal.jsx`: admin terrain create/update form and upload workflow.
- `ProtectedRoute.jsx`: waits for authentication restoration and redirects unauthenticated users.
- `AdminRoute.jsx`: waits for authentication restoration and redirects non-admin users.

### 9.6 Services and state

#### `frontend/src/services/api.js`

- Creates the shared Axios instance.
- Reads `VITE_API_URL`.
- Adds `Authorization: Bearer <access-token>` to requests.
- On the first 401, attempts one access-token refresh using the stored refresh token.
- Redirects to login and clears storage when refresh fails.

#### `frontend/src/services/auth.js`

Contains smaller auth API wrappers. It should be checked before reuse because the current context reports an undefined Axios import in its refresh helper.

#### `frontend/src/services/admin.js`

Contains admin request wrappers for dashboard, terrains, reservations, slot generation, and CSV export.

#### `frontend/src/context/AuthContext.jsx`

- Restores the current user with `/auth/me/` when an access token exists.
- Stores access and refresh tokens.
- Exposes current user, loading state, admin status, login, and logout actions.

#### TanStack Query

Typical query keys include:

- `me`
- `sports`
- `sport`
- `reservations`
- `timeslots`
- `users`
- Admin-specific reservation, planning, terrain, and reclamation keys.

After mutations, invalidate the relevant server-state queries. For example, a successful booking invalidates reservations and timeslots before navigating to reservation history.

---

## 10. Main Student Workflows

### 10.1 Registration and approval

1. User opens `/register`.
2. Frontend submits registration data to `/api/auth/register/`.
3. Backend creates the user with `is_active=False`.
4. An administrator activates or approves the account.
5. The user can then log in.

### 10.2 Login

1. User submits matricule/password at `/login`.
2. Backend returns access token, refresh token, and user metadata.
3. Frontend stores tokens in `localStorage`.
4. The current user is restored through `/auth/me/`.
5. Admins go to `/admin`; students go to `/`.

### 10.3 Student booking

1. Student opens the home page.
2. `HomePage` requests active sports.
3. Student opens `/sports/:sportId`.
4. `SportPage` requests sport details and visible terrains.
5. Maintenance terrains are visible but their booking button is disabled.
6. Student clicks an available terrain.
7. `BookingModal` opens.
8. The modal requests timeslots for the selected terrain and seven-day window.
9. The modal requests active users for participant search.
10. Student selects a date and available calendar event.
11. Student optionally adds other student matricules.
12. Frontend posts terrain ID, timeslot ID, and participant IDs to `/api/reservations/`.
13. Backend validates ownership, time, availability, IDs, capacity, and race conditions.
14. On success, the frontend invalidates `reservations` and `timeslots`, closes the modal, and navigates to `/reservations`.

### 10.4 Cancellation and history

- The home page focuses on future, non-cancelled reservations.
- The student can cancel only their own reservation through the allowed UI action.
- The backend changes status to `cancelled`.
- The history page displays cancelled reservations and reservations whose slot has ended.
- Cancelled records remain for history and administrative reporting.

### 10.5 Reclamations

- Student opens `/parametres/reclamations`.
- Student submits a message through the accounts API.
- Admin opens `/admin/reclamations`.
- Admin sees sender and creation date.
- Clicking a row loads sender profile data and the complete message in a modal.

---

## 11. Main Admin Workflows

### 11.1 Admin access

1. User logs in.
2. Login response includes `is_admin`.
3. Admin routes pass through `AdminRoute`.
4. `AdminRoute` allows access only for authenticated users whose application-level `is_admin` is true.
5. Admin pages render inside `AdminLayout`.

### 11.2 User management

The admin user screens manage student accounts, approval state, activation/deactivation, deletion, and application admin status. Verify the actual endpoint permission before changing account-management behavior because some older account endpoints have weaker permissions than the dedicated admin panel.

### 11.3 Sport and terrain management

- Admin sports are managed through the frontend admin sports page.
- Admin terrains support create/update/delete behavior and image uploads.
- Terrain deletion is a soft delete (`inactive`).
- Terrain create automatically generates current and next month slots.
- Terrain updates rebuild future slots that do not have reservation history.
- Multipart form data must remain multipart; do not force JSON headers when sending `FormData`.

### 11.4 Planning

- Admin chooses a terrain and month.
- Frontend requests `/api/admin/planning/` with terrain/year/month.
- The table shows each date as a column and each time window as a row.
- Confirmed reservations appear as occupied cells.
- Clicking an occupied cell loads reservation details.

### 11.5 Reservation administration

- Admin can list all reservations.
- Search can match organizer matricule/name or terrain name.
- Admin can cancel a reservation directly.
- CSV export computes human-readable status based on cancellation and whether the slot ended.

### 11.6 Reclamation administration

- Admin list endpoint returns compact sender/date rows.
- Detail endpoint returns message, sender identity, email, phone, class, specialty, and photo URL.
- The frontend uses a modal for detailed inspection.

---

## 12. UI and Design System

The main design source is `frontend/src/styles/index.css`.

Brand tokens include:

- `ink`: near-black primary text/background.
- `carbon`: dark secondary neutral.
- `crimson`: red primary accent and action color.
- `crimsonDark`: darker red hover/active color.
- `steel`: muted gray text.
- `fog`: light gray page background.
- `font-display`: Anton.
- `font-sans`: Inter.
- `font-mono`: JetBrains Mono.

Visual language:

- Dark ink headers and sidebar surfaces.
- Crimson action states.
- White content panels against fog backgrounds.
- Rounded panels with restrained borders and shadows.
- Uppercase compact labels for operational UI.
- Dense tables for admin workflows.
- Responsive cards for student terrain browsing.

The student booking modal has received custom visual work:

- Dark reservation header.
- Seven date cards.
- Framed calendar surface.
- Calendar toolbar/header/grid skin.
- Participant invitation section.
- Reservation summary and submit action.
- A single outer modal content scroll area; do not reintroduce decorative in-content arrow controls without testing the layout carefully.

The admin planning page emphasizes a table/grid structure with:

- Sticky time column.
- Sticky date header.
- Highlighted current day.
- Alternating row backgrounds.
- Reserved/free visual states.
- Monthly planning legend.

---

## 13. Image and Media Behavior

Backend media:

- User photos are uploaded under `media/users/photos/`.
- Terrain photos are uploaded under `media/terrains/`.
- Sport icons are uploaded under `media/sports/icons/`.

Frontend:

- Terrain photo URLs are made absolute using a hardcoded local backend base URL in `SportPage.jsx` when the API returns a relative path.
- Fallback image paths are used for missing images.
- Some fallback image names referenced by the frontend may not exist in the current `public/images/` inventory.
- This hardcoded `http://localhost:8000` behavior can break outside local development and should eventually be replaced with a shared configurable media URL.

---

## 14. Running the Project

### 14.1 Backend

Open a PowerShell terminal in `backend/` and activate the project virtual environment first.

```powershell
python manage.py migrate
python manage.py check
python manage.py runserver
```

Expected development API address:

```text
http://127.0.0.1:8000/
```

Useful commands:

```powershell
python manage.py makemigrations
python manage.py createsuperuser
python manage.py test
```

Requirements:

- PostgreSQL must be running.
- Database `UniPlay` must exist.
- Local settings must be able to connect to PostgreSQL.
- Backend dependencies must be installed in the active environment.

### 14.2 Frontend

Open a second PowerShell terminal in `frontend/`.

```powershell
npm install
npm run dev
```

Expected development address:

```text
http://localhost:5173/
```

Other scripts:

```powershell
npm run build
npm run lint
npm run preview
```

The frontend normally uses `VITE_API_URL=/api` so Vite's proxy forwards API requests to Django. No committed `.env` file currently exists, so verify the local environment before debugging network requests.

### 14.3 API documentation

When Django is running:

```text
http://127.0.0.1:8000/api/schema/
http://127.0.0.1:8000/api/schema/swagger-ui/
```

---

## 15. Validation Strategy

For backend route/model/serializer changes:

```powershell
Push-Location backend
python manage.py check
python manage.py test
Pop-Location
```

For frontend changes:

```powershell
Push-Location frontend
npm run lint
npm run build
Pop-Location
```

For reservation behavior, test at minimum:

- Unauthenticated access.
- Inactive user login.
- Valid booking.
- Past slot rejection.
- Already-booked slot rejection.
- Wrong terrain/slot pairing.
- Duplicate participant IDs.
- Organizer included in participant IDs.
- Capacity overflow.
- Concurrent confirmed booking race.
- Organizer-only cancellation.
- Less-than-12-hour cancellation rejection.
- Admin cancellation.

Current coverage limitations:

- Backend app `tests.py` files are present but effectively empty.
- There is no reliable automated coverage for booking races, permissions, password reset, slot generation, or frontend workflows.
- A successful Django system check does not prove that business rules work.

---

## 16. Known Inconsistencies and Risks

These are important when another AI modifies the project.

### Security and configuration

- Sensitive database and SMTP configuration is directly present in local settings.
- `DEBUG=True` is enabled.
- Some older admin-like endpoints in the accounts and sports apps may use permissive permissions. Do not assume every URL containing `admin` is protected.
- The dedicated `/api/admin/` panel uses `IsAdminUser`, but legacy `/sports/admin/...` and some account-management routes may not have equivalent protection.
- JWT tokens are stored in `localStorage`, which has XSS exposure. Do not redesign auth casually, but treat this as a security consideration.

### API duplication

There are two admin surfaces:

1. Dedicated admin panel routes under `/api/admin/`.
2. Older/legacy admin sports routes under `/api/sports/admin/`.

The frontend currently uses both depending on the page. Avoid merging them without tracing every caller.

### Frontend implementation risks

- `SportPage.jsx` hardcodes `http://localhost:8000` for relative media URLs.
- `BookingModal.jsx` uses calendar min/max date objects with a 2026 date anchor and performs local/UTC date conversions. Date/time changes need timezone testing.
- The timeslot endpoint's interpretation of the `days` parameter should be checked carefully; the frontend asks for seven days and inclusive date math may produce an unexpected range.
- Some fallback image files may be missing.
- `frontend/index.html` still has a generic Vite title rather than a polished UniPlay title.
- `frontend/src/App.css` retains mostly unused Vite starter styles.
- The frontend linter has existing issues reported by the repository context, including an undefined Axios reference in `services/auth.js`, unused imports/error variables, hook lint issues, and a CommonJS `require` in the Tailwind config.

### Backend implementation risks

- `DashboardStatsView` aggregates a `pending` status even though the reservation model currently defines only `confirmed` and `cancelled`. The result will normally be zero, but the mismatch should be resolved intentionally.
- Planning row labels are derived from current terrain settings rather than independently from stored slot rows.
- Rebuilding slots on terrain update intentionally preserves any slot with reservation history.
- Reclamation belongs to `accounts`, not `sports`. Imports must use `from apps.accounts.models import Reclamation` or a relative accounts import where appropriate.
- Because the project is run from `backend/`, imports such as `from backend.apps...` fail; use `apps...` or relative imports.

### Documentation risks

- The older README claims files and packages that are not necessarily present now.
- This handoff should be updated when routes, models, dependencies, setup, or major UI workflows change.

---

## 17. Safe Change Workflow for an AI Assistant

Before editing:

1. Identify the exact user-visible behavior or failing command.
2. Find the nearest owning code path: route, component, service, view, serializer, model, or database constraint.
3. Trace the corresponding API path from root URLs to app URLs to view and serializer.
4. Check whether both student and admin callers use the same endpoint.
5. Preserve current status strings and response shapes unless an intentional coordinated API change is required.
6. Preserve server-side validation and database constraints for reservations.
7. Check existing local modifications before editing; do not revert unrelated user work.

After editing:

1. Run the narrowest relevant diagnostics or test first.
2. Run `python manage.py check` for backend routing/configuration changes.
3. Run `npm run lint` or `npm run build` for frontend changes when available.
4. Test the actual user workflow when the change is visual or cross-layer.
5. Report unrelated pre-existing warnings separately from newly introduced issues.
6. Update this handoff if the project architecture or route contract changed.

Do not:

- Put secrets into documentation.
- Rename API status values casually.
- Trust frontend availability checks as a replacement for backend validation.
- Delete historical cancelled reservations without explicit product approval.
- Turn soft-delete behavior into hard deletion without checking protected relationships.
- Assume the legacy and dedicated admin APIs are interchangeable.
- Use broad refactors for a narrow bug.

---

## 18. File Ownership Map

### Backend

- `backend/config/settings.py`: runtime configuration, installed apps, database, JWT, CORS, email, media.
- `backend/config/urls.py`: global URL composition.
- `backend/apps/accounts/models.py`: custom user and reclamation model.
- `backend/apps/accounts/serializers.py`: account/profile/auth/reclamation validation and output.
- `backend/apps/accounts/views.py`: registration, authentication, users, reset flow, reclamation creation.
- `backend/apps/accounts/urls.py`: account routes.
- `backend/apps/sports/models.py`: sports and terrains.
- `backend/apps/sports/serializers.py`: public sports/terrain representations.
- `backend/apps/sports/views.py`: public catalog, timeslot lookup, legacy sport admin behavior.
- `backend/apps/sports/urls.py`: sports routes.
- `backend/apps/reservations/models.py`: slots, reservations, participants, cancellation property.
- `backend/apps/reservations/serializers.py`: booking validation boundary.
- `backend/apps/reservations/views.py`: student reservation list/create/detail/cancel.
- `backend/apps/reservations/urls.py`: reservation routes.
- `backend/apps/admin_panel/views.py`: admin KPIs, CRUD, generation, planning, cancellation, CSV.
- `backend/apps/admin_panel/serializers.py`: admin response shapes.
- `backend/apps/admin_panel/urls.py`: dedicated admin routes.

### Frontend

- `frontend/src/App.jsx`: all client routes and layout composition.
- `frontend/src/main.jsx`: providers and application bootstrap.
- `frontend/src/context/AuthContext.jsx`: authentication state and token restoration.
- `frontend/src/services/api.js`: shared Axios transport and refresh behavior.
- `frontend/src/services/auth.js`: auth API helper layer.
- `frontend/src/services/admin.js`: admin API helper layer.
- `frontend/src/router/ProtectedRoute.jsx`: student authentication guard.
- `frontend/src/router/AdminRoute.jsx`: admin authorization guard.
- `frontend/src/components/Navbar.jsx`: student navigation.
- `frontend/src/components/AdminLayout.jsx`: admin sidebar.
- `frontend/src/components/BookingModal.jsx`: student booking interaction and calendar.
- `frontend/src/components/ParametersLayout.jsx`: settings navigation.
- `frontend/src/pages/HomePage.jsx`: student home/dashboard.
- `frontend/src/pages/SportPage.jsx`: sport/terrain browsing and booking launch.
- `frontend/src/pages/ReservationsPage.jsx`: reservation history.
- `frontend/src/pages/admin/AdminPlanning.jsx`: admin planning table.
- `frontend/src/pages/admin/AdminReclamations.jsx`: admin reclamation list/detail.
- `frontend/src/pages/admin/AdminReservations.jsx`: admin reservation operations.
- `frontend/src/pages/admin/AdminTerrains.jsx`: admin terrain operations.
- `frontend/src/pages/admin/AdminSports.jsx`: admin sport operations.
- `frontend/src/pages/admin/AdminUsers.jsx`: admin user operations.
- `frontend/src/pages/admin/AdminStudents.jsx`: admin student operations.
- `frontend/src/styles/index.css`: Tailwind import, design tokens, calendar/modal styling.

---

## 19. Mental Model for Future AI Work

When asked to change UniPlay, think of it as four connected layers:

```text
User intent
  -> React route/page/component
  -> Axios request + React Query cache
  -> Django URL/view/serializer/permission
  -> Model constraint and PostgreSQL state
```

A correct change usually follows the entire chain. For example, changing booking availability may require checking:

- The student calendar event mapping.
- The timeslot API response.
- Reservation serializer validation.
- The confirmed-reservation database constraint.
- Query invalidation after booking/cancellation.
- Admin planning and global reservation views.

The most important project principle is: **the backend owns correctness; the frontend owns clarity and interaction.** Keep those responsibilities distinct, preserve the existing API contract where possible, and validate cross-layer changes end to end.
