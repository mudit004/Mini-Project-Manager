
## Mini Project Manager

A simple full-stack project management application (API + React front-end) implemented with:

- Backend: .NET 7 (ASP.NET Core Web API), Entity Framework Core (SQLite), AutoMapper, JWT-based authentication
- Frontend: React + TypeScript + Vite + TailwindCSS

This repository contains a small, opinionated project manager that supports:

- User registration and login (JWT)
- Creating / listing / deleting projects (per-user)
- Creating / listing / updating / deleting tasks inside projects
- Generating an optimized schedule for project tasks (topological sort + shortest estimated hours priority)

The backend follows a layered architecture: API -> Application (services, DTOs, mappings) -> Domain (entities, interfaces) -> Infrastructure (EF Core, repositories, unit of work).

---

## Repository layout

Top-level folders you will use:

- `backend/` - .NET solution and projects
	- `src/ProjectManager.API/` - ASP.NET Core Web API (entry point: `Program.cs`)
	- `src/ProjectManager.Application/` - application services, DTOs, mappings and validation attributes
	- `src/ProjectManager.Domain/` - domain entities and common base types
	- `src/ProjectManager.Infrastructure/` - data layer, EF Core DbContext, repositories, unit of work

- `frontend/` - React + TypeScript single-page app (entry: `src/main.tsx`, main UI in `src/App.tsx`)

---

## Quick architecture summary

