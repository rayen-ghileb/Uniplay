# UniPlay - UML Diagram Generation Specification

## Purpose

Use this document as the source of truth for generating two UML diagrams for the UniPlay application:

1. A **global use case diagram** covering the student experience, administration, authentication, sports/terrain booking, game lobbies, notifications, complaints, and conduct warnings.
2. A **domain class diagram** covering the persistent backend domain model and its important business operations and constraints.

The diagrams should describe the current implemented system. Do not add features merely because they would be useful in a sports-booking application.

## Required Output From The Diagramming AI

Generate both diagrams in a renderable notation, preferably PlantUML. Mermaid is acceptable if PlantUML is unavailable.

Return:

- One complete global use case diagram.
- One complete domain class diagram.
- A short legend explaining actor generalization, include/extend, multiplicities, composition/aggregation, and status enumerations.
- A short list titled `Implementation caveats` for items explicitly marked as caveats below.

Keep the diagrams readable. If the use case diagram becomes too dense, use UML packages inside one global diagram rather than silently omitting use cases. If the class diagram becomes too dense, group classes by package while preserving all cross-package relationships.

## System Boundary

System name: **UniPlay - University sports reservation and game-lobby platform**.

The system is a React frontend backed by a Django REST API. The backend is the authoritative source for authentication, permissions, booking validation, capacity rules, lobby membership, cancellation rules, slot availability, and persistence.

External systems:

- **Email service**: used to send password-reset links.
- **Client browser**: hosts the React application and stores JWT access/refresh tokens locally.
- **Django admin / OpenAPI tooling**: technical infrastructure, not a primary business actor. Include only if the diagram needs to show the technical boundary.

Do not model React pages, Axios, React Query, serializers, or views as domain classes. They may be shown as a secondary implementation note, but the class diagram must focus on business entities.

## Actors

### Primary human actors

- **Visitor / Unauthenticated user**: can register, log in, request a password reset, and confirm a password reset.
- **Student**: an authenticated active user. Can view sports and terrains, inspect available time slots, create reservations or game lobbies, manage their own reservations, join public games, respond to invitations, participate in games, submit complaints, update their profile/password, and manage notifications.
- **Game organizer**: a Student who owns the reservation-backed Game. This is a role played by a Student, not a separate database class. Can invite students, resize the lobby, remove members/invitations, and cancel the game subject to the cancellation rule.
- **Game member**: a Student with a joined GameParticipant record. Can invite other students, leave the game, and receive game notifications.
- **Invited student**: a Student with an invited GameParticipant record. Can accept or decline the invitation.
- **Administrator**: an authenticated user with `is_admin = true`. Can manage users, sports, terrains, slots, reservations, complaints, groups/games, planning, dashboards, and warnings. In the application, administrator access also includes superadministrator and employee accounts through the frontend/admin permission logic.
- **Superadministrator**: an Administrator with `is_superadmin = true`. Has the additional ability to change the application administrator flag on accounts.
- **Employee**: an administration-side user represented by `is_employee = true`. Treat as an administrative actor where the current frontend grants admin access, but preserve the caveat that backend role semantics differ in some places.

Use actor generalization where appropriate:

- Visitor -> Student after authentication is a conceptual transition, not inheritance.
- Administrator may specialize into Superadministrator and Employee for the diagram, but mark these as role distinctions implemented by flags on User.
- Game organizer, game member, and invited student specialize Student as contextual roles, not persistent subclasses.

## Global Use Cases

### A. Authentication and account lifecycle

Visitor / Student:

- Register student account.
- Log in with matricule and password.
- Refresh access token.
- Log out.
- View current profile.
- Edit own profile and upload profile photo.
- Change current password.
- Request password reset.
- Confirm password reset using uid/token.
- Validate student matricules for invitations.

Administrator:

- List/manage user accounts.
- Approve pending account by activating it.
- Deactivate/reactivate account.
- Delete an account when allowed by history/deletion rules.
- Change application admin status when acting as a superadministrator.
- View student-focused user data.
- Issue conduct warning to a student, optionally associated with a game.
- Suspend a student through account-state management.

