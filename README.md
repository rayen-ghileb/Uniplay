# UniPlay

UniPlay is a full-stack sports-facility reservation and student game-lobby platform for Universite ESPRIT. Students can discover sports and terrains, reserve available time slots, create public or private games, invite classmates, and manage their reservations. Administrators and employees have a separate dashboard for managing users, sports, terrains, schedules, reservations, groups, reclamations, and conduct warnings.

The application is composed of:

- **Backend:** Django and Django REST Framework REST API.
- **Frontend:** React single-page application built with Vite.
- **Database:** PostgreSQL.
- **Authentication:** JWT access and refresh tokens.
- **Uploaded files:** Django media files for profile photos, sport icons, and terrain photos.

> The primary interface text is currently in French.

## Features

### Student features

- Register with a student matricule, email, identity details, class, speciality, phone number, sex, date of birth, and optional profile photo.
- Wait for administrator approval before logging in.
- Log in with JWT authentication and refresh an expired access token.
- Request a password reset by email, confirm a reset, and change a password while logged in.
- Browse active sports and their terrains.
- View terrain photos, capacity, status, campus information, opening hours, and available time slots.
- Book a terrain slot and automatically create a game lobby in one operation.
- Choose a public lobby that other students can browse or a private lobby that requires invitations.
- Set the lobby size up to the terrain capacity.
- Invite students by matricule, accept or decline invitations, join public games, leave games, and let the owner remove participants.
- Resize a lobby while respecting current occupancy and terrain capacity.
- Receive notifications for invitations, joins, departures, cancellations, warnings, and other game activity.
- View active games, pending invitations, completed games, cancelled games, and reservation history.
- Cancel eligible reservations. Student cancellation is allowed only at least 12 hours before the slot starts.
- View and edit profile information, upload a profile photo, and send reclamations to the administration.

### Administrator and employee features

- View dashboard statistics for students, reservations, cancellations, and reservation status.
- Approve, deactivate, delete, search, and manage student accounts.
- Manage application administrator status. Superadministrators control administrator role changes.
- View student details and manage student groups.
- Create, edit, deactivate, and manage sports.
- Create and edit terrains, including capacity, slot duration, opening hours, status, and photos.
- Generate current-month and next-month time slots.
- View a monthly planning grid for a selected terrain.
- Search, inspect, cancel, and export global reservations as CSV.
- Read reclamations and inspect the sender's account details.
- Review game groups, participants, notifications, and conduct warnings.

## Architecture

```text
React/Vite frontend (:5173)
        |
        | JSON and multipart HTTP requests
        v
Django REST Framework API (:8000/api)
        |
        +-- JWT authentication
        +-- Accounts and password reset
        +-- Sports, terrains, and time slots
        +-- Reservations and participants
        +-- Games, invitations, and notifications
        +-- Admin dashboard APIs
        |
        v
PostgreSQL (:5432)

Development uploads are served from backend/media/.
```

## Repository structure

```text
UniPlay/
├── backend/
│   ├── manage.py
│   ├── config/                 Django settings, root URLs, ASGI, WSGI
│   ├── apps/accounts/          Users, authentication, password reset, reclamations
│   ├── apps/sports/            Sports, terrains, and public time-slot lookup
│   ├── apps/reservations/      Time slots, reservations, and participants
│   ├── apps/games/             Game lobbies, invitations, and notifications
│   ├── apps/admin_panel/       Admin dashboard API and planning tools
│   └── media/                  Development-uploaded files
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── public/images/          Public fallback and sport images
│   └── src/
│       ├── pages/              Student and admin pages
│       ├── components/         Shared layouts and booking/game components
│       ├── services/           Axios API clients
│       ├── context/             Authentication context
│       └── router/              Protected and admin route guards
├── AI_PROJECT_CONTEXT.md       Technical context for maintainers
└── UNIPLAY_AI_HANDOFF.md       Detailed implementation handoff
```

## Prerequisites

Install the following before starting:

