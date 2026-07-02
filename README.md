# UniPlay - Sports Terrain Reservation Platform

## Project Overview

UniPlay is a full-stack web application designed for Université ESPRIT to modernize and streamline the booking of sports terrains. The platform enables students to easily reserve sports facilities (Padel, Football, Basketball) online while providing administrators with comprehensive management tools.

**Version:** 1.0  
**Status:** Development  
**Last Updated:** July 2026

---

## Technology Stack

### Backend
- **Framework:** Django 6.0+
- **API:** Django REST Framework (DRF)
- **Database:** PostgreSQL
- **Authentication:** JWT (JSON Web Tokens) via djangorestframework-simplejwt
- **CORS:** django-cors-headers
- **Documentation:** drf-spectacular
- **Image Processing:** Pillow
- **Environment:** python-dotenv

### Frontend
- **Framework:** React.js 19+
- **Build Tool:** Vite
- **HTTP Client:** Axios
- **State Management:** TanStack React Query
- **Form Handling:** React Hook Form
- **Routing:** React Router v6
- **Styling:** TailwindCSS 3
- **Linting:** ESLint
- **Formatting:** Prettier

### Database
- **DBMS:** PostgreSQL
- **Client Tools:** pgAdmin, DBeaver

---

## Architecture

### Overall Design
UniPlay follows a **Client-Server architecture** with a **decoupled frontend and backend**:

```
┌─────────────────────────┐
│   React Frontend (SPA)   │
│  - Pages, Components     │
│  - State Management      │
│  - Routing               │
└────────────┬────────────┘
             │
             │ HTTP/REST API
             │ JSON
             │
┌────────────▼────────────┐
│   Django Backend        │
│  - Models, Views        │
│  - Business Logic       │
│  - Authentication       │
└────────────┬────────────┘
             │
             │ SQL Queries
             │
┌────────────▼────────────┐
│    PostgreSQL DB        │
│  - Tables, Constraints  │
│  - Data Persistence     │
└─────────────────────────┘
```

### Backend Architecture - MTV (Modified MVC)
- **Models** (`models.py`): Database schema and business entities
- **Views** (`views.py`): Request handlers and business logic (Controller layer)
- **Templates/Serializers** (`serializers.py`): Data validation and JSON transformation
- **URLs** (`urls.py`): Route mapping to views

---

## Project Structure

```
UniPlay/
├── backend/
│   ├── config/
│   │   ├── settings.py           # Django settings
│   │   ├── urls.py               # Root URL configuration
│   │   ├── asgi.py               # ASGI application
│   │   └── wsgi.py               # WSGI application
│   │
│   ├── apps/
│   │   ├── accounts/
│   │   │   ├── models.py         # User model
│   │   │   ├── serializers.py    # User serializers
│   │   │   ├── views.py          # Auth views (login, logout, profile)
│   │   │   ├── urls.py           # Auth routes
│   │   │   ├── permissions.py    # Custom permissions
│   │   │   ├── admin.py          # Django admin config
│   │   │   ├── apps.py           # App configuration
│   │   │   └── migrations/       # Database migrations
│   │   │
│   │   ├── sports/
│   │   │   ├── models.py         # Sport, Terrain models
│   │   │   ├── serializers.py    # Sport/Terrain serializers
│   │   │   ├── views.py          # Sports/Terrains API views
│   │   │   ├── urls.py           # Sports routes
│   │   │   ├── admin.py          # Django admin
│   │   │   ├── apps.py           # App config
│   │   │   └── migrations/       # DB migrations
│   │   │
│   │   ├── reservations/
│   │   │   ├── models.py         # TimeSlot, Reservation, Participant
│   │   │   ├── serializers.py    # Reservation serializers
│   │   │   ├── views.py          # Booking API views
│   │   │   ├── urls.py           # Reservation routes
│   │   │   ├── permissions.py    # Booking permissions
│   │   │   ├── admin.py          # Django admin
│   │   │   ├── apps.py           # App config
│   │   │   └── migrations/       # DB migrations
│   │   │
│   │   ├── admin_panel/
│   │   │   ├── views.py          # Admin dashboard views
│   │   │   ├── serializers.py    # Admin serializers
│   │   │   ├── urls.py           # Admin routes
│   │   │   └── permissions.py    # Admin permissions
│   │   │
│   │   └── common/
│   │       ├── permissions.py    # Shared permissions
│   │       ├── pagination.py     # Pagination classes
│   │       ├── exceptions.py     # Custom exceptions
│   │       └── utils.py          # Utility functions
│   │
│   ├── manage.py                 # Django CLI
│   ├── requirements.txt          # Python dependencies
│   └── .env                      # Environment variables
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── HomePage.jsx
│   │   │   ├── SportPage.jsx
│   │   │   ├── TerrainPage.jsx
│   │   │   ├── ReservationPage.jsx
│   │   │   ├── MyReservationsPage.jsx
│   │   │   └── AdminDashboard.jsx
│   │   │
│   │   ├── components/
│   │   │   ├── SportWidget.jsx
│   │   │   ├── TerrainCard.jsx
│   │   │   ├── Calendar.jsx
│   │   │   ├── ReservationForm.jsx
│   │   │   ├── ParticipantInput.jsx
│   │   │   └── AdminTable.jsx
│   │   │
│   │   ├── services/
│   │   │   ├── api.js            # Axios instance and API calls
│   │   │   └── auth.js           # JWT token management
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Global auth state
│   │   │
│   │   ├── router/
│   │   │   └── ProtectedRoute.jsx # Auth-guarded routes
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   └── useReservation.js
│   │   │
│   │   ├── styles/
│   │   │   ├── index.css
│   │   │   └── tailwind.css
│   │   │
│   │   ├── assets/
│   │   │   └── images/
│   │   │
│   │   └── App.jsx
│   │
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .gitignore
│
├── .gitignore                    # Root git ignore
├── README.md                     # This file
└── .env.example                  # Environment template

```