- Authentication: JWT bearer tokens configured in `Program.cs`. Tokens are issued by `AuthService` (application layer).
- Data access: EF Core with SQLite (connection string name `DefaultConnection` in `backend/src/ProjectManager.API/appsettings.json`). The app uses a Unit of Work / repository pattern and registers `IUnitOfWork` in DI.
- Mapping: AutoMapper profile in `ProjectManager.Application.Mappings.MappingProfile` maps Entities <-> DTOs.
- Validation: Custom `FutureDateAttribute` ensures due dates are not in the past.
- Scheduling: `SchedulerService` implements a topological sort (Kahn's algorithm) that also prioritizes shorter estimated hours when resolving independent tasks.

---

## Backend — key files and responsibilities

- `backend/src/ProjectManager.API/Program.cs` — Application setup: DI, EF Core configuration (SQLite), JWT authentication, CORS, Swagger, simple database seeding in development.

- `backend/src/ProjectManager.API/Controllers/` — API controllers expose endpoints:
	- `AuthController` — `POST /api/auth/register`, `POST /api/auth/login`
	- `ProjectsController` — `GET /api/projects`, `GET /api/projects/{id}`, `POST /api/projects`, `DELETE /api/projects/{id}` (requires authorization)
	- `TasksController` — project-scoped endpoints under `api/projects/{projectId}/tasks` and task management at `api/tasks/{taskId}` (requires authorization)
	- `SchedulerController` — `POST /api/v1/projects/{projectId}/schedule` to generate recommended execution order based on dependencies

- `backend/src/ProjectManager.Application/Services/` — business logic implemented in services:
	- `AuthService` — registration, login, password hashing, and JWT generation
	- `ProjectService` — CRUD flows for projects (creates project and attaches to user)
	- `TaskService` — CRUD flows for tasks, verifies project ownership
	- `SchedulerService` — builds dependency graph and performs topological sort with priority

- `backend/src/ProjectManager.Application/DTOs/` — request/response shapes used by controllers. Examples:
	- Auth: `RegisterRequestDto`, `LoginRequestDto`, `AuthResponseDto`
	- Projects: `CreateProjectDto`, `ProjectDto`
	- Tasks: `CreateTaskDto` (uses `FutureDateAttribute`), `UpdateTaskDto`, `TaskDto`
	- Schedule: `ScheduleRequestDto`, `ScheduleResponseDto`, `ScheduleTaskInputDto`

- `backend/src/ProjectManager.Application/Mappings/MappingProfile.cs` — AutoMapper rules for Project and Task mappings.

- `backend/src/ProjectManager.Domain/Entities/` — domain entities: `User`, `Project`, `ProjectTask` (inherit from a `BaseEntity` type). Important properties are documented below.

---

## Data model (entities)

- User
	- `Id`, `Username`, `Email`, `PasswordHash`, `FirstName`, `LastName`, `IsActive`
	- `Projects` navigation collection

- Project
	- `Id`, `Title`, `Description`, `UserId`, `CreatedDate`
	- Navigation: `User`, `Tasks` collection

- ProjectTask
	- `Id`, `Title`, `Description`, `DueDate`, `IsCompleted`, `CompletedDate`, `ProjectId`, `CreatedDate`
	- Navigation: `Project`

Validation note: `CreateTaskDto` and `UpdateTaskDto` use `FutureDateAttribute` so `DueDate` must be today or a future date.

---

## Important configuration

- Connection string & DB: `backend/src/ProjectManager.API/appsettings.json`
	- `ConnectionStrings:DefaultConnection` is `Data Source=projectmanager.db` by default (SQLite file).
	- In development the app calls `EnsureCreated()` on startup; you may switch to migrations if desired.

- JWT settings — also in `appsettings.json` under `JwtSettings`:
	- `SecretKey` — change to a secure 32+ character secret for production
	- `Issuer`, `Audience`, `ExpiryInHours`

Example (already present):

```
"ConnectionStrings": { "DefaultConnection": "Data Source=projectmanager.db" }
"JwtSettings": {
	"SecretKey": "your-super-secret-key-that-is-at-least-32-characters-long!",
	"Issuer": "ProjectManagerAPI",
	"Audience": "ProjectManagerClient",
	"ExpiryInHours": 24
}
```

---

## API contract (summary)

Authentication (no auth header required):

- POST /api/auth/register
	- Body: `RegisterRequestDto` { username, email, password, firstName?, lastName? }
	- Response: `AuthResponseDto` { userId, username, email, token, expiresAt }

- POST /api/auth/login
	- Body: `LoginRequestDto` { username, password }
	- Response: `AuthResponseDto`

Protected endpoints (require Authorization: Bearer <token>):

- Projects
	- GET /api/projects — returns `IEnumerable<ProjectDto>` for current user
	- GET /api/projects/{id} — returns `ProjectDto` if user owns the project
	- POST /api/projects — Body: `CreateProjectDto` { title, description? } -> returns created `ProjectDto`
	- DELETE /api/projects/{id} — deletes project if user owns it

- Tasks
	- GET /api/projects/{projectId}/tasks — returns tasks for a project
	- GET /api/projects/{projectId}/tasks/{taskId} — get a single task
	- POST /api/projects/{projectId}/tasks — Body: `CreateTaskDto` { title, description?, dueDate } -> returns created `TaskDto`
	- PUT /api/tasks/{taskId} — Body: `UpdateTaskDto` { title, description?, dueDate, isCompleted } -> returns updated `TaskDto`
	- DELETE /api/tasks/{taskId}` — delete a task

- Scheduling
	- POST /api/v1/projects/{projectId}/schedule
		- Body: `ScheduleRequestDto` { tasks: [ { title, estimatedHours, dueDate, dependencies: [...] } ] }
		- Response: `ScheduleResponseDto` { recommendedOrder: string[], hasCycle: bool, errorMessage? }
		- If a circular dependency is detected, `HasCycle` is true and the controller returns 400 with the response object.

Notes:
- Controllers perform ownership checks (services verify the user owns a project before returning or mutating tasks/projects).
- Error handling: Controllers wrap calls in try/catch and return appropriate HTTP status codes (400/401/403/404/500).

---

## Frontend

Location: `frontend/` — Vite + React + TypeScript app.

- Entry: `frontend/src/main.tsx` mounts the app.
- Main UI is implemented in `frontend/src/App.tsx`. It contains:
	- A lightweight auth system using localStorage to store `{ token, user }`.
	- An `api` helper that calls the backend endpoints and sends the `Authorization: Bearer <token>` header.
	- Pages/components for login/register, project list, task list and task CRUD, and modals for confirm/delete.

Important: `API_BASE_URL` is hard-coded at the top of `frontend/src/App.tsx`:

```ts
const API_BASE_URL = "https://mini-project-manager-sujb.onrender.com/api";
```

Change this value to your local backend address when developing locally (for example `http://localhost:5000/api` or `https://localhost:7193/api` depending on how you run the API).

---

## Run locally (backend)

Prerequisites:

- .NET SDK (7+)
- (Optional) Docker

From PowerShell, run the API project:

```powershell
cd "backend/src/ProjectManager.API"
dotnet restore
dotnet run
```

Notes:

- The API uses SQLite by default. The file `projectmanager.db` will be created in the app working directory when the app runs. In development `Program.cs` calls `EnsureCreated()` and applies a small seed (a `testuser`).
- To change DB provider or connection string, edit `backend/src/ProjectManager.API/appsettings.json` (key `ConnectionStrings:DefaultConnection`).

Docker (build & run) — example (adjust ports / env as needed):

```powershell
docker build -t projectmanager-backend -f backend/Dockerfile backend
docker run -p 5000:80 --name projectmanager-backend -d projectmanager-backend
```

---

## Run locally (frontend)

Prerequisites:

- Node.js (18+) and npm

From PowerShell:

```powershell
cd frontend
npm install
npm run dev
```

Then open the dev server URL printed by Vite (default `http://localhost:5173`). Make sure `API_BASE_URL` in `frontend/src/App.tsx` is pointing to your running API.

---

## Example API call (PowerShell)

Register a new user with `Invoke-RestMethod` (PowerShell):

```powershell
$body = @{ username = 'myuser'; email = 'me@example.com'; password = 'password123' } | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/register' -Method Post -Body $body -ContentType 'application/json'
```

Login (returns token):

```powershell
$body = @{ username = 'myuser'; password = 'password123' } | ConvertTo-Json
$resp = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' -Method Post -Body $body -ContentType 'application/json'
$resp.token
```

Use the token in subsequent requests by adding an `Authorization` header `Bearer <token>`.

---

## Testing & development notes

- Validators: `FutureDateAttribute` used on task DTOs ensures `DueDate` is today or later.
- The `SchedulerService` produces a recommended task execution order using topological sort and treats tasks without dependencies first; when multiple tasks are available it prefers the one with smallest `EstimatedHours`.
- AutoMapper profile maps entity collections (e.g., project tasks) to additional DTO fields like `TaskCount` and `CompletedTaskCount`.
- Passwords are stored as salted PBKDF2 hashes (Rfc2898) — see `AuthService.HashPassword` and `VerifyPassword`.

---

## Next steps / suggestions

- Add integration tests for controllers (happy path + auth/authorization edge cases).
- Support environment variables for the frontend to avoid editing `src/App.tsx` directly (e.g., use `import.meta.env.VITE_API_BASE_URL`).
- Switch DB initialization from `EnsureCreated()` to EF Core migrations for maintainability in production.
- Add refresh tokens or extend token revocation logic for improved security.

---

## Where to look for things

- API entrypoint: `backend/src/ProjectManager.API/Program.cs`
- Controllers: `backend/src/ProjectManager.API/Controllers/`
- Application services / DTOs / mappings: `backend/src/ProjectManager.Application/`
- Domain entities: `backend/src/ProjectManager.Domain/Entities/`
- Frontend: `frontend/src/App.tsx`, `frontend/src/main.tsx`

If you want, I can also:

- Add a `.env`-driven configuration for the frontend to avoid hard-coded API URL
- Add a README section with sample Postman collection or Swagger usage snippets
- Add a small set of integration tests for backend endpoints (Auth + Projects + Tasks)

---

Completion checklist

- Scanned backend controllers, services, DTOs, mappings, validators and domain entities
- Scanned frontend app and confirmed where to change the API URL
- Documented setup, API endpoints, DTO shapes, and running instructions

If you want any additions or prefer a shorter README (quick-start only), tell me which sections to compress and I will update the file.
