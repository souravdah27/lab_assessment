# Campus Service Request API

REST API for reporting and managing campus service issues. It uses Node.js, Express, MongoDB/Mongoose, JWT, and bcrypt.

## Requirements

- Node.js 18 or newer
- MongoDB (local or hosted)

## Setup

1. Install packages with `npm install`.
2. Copy `.env.example` to `.env` and set `MONGODB_URI` and a long random `JWT_SECRET`.
3. Start MongoDB, then run `npm run dev`.
4. Create an administrator with the `ADMIN_*` values in `.env`, then run `npm run seed:admin`. Public registration always creates a student account, so users cannot grant themselves admin access.
5. Run the focused workflow tests with `npm test`.

The API listens on `http://localhost:3000` by default. `GET /api/health` is a public health check. Protected routes take `Authorization: Bearer <token>`.

## API

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Public | Register a student (`name`, `email`, `password`, `department`) |
| POST | `/api/auth/login` | Public | Authenticate and receive a JWT |
| POST | `/api/requests` | Student | Create a request (`title`, `description`, `category`) |
| GET | `/api/requests` | Student/Admin | List requests; students see only their own |
| GET | `/api/requests/:id` | Owner/Admin | View request details |
| PUT | `/api/requests/:id` | Owner | Edit title, description, or category while Pending |
| DELETE | `/api/requests/:id` | Owner/Admin | Students can delete their own Pending request; admins can delete any |
| PUT | `/api/requests/:id/status` | Admin | Advance status and optionally set priority |
| PUT | `/api/requests/:id/assign` | Admin | Assign to an admin account; assigning an Under Review request advances it to Assigned |
| PUT | `/api/requests/:id/response` | Admin | Add an admin response |
| GET | `/api/admin/dashboard` | Admin | Aggregated request statistics |

Supported categories: `computer`, `classroom-equipment`, `internet`, `hostel-maintenance`, `electrical`, `library`, `other`. Priorities are `Low`, `Medium`, `High`.

The status path is `Pending → Under Review → Assigned → In Progress → Resolved → Closed`. `Pending` and `Under Review` may also transition to `Rejected`. Other jumps, backward transitions, and changes from terminal states are rejected. An admin must be assigned before a request can enter `Assigned`.

### Request filters

`GET /api/requests` accepts `status`, `priority`, `category`, and `search` query parameters. Search is case-insensitive across title and description. Pagination uses `page` (default `1`) and `limit` (default `20`, maximum `100`). For example:

```text
GET /api/requests?status=In%20Progress&priority=High&search=internet&page=1&limit=10
```

### Errors

Errors use JSON with a clear `message`. Invalid inputs return `400`, unauthenticated requests `401`, forbidden operations `403`, missing requests `404`, and duplicate emails `409`.

### Admin provisioning note

The assignment defines only `student` and `admin` roles, so admin accounts are used as staff assignees. Create an initial admin using the local seed script rather than exposing public admin registration.