Authentication relations:

- `Register student account` creates an inactive `User`; approval is required before normal login.
- `Request password reset` includes `Send reset email` to the Email service when an account exists, while returning a generic response to avoid email enumeration.
- `Login` includes account-state checks for pending, deactivated, or suspended accounts.
- Protected operations require authentication.
- Administrative operations require an application-level administrative role; do not assume every URL containing `admin` is protected equally because legacy endpoints exist.

### B. Sports, terrains, and timeslots

Visitor / Student:

- Browse active sports.
- View sport details.
- Browse visible terrains.
- View terrain details.
- Browse terrains belonging to a sport.
- View available time slots for a terrain and date window.

Administrator:

- Create sport.
- Update sport.
- Deactivate sport.
- Create terrain.
- Update terrain.
- Soft-delete/deactivate terrain.
- Generate current-month slots.
- Generate next-month slots.
- View monthly terrain planning grid.

Relations and rules:

- `View available time slots` excludes slots with a confirmed reservation.
- Maintenance terrains remain visible to students but are not bookable in the frontend.
- Inactive terrains are hidden from public lists.
- Deactivating a sport deactivates its terrains and cancels confirmed reservations on those terrains.
- Creating a terrain automatically generates current and next month slots.
- Updating terrain opening hours or duration rebuilds future slots with no reservation history and regenerates slots.
- The planning grid is an administrative visualization, not a booking operation.

### C. Reservations

Student:

- Create a reservation.
- Add invited participants to a reservation.
- List own reservations as organizer or participant.
- View reservation detail as organizer or participant.
- Cancel own reservation.

Administrator:

- View all reservations.
- Search/filter reservations.
- Cancel any reservation.
- Export reservations to CSV.
- View reservation status/history in planning and administration views.

Reservation relations and rules:

- `Create a reservation` includes `Validate terrain/slot compatibility`, `Validate future slot`, `Validate slot availability`, `Validate participant IDs`, and `Validate capacity`.
- A reservation belongs to exactly one Terrain, exactly one TimeSlot, and exactly one organizer User.
- Only one confirmed Reservation may exist for a TimeSlot.
- The organizer is automatically included as the first Participant.
- Duplicate participant IDs are removed; the organizer is removed from submitted invitations; the participant count cannot exceed Terrain capacity.
- Student cancellation is restricted to the organizer and is allowed only more than 12 hours before the slot starts.
- Cancellation changes status to `cancelled`; it does not delete the historical Reservation.
- Admin cancellation can cancel any reservation through the dedicated admin API.

### D. Game lobbies

Student / Game organizer:

- Create public or private game lobby while booking a terrain slot.
- View own games grouped as active, pending, history, or cancelled.
- View a game lobby.
- Invite an active student.
- Resize lobby.
- Remove a joined participant.
- Cancel game by leaving as organizer.

Student / Game member:

- Browse upcoming public games.
- Filter public games by sport.
- Join a public game.
- Leave a game voluntarily.
- Invite another student.

Invited student:

- View invitation.
- Accept game invitation.
- Decline game invitation.

Administrator:

- View game/group summaries and members.
- View warning counts for group members.

Game relations and rules:

- `Create game lobby` includes `Create confirmed reservation`; both are created atomically in one operation.
- Every Game has exactly one Reservation through a one-to-one relationship.
- The reservation organizer is the conceptual game owner and is initially a joined GameParticipant.
- Public games can be joined directly. Private games require an invitation.
- Invitations reserve lobby capacity immediately; both `invited` and `joined` participants count as occupied.
- Lobby size `max_players` is bounded by current occupancy and Terrain capacity.
- Only the organizer can resize the lobby or remove another participant.
- An organizer cannot remove themself; leaving as organizer cancels the backing Reservation and preserves the lobby history.
- A joined member may leave voluntarily; the corresponding legacy reservation Participant record is removed.
- Invitations can be accepted or declined. Acceptance changes status to joined; decline removes the GameParticipant record and frees the spot.
- Games cannot be modified after cancellation or after their timeslot has ended.
- A game is considered cancelled when its Reservation is cancelled and finished when the timeslot has ended.

