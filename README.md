# Task Manager — Full-Stack Application

A full-stack task management application with role-based access control, built with Node.js, Express, React, and TypeScript.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Authentication & Authorization](#authentication--authorization)
- [Database](#database)
- [Testing](#testing)
- [Seed Data](#seed-data)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Design Decisions](#design-decisions)
- [License](#license)

---

## Overview

A task management system supporting multi-user workflows with admin and user roles. Users can create, assign, track, and manage tasks with filtering, sorting, pagination, and search capabilities. The application enforces strict validation, consistent error handling, and role-based access control throughout.

### Key Features

- User registration and JWT-based authentication
- Role-based access control (Admin / User)
- Full task CRUD with ownership and assignment logic
- Server-side pagination, filtering, sorting, and search
- Field-level validation with consistent error responses
- Responsive UI with loading states and error handling
- Protected routes with automatic auth redirection

---

## Tech Stack

| Layer      | Technology                                      |
|------------|------------------------------------------------|
| Frontend   | React 18, TypeScript, Vite, Tailwind CSS       |
| Backend    | Node.js, Express, TypeScript                    |
| Database   | SQLite (better-sqlite3)                         |
| Auth       | JWT (jsonwebtoken), bcrypt                      |
| Testing    | Jest, Supertest                                 |
| Tooling    | Concurrently, ESLint, Prettier                  |

---

## Architecture

The application follows a **monorepo** structure with clearly separated backend and frontend packages.

**Backend** uses a layered architecture:

```
Routes → Controllers → Services → Database
```

- **Routes** define endpoints and wire middleware (auth, validation)
- **Controllers** handle HTTP request/response — thin, no business logic
- **Services** contain business logic, ownership checks, and database queries
- **Validators** are standalone pure functions, decoupled from Express
- **Middleware** handles cross-cutting concerns (auth, error handling, logging)
- **Error classes** form a hierarchy that the central error handler maps to HTTP responses

**Frontend** uses a feature-based structure:

- **Context API** for auth state (no prop-drilling)
- **Custom hooks** (`useTasks`, `useTask`, `useUsers`) for data fetching and state
- **Axios interceptors** for automatic token attachment and 401 handling
- **Protected routes** redirect unauthenticated users to login

---

## Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x

No external database installation required — SQLite runs as an embedded file-based database.

---

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd task_manager_full_stack
```

### 2. Install dependencies

```bash
# Install root dependencies (concurrently)
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 3. Configure environment (optional)

Copy the example environment file for the backend:

```bash
cp backend/.env.example backend/.env
```

The application runs with sensible defaults — environment configuration is optional for local development.

### 4. Start the application

```bash
# From the root directory — starts both backend and frontend
npm run dev
```

This will start:
- **Backend** at `http://localhost:3001`
- **Frontend** at `http://localhost:3000`

The database is created automatically on first run. Migrations execute on startup and seed data is inserted if the database is empty.

### 5. Open the application

Navigate to `http://localhost:3000` in your browser.

---

## Project Structure

```
task_manager_full_stack/
├── backend/
│   ├── src/
│   │   ├── server.ts              # Entry point
│   │   ├── app.ts                 # Express app setup
│   │   ├── config/                # Environment configuration
│   │   ├── database/
│   │   │   ├── connection.ts      # SQLite singleton
│   │   │   ├── migrations/        # Versioned SQL + runner
│   │   │   └── seed.ts            # Initial data
│   │   ├── errors/                # AppError class hierarchy
│   │   ├── middleware/            # Auth, validation, error handler, logger
│   │   ├── validators/           # Request validation schemas
│   │   ├── controllers/          # HTTP handlers
│   │   ├── services/             # Business logic
│   │   ├── routes/               # Route definitions
│   │   └── types/                # TypeScript type definitions
│   ├── tests/                    # Integration tests
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx               # Router + providers
│   │   ├── api/                  # Axios client with interceptors
│   │   ├── context/              # Auth context provider
│   │   ├── hooks/                # Custom data hooks
│   │   ├── pages/                # Page components
│   │   ├── components/           # Reusable UI components
│   │   ├── types/                # TypeScript type definitions
│   │   └── utils/                # Validation helpers
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── package.json                  # Root scripts
├── CLAUDE.md
└── README.md
```

---

## API Reference

All endpoints are prefixed with `/api`.

### Authentication

| Method | Endpoint          | Auth   | Description                     |
|--------|-------------------|--------|---------------------------------|
| POST   | `/api/auth/signup` | Public | Register a new user             |
| POST   | `/api/auth/login`  | Public | Authenticate and receive JWT    |
| GET    | `/api/auth/me`     | User   | Get current authenticated user  |

### Tasks

| Method | Endpoint           | Auth       | Description            |
|--------|--------------------|------------|------------------------|
| GET    | `/api/tasks`       | User       | List tasks (paginated) |
| POST   | `/api/tasks`       | User       | Create a new task      |
| GET    | `/api/tasks/:id`   | User       | Get a single task      |
| PUT    | `/api/tasks/:id`   | User       | Update task fields     |
| DELETE | `/api/tasks/:id`   | User/Admin | Delete a task          |

### Users

| Method | Endpoint       | Auth | Description                              |
|--------|----------------|------|------------------------------------------|
| GET    | `/api/users`   | User | List users (id, name, email; +role for admins) |

### Task List Query Parameters

| Parameter   | Type   | Description                                |
|-------------|--------|--------------------------------------------|
| `page`      | number | Page number (default: 1)                   |
| `limit`     | number | Items per page (default: 10)               |
| `status`    | string | Filter by status: `todo`, `in_progress`, `done` |
| `priority`  | string | Filter by priority: `low`, `medium`, `high` |
| `assignedTo`| string | Filter by assigned user ID                 |
| `sortBy`    | string | Sort field (e.g., `created_at`, `priority`) |
| `order`     | string | Sort direction: `asc` or `desc`            |
| `search`    | string | Search by task title                       |

### Response Format

**Success (single resource):**
```json
{
  "data": { "id": "...", "title": "..." }
}
```

**Success (list):**
```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

**Error:**
```json
{
  "error": "Validation failed",
  "fields": {
    "email": "Invalid email format",
    "password": "Must be at least 8 characters"
  }
}
```

All error responses follow the shape `{ error: string, fields?: Record<string, string> }`.

---

## Authentication & Authorization

### Authentication Flow

1. User registers via `POST /api/auth/signup`
2. User logs in via `POST /api/auth/login` and receives a JWT
3. JWT is sent in the `Authorization: Bearer <token>` header on subsequent requests
4. Tokens expire after 8 hours

### Password Requirements

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number
- Hashed with bcrypt (12 salt rounds)

### Role-Based Access Control

| Action       | Admin            | Owner (created_by) | Assignee (assigned_to) | Other User |
|-------------|------------------|--------------------|-----------------------|------------|
| List tasks  | All tasks        | Own + assigned     | Own + assigned        | Own + assigned |
| Read task   | Any              | Yes                | Yes                   | No         |
| Create task | Yes              | —                  | —                     | Yes        |
| Update task | Any              | Yes                | Yes                   | No         |
| Delete task | Any              | Yes                | No                    | No         |

---

## Database

SQLite was chosen for zero-configuration setup — no external database server required. The database file is created in `backend/data/` on first run.

### Migrations

Migrations are stored as versioned SQL files in `backend/src/database/migrations/` and run automatically on application startup. The migration runner tracks which migrations have been applied and only runs new ones.

### Schema

**Users**

| Column     | Type | Constraints                                    |
|------------|------|------------------------------------------------|
| id         | TEXT | PRIMARY KEY, UUID v4                           |
| email      | TEXT | UNIQUE, NOT NULL                               |
| password   | TEXT | NOT NULL (bcrypt hash)                         |
| name       | TEXT | NOT NULL                                       |
| role       | TEXT | NOT NULL, DEFAULT 'user', CHECK (admin\|user)  |
| created_at | TEXT | NOT NULL, DEFAULT datetime('now')              |

**Tasks**

| Column      | Type | Constraints                                              |
|-------------|------|----------------------------------------------------------|
| id          | TEXT | PRIMARY KEY, UUID v4                                     |
| title       | TEXT | NOT NULL                                                 |
| description | TEXT | Nullable                                                 |
| status      | TEXT | NOT NULL, DEFAULT 'todo', CHECK (todo\|in_progress\|done) |
| priority    | TEXT | NOT NULL, DEFAULT 'medium', CHECK (low\|medium\|high)    |
| due_date    | TEXT | Nullable, ISO 8601                                       |
| assigned_to | TEXT | FK -> users(id) ON DELETE SET NULL                       |
| created_by  | TEXT | NOT NULL, FK -> users(id)                                |
| created_at  | TEXT | NOT NULL, DEFAULT datetime('now')                        |
| updated_at  | TEXT | NOT NULL, DEFAULT datetime('now')                        |

All queries use parameterized placeholders — no string interpolation in SQL.

---

## Testing

### Run Tests

```bash
# Backend tests
cd backend && npm test

# Run tests in watch mode
cd backend && npm run test:watch
```

### Test Coverage

**Phase 1 — Critical Paths:**
- Authentication validation (signup/login edge cases)
- JWT middleware (valid, expired, missing, malformed tokens)
- RBAC enforcement (cross-user access attempts)
- Task field validation (all edge cases, type coercion)
- Error response shape consistency

**Phase 2 — Comprehensive:**
- Pagination edge cases
- Filter and sort combinations
- SQL injection prevention
- Full CRUD lifecycle
- Frontend component tests

---

## Seed Data

On first run, the database is seeded with:

| Role  | Email               | Password   |
|-------|---------------------|------------|
| Admin | admin@example.com   | Admin123!  |
| User  | user@example.com    | User123!   |

Five sample tasks are created across various statuses, priorities, and assignments.

---

## Environment Variables

| Variable        | Default               | Description                |
|-----------------|-----------------------|----------------------------|
| `PORT`          | `3001`                | Backend server port        |
| `JWT_SECRET`    | (dev default provided)| Secret for signing JWTs    |
| `BCRYPT_ROUNDS` | `12`                  | bcrypt salt rounds         |
| `DB_PATH`       | `./data/taskmanager.db`| SQLite database file path |
| `NODE_ENV`      | `development`         | Environment mode           |

---

## Scripts

### Root

| Script       | Command                  | Description                          |
|--------------|--------------------------|--------------------------------------|
| `npm run dev`| concurrently backend + frontend | Start both servers in dev mode |

### Backend

| Script              | Command           | Description                   |
|---------------------|-------------------|-------------------------------|
| `npm run dev`       | ts-node-dev       | Start with hot reload         |
| `npm run build`     | tsc               | Compile TypeScript            |
| `npm start`         | node dist/        | Start compiled build          |
| `npm test`          | jest              | Run test suite                |
| `npm run test:watch`| jest --watch      | Run tests in watch mode       |

### Frontend

| Script          | Command      | Description                    |
|-----------------|--------------|--------------------------------|
| `npm run dev`   | vite         | Start dev server on port 3000  |
| `npm run build` | vite build   | Production build               |
| `npm run preview`| vite preview | Preview production build       |

---

## Design Decisions

### Why SQLite over PostgreSQL/MySQL?

SQLite provides a zero-dependency setup experience — `npm install && npm run dev` is all it takes. No Docker, no database server, no connection strings. For a single-instance application of this scale, SQLite delivers full SQL capabilities (foreign keys, CHECK constraints, parameterized queries) without operational overhead.

### Why a Layered Architecture?

The Routes -> Controllers -> Services -> Database separation ensures:
- **Testability**: Services can be tested without HTTP, validators without Express
- **Single responsibility**: Controllers don't contain business logic, services don't format HTTP responses
- **Maintainability**: Changing the database layer doesn't touch controller code

### Why Custom Error Classes over Generic Try-Catch?

A typed error hierarchy (`ValidationError`, `AuthenticationError`, `ForbiddenError`, `NotFoundError`) allows the central error handler to deterministically map errors to HTTP status codes and response shapes. This guarantees every error response across every endpoint follows the same `{ error, fields? }` contract — no inconsistency from ad-hoc error handling in individual routes.

### Why Context API over Redux?

For an application with two primary state domains (auth + tasks), React Context with custom hooks provides sufficient state management without the boilerplate overhead of Redux. Auth state is global and infrequently updated — a perfect fit for Context. Task state is fetched per-page and managed locally through hooks.

### Why Tailwind CSS?

Tailwind enables rapid, consistent UI development with utility classes while keeping bundle size minimal through purging. It avoids the opinionated component library aesthetic and demonstrates the ability to build custom, responsive layouts from primitives.

---

## Validation

All inputs are validated server-side before processing:

| Field       | Rules                                         |
|-------------|-----------------------------------------------|
| email       | Valid format, normalized (lowercase, trimmed)  |
| password    | Min 8 chars, 1 uppercase letter, 1 number     |
| title       | Required, max 200 characters                   |
| description | Optional, max 2000 characters                  |
| dueDate     | ISO 8601 format if provided                    |
| assignedTo  | Must reference an existing user ID             |
| All IDs     | Valid UUID v4 format                           |

Additional measures:
- Empty strings are trimmed before validation
- Type coercion is blocked (string "true" is not accepted as boolean)
- Unknown fields are stripped from the request body
- Client-side validation mirrors server-side rules for immediate feedback

---

## License

MIT