---

## Database Models

### 1. User (Accounts App)
Extends Django's `AbstractUser` for custom authentication.

**Fields:**
- `id` (Primary Key)
- `username` (String, unique) - Student matricule
- `email` (Email, unique)
- `first_name` (String)
- `last_name` (String)
- `is_admin` (Boolean) - Custom admin flag
- `is_active` (Boolean) - Account status
- `password` (Hashed)

**Relationships:**
- `organized_reservations` → Reservation (one-to-many)
- `participations` → Participant (one-to-many)

---

### 2. Sport (Sports App)
Represents a sport type (Padel, Football, Basketball).

**Fields:**
- `id` (Primary Key)
- `name` (String, unique) - Sport name
- `description` (Text) - Detailed description
- `icon` (Image) - Sport icon/logo
- `is_active` (Boolean) - Availability flag

**Relationships:**
- `terrains` → Terrain (one-to-many)

---

### 3. Terrain (Sports App)
Represents a physical sports facility.

**Fields:**
- `id` (Primary Key)
- `name` (String)
- `sport_id` (Foreign Key) → Sport
- `capacity` (Integer) - Max participants
- `photo` (Image)
- `status` (Choice: AVAILABLE, MAINTENANCE, INACTIVE)
- `opening_hours` (JSON) - Day-by-day schedule

**Relationships:**
- `sport` → Sport (many-to-one)
- `timeslots` → TimeSlot (one-to-many)
- `reservations` → Reservation (one-to-many)

**Example opening_hours JSON:**
```json
{
  "monday": ["08:00", "22:00"],
  "tuesday": ["08:00", "22:00"],
  "wednesday": ["08:00", "22:00"],
  "thursday": ["08:00", "22:00"],
  "friday": ["08:00", "22:00"],
  "saturday": ["09:00", "20:00"],
  "sunday": null
}
```

---

### 4. TimeSlot (Reservations App)
Represents an available booking window for a terrain.

**Fields:**
- `id` (Primary Key)
- `terrain_id` (Foreign Key) → Terrain
- `date` (Date)
- `start_time` (Time)
- `end_time` (Time)
- `is_available` (Boolean) - Availability status

**Constraints:**
- Unique per terrain/date/start_time/end_time window
- `start_time < end_time`

**Relationships:**
- `terrain` → Terrain (many-to-one)
- `reservations` → Reservation (one-to-many)

---

### 5. Reservation (Reservations App)
Represents a confirmed booking.

**Fields:**
- `id` (Primary Key)
- `terrain_id` (Foreign Key) → Terrain
- `timeslot_id` (Foreign Key) → TimeSlot
- `organizer_id` (Foreign Key) → User
- `created_at` (DateTime, auto-set)
- `status` (Choice: CONFIRMED, CANCELLED)

**Constraints:**
- Unique per timeslot (one booking per timeslot)

**Relationships:**
- `terrain` → Terrain (many-to-one)
- `timeslot` → TimeSlot (many-to-one)
- `organizer` → User (many-to-one)
- `participants` → Participant (one-to-many)

---

### 6. Participant (Reservations App)
Represents a student invited to play in a reservation.

**Fields:**
- `id` (Primary Key)
- `reservation_id` (Foreign Key) → Reservation
- `student_id` (Foreign Key) → User
- `first_name` (String) - Snapshot for booking history
- `last_name` (String) - Snapshot for booking history
- `added_at` (DateTime, auto-set)

**Constraints:**
- Unique per reservation/student (no duplicates)

**Relationships:**
- `reservation` → Reservation (many-to-one)
- `student` → User (many-to-one)

---

## API Endpoints

### Authentication (`/api/auth/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login/` | User login, returns JWT tokens |
| POST | `/api/auth/refresh/` | Refresh access token |
| POST | `/api/auth/logout/` | Logout and blacklist token |
| GET | `/api/auth/me/` | Get current user profile |

---

### Sports & Terrains (`/api/sports/`, `/api/terrains/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sports/` | List all active sports |
| GET | `/api/sports/{id}/terrains/` | List terrains for a sport |
| GET | `/api/terrains/` | List all terrains |
| GET | `/api/terrains/{id}/` | Get terrain details |
| GET | `/api/terrains/{id}/timeslots/` | Get available timeslots |