### E. Notifications and complaints

Student:

- View own notifications.
- Mark one notification read.
- Mark all notifications read.
- Delete own notification.
- Submit complaint/reclamation.

Administrator:

- List complaints/reclamations.
- View complaint details and sender profile data.
- Receive administration-side notifications for new bookings, booking cancellations, and relevant game events.

Notification events include:

- invited
- kicked
- game_cancelled
- invite_accepted
- invite_declined
- member_left
- member_joined
- booking_created
- booking_cancelled
- warning

## Backend Domain Classes

Use these classes in the main class diagram. Fields below are the meaningful model fields; framework-generated primary keys may be shown as `id: Integer` on every class or omitted consistently.

### User (custom Django user)

Attributes:

- `id: Integer`
- `username: String` - unique matricule/login identifier
- `email: String` - unique
- `password: String` - stored hashed by Django
- `first_name: String`
- `last_name: String`
- `phone_number: String`
- `classe: String`
- `specialite: String`
- `sex: Sex`
- `date_of_birth: Date`
- `photo: Image?`
- `is_active: Boolean`
- `is_admin: Boolean`
- `is_superadmin: Boolean`
- `is_employee: Boolean`
- `is_deactivated: Boolean`
- `is_suspended: Boolean`
- `show_reactivation_warning: Boolean`
- `date_joined: DateTime`

Important operations/useful domain behaviors:

- `canLogin(): Boolean` - conceptually false for inactive, deactivated, or suspended accounts.
- `updateProfile(...)`
- `changePassword(...)`

Do not model role flags as database subclasses unless explicitly labeling them as conceptual roles.

### Sport

Attributes:

- `id: Integer`
- `name: String` - unique
- `description: Text`
- `icon: Image?`
- `is_active: Boolean`

Operations:

- `deactivate()` - also causes related terrains to become inactive and confirmed reservations on them to be cancelled through the admin workflow.

### Terrain

Attributes:

- `id: Integer`
- `name: String`
- `capacity: Integer`
- `slot_duration: Integer` - minutes, default 60
- `photo: Image?`
- `status: TerrainStatus`
- `opening_hours: JSON`
- `sport: Sport`

Operations:

- `isBookable(): Boolean` - available status is required; maintenance/inactive are not bookable.
- `generateSlots(target: SlotGenerationTarget)` - implemented by the admin workflow.
- `deactivate()` - soft delete.

### TimeSlot

Attributes:

- `id: Integer`
- `date: Date`
- `start_time: Time`
- `end_time: Time`
- `is_available: Boolean`
- `terrain: Terrain`

Constraints:

- Unique `(terrain, date, start_time, end_time)`.
- Ordered by date and start time.
- A slot is publicly selectable only when it has no confirmed reservation.

### Reservation

Attributes:

- `id: Integer`
- `created_at: DateTime`
- `status: ReservationStatus`
- `terrain: Terrain`
- `timeslot: TimeSlot`
- `organizer: User`

Operations:

- `canCancel(): Boolean` - confirmed and at least 12 hours before the slot start.
- `cancel()` - changes status to cancelled and preserves history.
- `isFinished(): Boolean` - derived from the slot end time.

Constraints:

- Unique confirmed reservation per `timeslot`.
- `timeslot.terrain` must equal `terrain`.
- The slot cannot be in the past when creating a reservation.

### Participant (legacy reservation participant record)

Attributes:

- `id: Integer`
- `first_name: String` - snapshot
- `last_name: String` - snapshot
- `added_at: DateTime`
- `reservation: Reservation`
- `student: User`

Constraints:

- Unique `(reservation, student)`.
- Organizer is normally represented as the first participant.

Note: The application currently has both this reservation-level participant table and the game-level `GameParticipant` table. Preserve both in the diagram and show their separate purposes.

### Game

Attributes:

- `id: Integer`
- `is_public: Boolean`
- `max_players: Integer`
- `created_at: DateTime`
- `reservation: Reservation` - one-to-one

Operations:

- `occupiedCount(): Integer` - counts invited and joined participants.
- `isFull(): Boolean`
- `isCancelled(): Boolean` - derived from reservation status.
- `isFinished(): Boolean` - derived from timeslot end.
- `resize(newSize: Integer)` - owner-only, bounded by occupancy and terrain capacity.
- `cancelByOrganizer()` - cancels the backing reservation when allowed.

### GameParticipant

Attributes:

- `id: Integer`
- `status: GameParticipantStatus`
- `invited_at: DateTime`
- `joined_at: DateTime?`
- `game: Game`
- `student: User`
- `invited_by: User?`

Constraints:

- Unique `(game, student)`.
- `invited` and `joined` both occupy lobby capacity.

### Notification

Attributes:

- `id: Integer`
- `kind: NotificationKind`
- `game_label: String` - snapshot label for resilience if a game is deleted
- `is_read: Boolean`
- `created_at: DateTime`
- `recipient: User`
- `actor: User?`
- `game: Game?`

Operations:

- `markRead()`
- `deleteForRecipient()`

### Reclamation

Attributes:

- `id: Integer`
- `message: Text`
- `created_at: DateTime`
- `sender: User`

### Warning

Attributes:

- `id: Integer`
- `message: Text`
- `created_at: DateTime`
- `recipient: User`
- `issued_by: User?`
- `game: Game?`

Purpose:

- Records an administrative conduct warning for a student, optionally related to a game.
- Warning count is displayed in the admin group/member view.
- Suspension is stored on User; do not invent a separate Suspension class.

## Enumerations

Show these as UML enums or constrained attributes:

```text
Sex = F | M | O
TerrainStatus = available | maintenance | inactive
ReservationStatus = confirmed | cancelled
GameParticipantStatus = invited | joined
NotificationKind = invited | kicked | game_cancelled | invite_accepted | invite_declined | member_left | member_joined | booking_created | booking_cancelled | warning
SlotGenerationTarget = current | next
```

The admin reservation serializer may expose a derived display status `finished` when a confirmed reservation's slot has ended. `finished` is a presentation/derived status, not a stored Reservation status.

## Class Relationships And Multiplicities

The generated class diagram must show at least these relationships:

- `Sport 1 o-- 0..* Terrain`
- `Terrain 1 o-- 0..* TimeSlot`
- `Terrain 1 o-- 0..* Reservation`
- `TimeSlot 1 <-- 0..* Reservation`, with at most one confirmed reservation enforced by a conditional uniqueness constraint
- `User 1 <-- 0..* Reservation` as organizer
- `Reservation 1 *-- 0..* Participant`
- `User 1 <-- 0..* Participant`
- `Reservation 1 *-- 0..1 Game` because Game has a one-to-one reservation link; in normal game creation it is exactly one
- `Game 1 *-- 0..* GameParticipant`
- `User 1 <-- 0..* GameParticipant` as student
- `User 1 <-- 0..* GameParticipant` as invited_by, optional
- `User 1 <-- 0..* Reclamation` as sender
- `User 1 <-- 0..* Warning` as recipient
- `User 1 <-- 0..* Warning` as issuer, optional because the issuer uses SET_NULL on deletion
- `Game 1 <-- 0..* Warning` optional association
- `User 1 <-- 0..* Notification` as recipient
- `User 1 <-- 0..* Notification` as actor, optional
- `Game 1 <-- 0..* Notification` optional association with SET_NULL behavior

Clarify in labels that `Participant` and `GameParticipant` are separate association entities.

## API Surface To Support Use Cases

Use these endpoints as evidence for use cases and actor permissions. Paths are relative to `/api`.

### Accounts