- Windows 10 or later.
- Python 3.12 or newer. The pinned backend dependencies are verified with Python 3.12.4.
- Node.js and npm. Node.js 20 LTS or newer is recommended for the current Vite toolchain.
- PostgreSQL 14 or newer, with the PostgreSQL service running.
- Git.

Backend dependencies are declared in the root `requirements.txt`. The frontend dependencies are declared in `frontend/package.json`. The repository does not currently include an `.env.example` file.

## Clone the project

```powershell
git clone <repository-url>
cd UniPlay
```

Replace `<repository-url>` with the URL of this repository.

## Backend setup

Open PowerShell in the repository root and create a virtual environment if you do not already have one:

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks script activation, use the current terminal only:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

Install the backend dependencies from the repository requirements file:

```powershell
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

The requirements file pins the direct runtime dependencies used by the Django API, including Django REST Framework, JWT authentication, CORS support, OpenAPI documentation, PostgreSQL connectivity, and image processing.

### Create the PostgreSQL database

Create a PostgreSQL database named `UniPlay` and ensure PostgreSQL is listening on `localhost:5432`.

Using `psql` as a PostgreSQL administrator:

```sql
CREATE DATABASE "UniPlay";
```

The current local settings use the PostgreSQL user `postgres`. The database connection values are defined in `backend/config/settings.py`. Before sharing or deploying the project, move the database password, Django secret key, allowed hosts, and email credentials into environment variables. Do not commit real credentials.

### Configure the backend

The live settings currently assume:

| Setting | Development value |
|---|---|
| Database engine | PostgreSQL |
| Database name | `UniPlay` |
| Database host | `localhost` |
| Database port | `5432` |
| API server | `127.0.0.1:8000` |
| Frontend URL | `http://localhost:5173` |
| Media URL | `/media/` |
| Time zone | UTC |

Password reset uses Gmail SMTP in the current settings. Configure a valid sender and Gmail app password in `backend/config/settings.py` or, preferably, replace those values with environment variables. If email is not configured, the rest of the local application can still be used, but password-reset email delivery will not work.

Apply migrations and create an initial Django superuser:

```powershell
cd backend
python manage.py migrate
python manage.py createsuperuser
python manage.py check
```

The application-level admin dashboard uses the custom `is_admin` field on `accounts.User`. A Django superuser is useful for `/admin/`, but you may also need to mark an application user as `is_admin=True` through Django admin or the database before that user can access `/admin` in the React application.

Start the API:

```powershell
python manage.py runserver 127.0.0.1:8000
```

Keep this terminal running. The API will be available at `http://127.0.0.1:8000/`.

## Frontend setup

Open a second PowerShell terminal:

```powershell
cd frontend
npm install
```

Create `frontend/.env` with:

```dotenv
VITE_API_URL=/api
```

This value makes Axios call the `/api` prefix and lets Vite proxy API requests to `http://127.0.0.1:8000` during development. A direct backend URL can be used instead, for example `VITE_API_URL=http://127.0.0.1:8000/api`, provided the backend CORS configuration allows the frontend origin.

Start the frontend:

```powershell
npm run dev
```

Open `http://localhost:5173` in a browser.

Useful frontend commands:

```powershell
npm run build
npm run preview
npm run lint
```

## First-use workflow

1. Open `http://localhost:5173/register`.
2. Create a student account using a matricule and the required profile information.
3. Approve the account from the admin interface or Django admin by setting it active.
4. Log in at `/login`.
5. Create sports and terrains from the admin dashboard if the database is empty.
6. Configure each terrain's opening hours, for example:

   ```json
   {"start": "08:00", "end": "22:00"}
   ```

7. Generate current or next-month slots from the terrain management page.
8. As a student, select a sport, open a terrain, select a time slot, and create a public or private game.
9. Browse public games from `/jeux`, or manage owned games and invitations from `/mes-jeux`.

## Important business rules

