# DayTrack

> Understand your time. Build better habits.

A local-first personal productivity and study tracking application. Log study sessions, track activities, manage tasks, and visualise your learning progress — all stored privately on your own machine.

## Features

- **Manual Study Logging** — Record study sessions with subject, topic, date, duration and notes. No background tracking or forced timers.
- **Subjects & Topics** — Organise learning hierarchically. Optional deadlines, target hours and priorities.
- **Activity Log** — Track how you spend your day. Classify activities as productive, neutral or distracting.
- **Analytics** — Charts showing study trends, subject distribution and productivity breakdown. Real data only — no fake data.
- **Calendar** — Plan events, deadlines and study sessions in month and week views.
- **Tasks & Reminders** — Task management with priorities and due dates. In-app reminders poll while the app is open.
- **Data Export** — Download all your data as JSON for personal backup.
- **Fully local** — No cloud, no account required, works offline after initial install.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite 5, Tailwind CSS 3 |
| Charts | Recharts 2 |
| State | TanStack Query 5, React Router 6 |
| Backend | Node.js, Fastify 4, TypeScript |
| Database | SQLite via better-sqlite3 |
| Testing | Vitest, Supertest |
| Deploy | Docker, Docker Compose |

## Quick Start

### Prerequisites
- Node.js 18+ and npm

### Install and run
```bash
git clone <your-repo-url>
cd daytrack
npm run install:all
npm run dev
```

- **App**: http://localhost:5173
- **API**: http://localhost:3001
- **Database**: `./data/daytrack.db` (created automatically on first run)

### Run separately
```bash
npm run dev:server   # Fastify API server on port 3001
npm run dev:client   # Vite dev server on port 5173
```

## Docker

### Single container
```bash
docker build -t daytrack .
docker run -d --name daytrack \
  -p 3001:3001 \
  -v daytrack-data:/app/data \
  daytrack
```
Open http://localhost:3001

### Docker Compose
```bash
docker-compose up -d
```

### ReleaseGuard test deployment (isolated data volume)
```bash
# Uses a completely separate volume — never touches your personal data
docker run -d --name daytrack-test \
  -p 3002:3001 \
  -v daytrack-test-data:/app/data \
  daytrack
```

## Project Structure

```
daytrack/
├── client/               React + Vite frontend
│   └── src/
│       ├── pages/        Dashboard, StudyTracker, SubjectsTopics, …
│       ├── components/ui/ Button, Card, Modal, Input, Select, …
│       ├── layouts/      Sidebar, MainLayout
│       ├── services/     API service functions (one per resource)
│       ├── types/        Shared TypeScript interfaces
│       └── utils/        formatDuration, formatDate, today()
├── server/               Fastify backend
│   └── src/
│       ├── modules/      subjects, topics, study-logs, activity-logs,
│       │                 calendar, tasks, reminders, analytics, settings
│       ├── database/     migrate.ts, db.ts, migrations/0001_initial.sql
│       └── server.ts     entry point
├── data/                 SQLite database file (gitignored)
├── Dockerfile
├── docker-compose.yml
└── CLAUDE.md             Full project context for AI assistants
```

## API Reference

All responses: `{ data: T, message?: string }`. Errors: `{ error: string, message: string, statusCode: number }`.

| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/api/subjects` | List / create subjects |
| GET/PUT/DELETE | `/api/subjects/:id` | Read / update / delete subject |
| GET | `/api/subjects/:id/topics` | Topics for a subject |
| GET/POST | `/api/topics` | List (`?subjectId,status,priority,search`) / create |
| GET/PUT/DELETE | `/api/topics/:id` | Read / update / delete topic |
| GET/POST | `/api/study-logs` | List (`?subjectId,topicId,startDate,endDate`) / create |
| GET/PUT/DELETE | `/api/study-logs/:id` | Read / update / delete log |
| GET/POST | `/api/activity-logs` | List / create |
| GET/POST | `/api/activity-categories` | List / create categories |
| GET/POST | `/api/calendar-events` | List (`?startDate,endDate,year,month`) / create |
| GET/POST | `/api/tasks` | List / create tasks |
| GET/POST | `/api/reminders` | List / create reminders |
| GET | `/api/reminders/due` | Due reminders (for polling) |
| GET | `/api/analytics/dashboard` | Summary stats |
| GET | `/api/analytics/study` | Study analytics |
| GET | `/api/analytics/subjects` | Per-subject totals |
| GET | `/api/analytics/topics` | Per-topic totals |
| GET | `/api/analytics/activity` | Activity analytics |
| GET/PUT | `/api/settings` | App settings |
| GET | `/api/export` | Full data export as JSON |
| GET | `/health` | `{ status, db, timestamp }` |

## Tests

```bash
npm test                # from root
cd server && npm test   # from server directory
```

Covers: health check, subjects CRUD, topics (optional fields), study logs (multiple per day, past dates), analytics calculations, settings, tasks, calendar events, reminders, data export.

## Database

- **Local dev**: `./data/daytrack.db` — created automatically, persists across restarts
- **Docker**: named volume mounted at `/app/data/daytrack.db`
- **Migrations**: run automatically at startup from `server/src/database/migrations/`
- **Schema**: subjects → topics → study_logs; activity_categories → activity_logs; calendar_events, tasks, reminders, app_settings

## License

MIT