---

### Reservations (`/api/reservations/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reservations/` | List user's reservations |
| POST | `/api/reservations/` | Create new reservation |
| GET | `/api/reservations/{id}/` | Get reservation details |
| DELETE | `/api/reservations/{id}/` | Cancel reservation |
| POST | `/api/users/validate-ids/` | Validate participant IDs |

---

### Administration (`/api/admin/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/admin/sports/` | List/Create sports |
| PUT/DELETE | `/api/admin/sports/{id}/` | Update/Delete sport |
| GET/POST | `/api/admin/terrains/` | List/Create terrains |
| PUT/DELETE | `/api/admin/terrains/{id}/` | Update/Delete terrain |
| GET | `/api/admin/reservations/` | List all reservations (filterable) |
| DELETE | `/api/admin/reservations/{id}/` | Cancel reservation (admin) |
| GET | `/api/admin/stats/` | Dashboard statistics & KPIs |

---

## User Flows

### Student Reservation Flow
1. Student logs in with matricule + password
2. Dashboard displays 3 sport widgets (Padel, Football, Basketball)
3. Student clicks sport → sees available terrains
4. Student selects terrain → sees weekly/daily calendar
5. Student picks available timeslot → reservation form opens
6. Student enters participant IDs (backend validates)
7. System confirms reservation is created
8. Organizer automatically added as first participant
9. Other participants invited and notified

### Admin Management Flow
1. Admin logs in with admin account
2. Accesses admin dashboard with KPIs
3. Can CRUD sports, terrains, timeslots
4. Can view all reservations
5. Can cancel reservations
6. Can export reservation data (CSV/Excel)
7. Can manage student accounts (activate/deactivate)

---

## Security Features

- **JWT Authentication:** Stateless token-based auth with configurable expiration
- **Password Hashing:** bcrypt via Django's built-in system
- **CSRF Protection:** Django middleware
- **XSS Prevention:** React's built-in escaping + Django templates
- **SQL Injection Prevention:** Django ORM parameterized queries
- **HTTPS/TLS:** Required for production (TLS 1.2+)
- **Data Isolation:** Students see only their own reservations
- **Audit Logging:** Admin actions tracked (optional)

---

## Performance Requirements

| Metric | Target |
|--------|--------|
| Homepage load time | < 2 seconds |
| API response time (CRUD) | < 500 ms |
| Concurrent users | > 200 |
| Uptime | > 99.5% |

---

## Setup Instructions

### Backend Setup

1. **Navigate to backend folder:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv .venv
   .venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment:**
   Create `.env` in backend folder:
   ```
   DEBUG=True
   SECRET_KEY=your-secret-key-here
   DATABASE_URL=postgresql://user:password@localhost:5432/UniPlay
   ```

5. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

6. **Create superuser:**
   ```bash
   python manage.py createsuperuser
   ```

7. **Run development server:**
   ```bash
   python manage.py runserver
   ```

---

### Frontend Setup

1. **Navigate to frontend folder:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   Create `.env.local`:
   ```
   VITE_API_URL=http://localhost:8000/api
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

---

## Testing

### Backend
```bash
python manage.py test
```

### Frontend
```bash
npm test
```

---

## Deployment

### Backend (Django)
- Use Gunicorn + Nginx
- PostgreSQL hosted on cloud (AWS RDS, Heroku, etc.)
- Static files served via whitenoise or CDN
- Environment variables via `.env`

### Frontend (React)
- Build: `npm run build`
- Deploy to Vercel, Netlify, or static hosting
- Set API endpoint to production backend

---

## Contributing Guidelines

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit with clear messages: `git commit -m "Add feature X"`
3. Push to branch: `git push origin feature/your-feature`
4. Open pull request for review

---

## Development Roadmap

**Phase 1 (Current):** MVP with core booking functionality  
**Phase 2:** Payment integration + notifications  
**Phase 3:** Mobile app (React Native)  
**Phase 4:** Analytics dashboard + advanced filtering  
**Phase 5:** AI-powered recommendations  

---

## Troubleshooting

### Django won't start
- Check PostgreSQL is running: `psql -U postgres`
- Verify DB credentials in settings.py
- Run `python manage.py check`

### Migrations fail
- Ensure migrations folder has `__init__.py`
- Run `python manage.py makemigrations`
- Check for model import errors

### CORS errors
- Verify `django-cors-headers` is in `INSTALLED_APPS`
- Check `CORS_ALLOWED_ORIGINS` in settings.py includes frontend URL

### React won't connect to API
- Verify backend is running on `http://localhost:8000`
- Check `.env.local` has correct `VITE_API_URL`
- Open browser DevTools → Network tab to inspect requests

---

## License

Internal Project - Université ESPRIT

---

## Contact & Support

**Project Owner:** Université ESPRIT  
**Development Team:** [Your Name]  
**Last Updated:** July 2, 2026

For questions or issues, please contact the development team or create an issue on GitHub.