- Newly registered accounts are inactive until approved.
- Suspended or deactivated users cannot log in.
- A terrain can be `available`, `maintenance`, or `inactive`.
- Maintenance terrains remain visible but cannot be booked in the student interface.
- A time slot must belong to the selected terrain, must not be in the past, and can have only one confirmed reservation.
- A game lobby cannot exceed the terrain capacity.
- Pending invitations count toward lobby occupancy.
- Only the game owner can resize a lobby or remove another participant.
- Public games can be joined directly; private games require an invitation.
- Student reservation cancellation is allowed only at least 12 hours before the slot starts.
- Cancellations preserve historical reservation and game records instead of deleting them.

## Frontend routes

### Public routes

| Route | Purpose |
|---|---|
| `/login` | Log in |
| `/register` | Request a student account |
| `/forgot-password` | Request a password reset |
| `/reset-password` | Complete a password reset |

### Student routes

| Route | Purpose |
|---|---|
| `/` | Home page, sports, and upcoming reservations |
| `/sports/:sportId` | Terrains and booking entry point |
| `/reservations` | Finished and cancelled reservation history |
| `/profile` | View profile |
| `/parametres/profil` | Edit profile and photo |
| `/parametres/mot-de-passe` | Change password |
| `/parametres/reclamations` | Send a reclamation |
| `/jeux` | Browse public games |
| `/mes-jeux` | Manage games and invitations |
| `/games/:gameId` | Open a game lobby |

### Admin routes

| Route | Purpose |
|---|---|
| `/admin` | Dashboard |
| `/admin/users` | User approval and account management |
| `/admin/students` | Student directory |
| `/admin/groups` | Game group management |
| `/admin/sports` | Sports management |
| `/admin/terrains` | Terrain and slot management |
| `/admin/planning` | Monthly terrain planning |
| `/admin/reservations` | Global reservations and CSV export |
| `/admin/reclamations` | Read student reclamations |

## API overview

All API paths are prefixed with `/api`. Protected requests use:

```http
Authorization: Bearer <access-token>
```

### Authentication and accounts

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/auth/register/` | Create an inactive student account |
| `POST` | `/api/auth/login/` | Obtain access and refresh tokens |
| `POST` | `/api/auth/refresh/` | Refresh an access token |
| `POST` | `/api/auth/logout/` | Blacklist a refresh token |
| `GET` | `/api/auth/me/` | Get the current user |
| `PATCH` | `/api/auth/me/` | Update profile data or photo |
| `GET` | `/api/auth/users/` | List active students for invitations |
| `POST` | `/api/auth/validate-students/` | Validate matricules |
| `POST` | `/api/auth/password-reset/` | Request a reset email |
| `POST` | `/api/auth/password-reset-confirm/` | Set a new password |
| `POST` | `/api/auth/change-password/` | Change the current password |
| `POST` | `/api/auth/reclamations/` | Submit a reclamation |

### Sports and reservations

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/sports/` | List active sports |
| `GET` | `/api/sports/<id>/` | Get a sport and its terrains |
| `GET` | `/api/sports/terrains/` | List visible terrains |
| `GET` | `/api/sports/terrains/<id>/` | Get terrain details |
| `GET` | `/api/sports/terrains/<id>/timeslots/` | List available slots; supports `start_date` and `days` |
| `GET` | `/api/reservations/` | List the current user's reservations |
| `POST` | `/api/reservations/` | Create a reservation with optional participants |
| `GET` | `/api/reservations/<id>/` | Get reservation details |
| `DELETE` | `/api/reservations/<id>/` | Cancel an eligible reservation |