- `POST /auth/register/`
- `POST /auth/login/`
- `POST /auth/refresh/`
- `POST /auth/logout/`
- `GET/PATCH /auth/me/`
- `GET /auth/users/`
- `POST /auth/validate-students/`
- `POST /auth/password-reset/`
- `POST /auth/password-reset-confirm/`
- `POST /auth/change-password/`
- `POST /auth/reclamations/`
- `GET/PATCH/DELETE /auth/admin/users/` and `/auth/admin/users/<id>/`
- `GET /auth/admin/students/`

### Sports and reservations

- `GET /sports/`
- `GET /sports/<id>/`
- `GET /sports/terrains/`
- `GET /sports/terrains/<id>/`
- `GET /sports/<sport_id>/terrains/`
- `GET /sports/terrains/<terrain_id>/timeslots/`
- `GET/POST /reservations/`
- `GET/DELETE /reservations/<id>/`

### Games

- `POST /games/`
- `GET /games/mine/`
- `GET /games/browse/`
- `GET /games/<id>/`
- `POST /games/<id>/invite/`
- `POST /games/<id>/accept/`
- `POST /games/<id>/decline/`
- `POST /games/<id>/join/`
- `POST /games/<id>/leave/`
- `POST /games/<id>/resize/`
- `GET /games/notifications/`
- `POST /games/notifications/read/`
- `DELETE /games/notifications/<id>/`

### Administration

- `GET /admin/dashboard/stats/`
- CRUD `/admin/sports/`
- CRUD `/admin/terrains/`
- `POST /admin/terrains/<id>/generate_slots/`
- `GET /admin/planning/`
- CRUD/search `/admin/reservations/`
- `POST /admin/reservations/<id>/cancel/`
- `GET /admin/reservations/export_csv/`
- CRUD `/admin/reclamations/`
- CRUD `/admin/groups/`
- `POST /admin/students/<student_id>/warn/`
- `POST /admin/students/<student_id>/warn/<game_id>/`

## Frontend Evidence And User-Facing Areas

Use the frontend only to confirm user-facing workflows and navigation. The important areas are:

- Public authentication pages: login, registration, forgot password, reset password.
- Student pages: home, sport detail, reservations, profile/settings, complaints, public games, own games, game lobby.
- Admin pages: dashboard, users/students, sports, terrains, planning, reservations, complaints, groups.
- `BookingModal`: selects a timeslot and optional reservation participants.
- `GameLobby`: invite, join, accept, decline, leave/kick, and resize actions.
- `AuthContext`, `ProtectedRoute`, and `AdminRoute`: authentication restoration and role-based navigation.

The frontend uses JWT access/refresh tokens and React Query for server state; these are implementation details and should not become business-domain classes.

## Explicit Implementation Caveats

Include these as a short note after the diagrams, not as extra invented use cases:

1. The application contains both dedicated `/api/admin/` endpoints and legacy `/api/auth/admin/...` or `/api/sports/admin/...` endpoints. Permissions are not uniform across all legacy routes; the use case diagram should describe intended roles while the caveat acknowledges this implementation difference.
2. The application-level admin decision uses role flags (`is_admin`, `is_superadmin`, `is_employee`) and is not identical to Django `is_staff` or `is_superuser`.
3. `Reservation.status` stores only `confirmed` and `cancelled`; `finished` is derived from the timeslot end time for display.
4. `Game` is not an independent scheduled event: it is backed by exactly one Reservation and therefore one Terrain and TimeSlot.
5. `Participant` is a legacy reservation association kept in sync by game operations; `GameParticipant` is the lobby membership association.
6. Some repository tests are empty, so the diagrams should reflect implemented code and documented rules, not imply comprehensive automated verification.
7. Public terrain timeslot lookup and frontend date-window behavior have an inclusive date-window detail; this does not change the domain relationship.
8. Password reset intentionally avoids revealing whether an email belongs to an account.

## Suggested Diagram Naming

Use these titles:

- `UniPlay Global Use Case Diagram`
- `UniPlay Domain Class Diagram`

Use consistent names in English even if the UI labels are French. Preserve the exact stored status values in code formatting, for example `confirmed`, `cancelled`, `invited`, and `joined`.