### Games and notifications

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/games/` | Reserve a slot and create a game lobby |
| `GET` | `/api/games/mine/` | List active, pending, historical, and cancelled games |
| `GET` | `/api/games/browse/` | Browse upcoming public games; supports `sport` |
| `GET` | `/api/games/<id>/` | Get a lobby and its participants |
| `POST` | `/api/games/<id>/invite/` | Invite a student |
| `POST` | `/api/games/<id>/accept/` | Accept an invitation |
| `POST` | `/api/games/<id>/decline/` | Decline an invitation |
| `POST` | `/api/games/<id>/join/` | Join a public game |
| `POST` | `/api/games/<id>/leave/` | Leave or, for the owner, manage a participant |
| `POST` | `/api/games/<id>/resize/` | Change the lobby size |
| `GET` | `/api/games/notifications/` | List notifications |
| `POST` | `/api/games/notifications/read/` | Mark notifications as read |
| `DELETE` | `/api/games/notifications/<id>/` | Delete a notification |

### Admin API and documentation

| Endpoint | Purpose |
|---|---|
| `/api/admin/dashboard/stats/` | Dashboard statistics |
| `/api/admin/sports/` | Admin sport CRUD |
| `/api/admin/terrains/` | Admin terrain CRUD and soft deletion |
| `/api/admin/terrains/<id>/generate_slots/` | Generate `current` or `next` slots |
| `/api/admin/planning/` | Monthly planning data |
| `/api/admin/reservations/` | Search and manage reservations |
| `/api/admin/reservations/export_csv/` | Export reservations as CSV |
| `/api/admin/reclamations/` | List and inspect reclamations |
| `/api/admin/groups/` | Manage game groups |
| `/api/schema/swagger-ui/` | Interactive Swagger API documentation |
| `/api/schema/` | OpenAPI schema |

## Validation and checks

From `backend/`:

```powershell
python manage.py check
python manage.py test
```

From `frontend/`:

```powershell
npm run lint
npm run build
```

The current repository contains application test modules, but business-rule coverage is limited. The frontend build and Django system check are useful baseline validations; lint may report pre-existing source issues in the current codebase.

## Troubleshooting

### The frontend cannot reach the API

- Confirm the backend is running on `127.0.0.1:8000`.
- Confirm `frontend/.env` contains `VITE_API_URL=/api`.
- Restart Vite after changing `.env`.
- Check that the browser is using `http://localhost:5173`, which is included in the configured local CORS origins.

### Django cannot connect to PostgreSQL

- Confirm the PostgreSQL service is running.
- Confirm the `UniPlay` database exists.
- Confirm the configured user, password, host, and port in `backend/config/settings.py`.
- Run `python manage.py check` from `backend/` after fixing the connection.

### A student cannot log in after registration

Registration intentionally creates an inactive account. An administrator must approve the account before login is allowed.

### No time slots are available

Create or edit a terrain with valid `opening_hours`, then generate slots for the current or next month. The slot generator expects an object containing `start` and `end`, such as `{ "start": "08:00", "end": "22:00" }`.

### Password reset emails are not delivered

Check the Gmail SMTP configuration, use a Gmail app password, and confirm that the sender account permits SMTP access. Never commit those credentials.

## Security and deployment notes

This repository is configured for local development, not production deployment. Before deploying:

- Move `SECRET_KEY`, database credentials, SMTP credentials, and frontend URLs to environment variables.
- Set `DEBUG=False` and configure `ALLOWED_HOSTS`.
- Configure production CORS and CSRF trusted origins.
- Serve static and media files through a proper web server or object storage.
- Use HTTPS and secure cookie/token handling.
- Review the legacy account and sports admin endpoints, which should be protected consistently before production use.
- Add automated backend tests for permissions, booking races, slot generation, password reset, and game workflows.
- Add frontend end-to-end tests for authentication, booking, invitations, and admin workflows.

## Further documentation

- [AI_PROJECT_CONTEXT.md](AI_PROJECT_CONTEXT.md) contains a maintainer-oriented architecture and behavior guide.
- [UNIPLAY_AI_HANDOFF.md](UNIPLAY_AI_HANDOFF.md) contains a more detailed implementation handoff and current caveats.
- [UNIPLAY_DIAGRAM_GENERATION_SPEC.md](UNIPLAY_DIAGRAM_GENERATION_SPEC.md) documents diagram-generation requirements.
- [UNIPLAY_PRESENTATION_BRIEF.md](UNIPLAY_PRESENTATION_BRIEF.md) contains the presentation brief.