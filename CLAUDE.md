# DayTrack — Project Context for Claude

## What this is
DayTrack is a local-first personal study and time tracking application.
Tagline: "Understand your time. Build better habits."

No accounts. No cloud. No timers. The user manually logs study sessions and activities after the fact. All data lives in a single SQLite file on their machine.

---

## Stack
- **Frontend**: React 18, TypeScript, Vite 5, Tailwind CSS 3, React Router 6, TanStack Query 5, Recharts 2, Lucide React
- **Backend**: Node.js 20+, TypeScript, Fastify 4, better-sqlite3 (raw SQL, no ORM), Zod validation
- **Database**: SQLite at `./data/daytrack.db` (WAL mode, foreign keys enabled)
- **Testing**: Vitest (unit), Supertest (integration)

---

## Running locally (dev mode)
```bash
npm run install:all   # installs root + server + client node_modules
npm run dev           # starts server (port 3001) + Vite (port 5173) concurrently
npm run dev:server    # Fastify only
npm run dev:client    # Vite only
```
Frontend: http://localhost:5173  
Backend:  http://localhost:3001  
Vite proxies `/api/*` and `/health` to port 3001 in dev.

**Note:** `better-sqlite3` is a native Node addon. On macOS it compiles from source via node-gyp (requires Xcode CLTs). Inside Docker it uses `node:20` (Debian) which has build tools pre-installed — no extra steps needed.

---

## Running in Docker (production)
```bash
# Build and start
docker compose up --build -d       # http://localhost:3001

# Or manually
docker build -t daytrack .
docker run -d -p 3001:3001 -v daytrack-data:/app/data daytrack

# ReleaseGuard test deployment (separate volume, separate port)
docker run -d -p 3002:3001 -v daytrack-test-data:/app/data --name daytrack-test daytrack
```
In Docker, the app serves the built React SPA from `server/public/` as static files via Fastify. The API and frontend are on the same port (3001).

The Dockerfile uses a 3-stage build:
1. `node:20` — build client (Vite → `server/public/`)
2. `node:20` — install server deps (compiles better-sqlite3) + `tsc`
3. `node:20-slim` — production runtime (dist + public + node_modules only)

---

## File layout
```
daytrack/
├── client/
│   ├── src/
│   │   ├── pages/              # One .tsx per route
│   │   │   ├── Dashboard.tsx
│   │   │   ├── StudyTracker.tsx
│   │   │   ├── SubjectsTopics.tsx
│   │   │   ├── ActivityLog.tsx
│   │   │   ├── Calendar.tsx
│   │   │   ├── TasksReminders.tsx
│   │   │   ├── Analytics.tsx
│   │   │   └── Settings.tsx
│   │   ├── components/ui/      # Shared UI primitives
│   │   │   ├── Button.tsx      # variant: primary|secondary|ghost|danger
│   │   │   ├── Card.tsx        # white panel with shadow-card
│   │   │   ├── Modal.tsx       # backdrop + centered dialog
│   │   │   ├── Input.tsx       # label + input + error
│   │   │   ├── Select.tsx      # label + select + options array
│   │   │   ├── Textarea.tsx    # label + textarea
│   │   │   ├── Badge.tsx       # colored pill
│   │   │   ├── EmptyState.tsx  # centered icon + message
│   │   │   ├── StatCard.tsx    # metric tile (label, value, icon, color)
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   └── DurationInput.tsx
│   │   ├── layouts/
│   │   │   ├── MainLayout.tsx  # Outlet + Sidebar
│   │   │   └── Sidebar.tsx     # nav links + collapsed state
│   │   ├── services/           # One file per resource, calls /api/*
│   │   │   ├── api.ts          # base fetch wrapper (throws on !ok)
│   │   │   ├── subjects.ts
│   │   │   ├── topics.ts
│   │   │   ├── studyLogs.ts
│   │   │   ├── activityLogs.ts
│   │   │   ├── activityCategories.ts
│   │   │   ├── calendar.ts
│   │   │   ├── tasks.ts
│   │   │   ├── reminders.ts
│   │   │   ├── analytics.ts
│   │   │   └── settings.ts
│   │   ├── hooks/
│   │   │   └── useReminders.ts # polls /api/reminders/due, exposes dismiss/complete
│   │   ├── types/index.ts      # ALL TypeScript interfaces (single source of truth)
│   │   ├── utils/format.ts     # formatDuration, formatDate, today(), nDaysAgo(), etc.
│   │   ├── App.tsx             # React Router routes (lazy-loaded pages) + ReminderBanner
│   │   └── main.tsx            # QueryClient + BrowserRouter + StrictMode
│   ├── index.html
│   ├── vite.config.ts          # outDir: ../server/public, proxy /api→3001
│   ├── tailwind.config.js      # custom color tokens
│   └── package.json
├── server/
│   └── src/
│       ├── server.ts           # Fastify entry: registers plugins, runs migrations, serves static
│       ├── database/
│       │   ├── db.ts           # better-sqlite3 connection (WAL + foreign keys)
│       │   ├── migrate.ts      # reads SQL files, tracks applied via _migrations table
│       │   └── migrations/
│       │       └── 0001_initial.sql  # full schema + default activity categories
│       ├── modules/            # one directory per resource
│       │   ├── subjects/       # schema.ts · repository.ts · service.ts · routes.ts · index.ts
│       │   ├── topics/
│       │   ├── study-logs/
│       │   ├── activity-logs/
│       │   ├── activity-categories/  (sub-resource, routes under /api/activity-categories)
│       │   ├── calendar/
│       │   ├── tasks/
│       │   ├── reminders/
│       │   ├── analytics/
│       │   └── settings/
│       ├── middleware/
│       │   └── error-handler.ts
│       ├── utils/
│       │   ├── response.ts     # success<T>(data, message?) → { data, message }
│       │   └── errors.ts       # AppError, NotFoundError
│       └── tests/
│           └── server.test.ts  # Vitest + Supertest integration tests
├── data/
│   └── .gitkeep               # directory tracked; daytrack.db gitignored
├── Dockerfile
├── docker-compose.yml
├── package.json               # root: scripts dev/build/install:all via concurrently
└── CLAUDE.md                  # this file
```

---

## Pages and what they do

### Dashboard (`/`)
- Period selector: Today / 7 Days / 30 Days / This Month
- 4 stat cards: study today, study this week, study this month, pending tasks
- 4 more stat cards: total subjects, total topics, completed topics, in-progress topics
- Area chart: daily study hours over the selected period
- Pie chart: time split by subject
- Productivity strip: stacked bar (productive / neutral / distracting)
- Recent study logs table (last 5)
- Upcoming tasks list (next 5 pending)

### Study Tracker (`/study-tracker`)
- Summary row: total time, sessions, average duration for the filtered period
- Filter bar: period dropdown, subject dropdown, free-text search
- Sortable log table: date, subject, topic, duration, notes — edit/delete per row
- Add/edit modal: date, subject, topic (cascaded from subject), duration (hours + minutes), notes
- No timer. Duration entered manually.

### Subjects & Topics (`/subjects`, `/subjects/:id`)
- `/subjects` — grid of subject cards (name, color swatch, topic count, total hours, progress bar)
  - Create / edit / delete subject; color picker with 12 preset swatches
- `/subjects/:id` — detail view with two tabs:
  - **Topics** tab: topic cards with status badge, priority, deadline, target hours, logged hours
    - Create/edit topic: title, description, status, priority (optional), deadline (optional), target hours (optional)
    - Deadline and target hours are NEVER required
  - **History** tab: all study logs for this subject, paginated

### Activity Log (`/activity-log`)
- Productivity summary bar (productive / neutral / distracting) for the selected period
- Filter: period, category
- Log table: date, activity name, category, duration, notes — edit/delete
- Add/edit modal: date, activity name, category, duration, notes
- Category manager modal: create/edit/delete categories with name, classification, color

### Calendar (`/calendar`)
- Month view with event dots per day; week view with time grid
- Navigation: prev/next month or week, "today" button
- Click a day to add an event; click an event to view/edit/delete
- Event fields: title, description, date, start/end time (optional), all-day toggle, category, linked subject/topic

### Tasks & Reminders (`/tasks`)
- Two tabs: Tasks and Reminders
- **Tasks**: filterable list (status, priority, search), create/edit/delete
  - Fields: title, description, status (pending/in_progress/completed), priority (low/medium/high), due date, linked subject/topic
- **Reminders**: list grouped by upcoming / past, create/edit/delete/dismiss/complete
  - Fields: title, description, date, time, linked task
  - Due reminders surface as a floating banner (bottom-right) via ReminderBanner in App.tsx

### Analytics (`/analytics`)
- Two tabs: Study Analytics and Activity Analytics
- Period selector: 7 days / 30 days / 90 days / This Year / Custom range
- **Study Analytics**: area chart (daily hours), pie chart (by subject), bar chart (by topic, top 10)
- **Activity Analytics**: donut chart (by classification), bar chart (by category)

### Settings (`/settings`)
- App preferences: default study duration increment, week start day, date format
- Activity category manager (inline, same as ActivityLog modal)
- Data export: downloads full JSON dump via `/api/export`
- About section: version, tech stack info

---

## TanStack Query cache keys
```
['subjects']                     all subjects
['subjects', id]                 single subject
['topics']                       all topics (with filters)
['topics', subjectId]            topics for a subject
['study-logs']                   all study logs (with filters)
['activity-logs']                all activity logs
['activity-categories']          all activity categories
['calendar-events']              calendar events (with date range)
['tasks']                        all tasks (with filters)
['reminders']                    all reminders
['analytics', 'dashboard']       DashboardSummary
['analytics', 'study', range]    StudyAnalytics for date range
['analytics', 'subjects']        SubjectStudyTotal[]
['analytics', 'topics']          TopicStudyTotal[]
['analytics', 'activity']        ActivityAnalyticsResult
['settings']                     AppSettings
```
After every mutation: `qc.invalidateQueries({ queryKey: [...] })` to refresh.

**Critical TanStack Query v5 pattern** — service functions that accept params must be WRAPPED in an arrow function, not passed directly:
```ts
// CORRECT
queryFn: () => getSubjectAnalytics({ startDate, endDate })

// WRONG — TanStack passes QueryFunctionContext, not your params type
queryFn: getSubjectAnalytics

// ALSO WRONG in v5 — onSuccess was removed
useQuery({ queryFn: ..., onSuccess: (data) => ... })  // TS error
// Use useEffect instead:
useEffect(() => { if (data) doSomething(data) }, [data])
```

---

## API contracts

### Response shape
All success: `{ data: T, message?: string }`  
All errors:  `{ error: string, message: string, statusCode: number }`

### Endpoints
```
GET/POST            /api/subjects
GET/PUT/DELETE      /api/subjects/:id
GET                 /api/subjects/:id/topics

GET/POST            /api/topics             ?subjectId ?status ?priority ?search
GET/PUT/DELETE      /api/topics/:id

GET/POST            /api/study-logs         ?subjectId ?topicId ?startDate ?endDate ?date
GET/PUT/DELETE      /api/study-logs/:id

GET/POST            /api/activity-categories
PUT/DELETE          /api/activity-categories/:id

GET/POST            /api/activity-logs      ?categoryId ?startDate ?endDate
GET/PUT/DELETE      /api/activity-logs/:id

GET/POST            /api/calendar-events    ?startDate ?endDate ?year ?month
GET/PUT/DELETE      /api/calendar-events/:id

GET/POST            /api/tasks              ?status ?priority ?subjectId ?search
GET/PUT/DELETE      /api/tasks/:id

GET/POST            /api/reminders          ?upcoming ?showDismissed
GET/PUT/DELETE      /api/reminders/:id
GET                 /api/reminders/due

GET                 /api/analytics/dashboard    → DashboardSummary
GET                 /api/analytics/study        → { daily: StudyByDay[], totalMinutes: number }
GET                 /api/analytics/subjects     → SubjectStudyTotal[]   (includes subjectColor)
GET                 /api/analytics/topics       → TopicStudyTotal[]
GET                 /api/analytics/activity     → { stats: ActivityStats, breakdown: CategoryBreakdown[] }

GET/PUT             /api/settings
GET                 /api/export

GET                 /health                     → { status: 'ok', db: 'connected', timestamp }
```

---

## Database schema

```sql
subjects        (id, name, description, color, created_at, updated_at)
topics          (id, subject_id→subjects, title, description,
                 status: not_started|in_progress|completed,
                 priority: low|medium|high|NULL,
                 deadline: YYYY-MM-DD|NULL,
                 target_hours: REAL|NULL,
                 created_at, updated_at)
study_logs      (id, subject_id→subjects, topic_id→topics|NULL,
                 date: YYYY-MM-DD, duration_minutes, notes, created_at, updated_at)
activity_categories (id, name, classification: productive|neutral|distracting,
                     color, is_default)
activity_logs   (id, activity_name, category_id→activity_categories,
                 date: YYYY-MM-DD, duration_minutes, notes)
calendar_events (id, title, description, event_date: YYYY-MM-DD,
                 start_time, end_time, all_day: 0|1,
                 category, subject_id→subjects|NULL, topic_id→topics|NULL)
tasks           (id, title, description,
                 status: pending|in_progress|completed,
                 priority: low|medium|high|NULL,
                 due_date: YYYY-MM-DD|NULL,
                 subject_id→subjects|NULL, topic_id→topics|NULL)
reminders       (id, title, description, reminder_date, reminder_time,
                 task_id→tasks|NULL, is_dismissed: 0|1, is_completed: 0|1)
app_settings    (key TEXT PK, value TEXT)
_migrations     (id, filename, applied_at)   -- internal migration tracker
```

Default data seeded on first run: 5 activity categories (Deep Work, Meetings, Admin, Social Media, Entertainment).

---

## Backend architecture (per module)

Each module under `server/src/modules/<name>/`:
```
schema.ts      Zod schemas for create/update inputs; exported as CreateXInput, UpdateXInput
repository.ts  Pure SQL functions (findAll, findById, create, update, delete)
               Uses db.prepare().all() / .get() / .run()
service.ts     Business logic; calls repository; throws AppError/NotFoundError
routes.ts      Fastify plugin; validates with Zod; calls service; returns success()
index.ts       Re-exports routes plugin
```

Error handling: `error-handler.ts` converts AppError → appropriate status code; unknown errors → 500.

---

## Frontend architecture

### State management
- All server state via TanStack Query (`useQuery` / `useMutation`)
- No Redux or Zustand — query cache IS the state
- Local UI state (modal open, form values) via `useState`

### Service layer (`client/src/services/`)
Each file exports typed async functions:
```ts
// Pattern
export async function getSubjects(): Promise<Subject[]> {
  return api.get<Subject[]>('/api/subjects')
}
export async function createSubject(data: CreateSubjectInput): Promise<Subject> {
  return api.post<Subject>('/api/subjects', data)
}
```
`api.ts` wraps `fetch`, throws on non-2xx, unwraps `{ data }` envelope.

### Routing (`App.tsx`)
```
/                  Dashboard
/study-tracker     StudyTracker
/subjects          SubjectsTopics (list view)
/subjects/:id      SubjectsTopics (detail view)
/activity-log      ActivityLog
/calendar          Calendar
/tasks             TasksReminders
/analytics         Analytics
/settings          Settings
```
All pages are lazy-loaded. `ReminderBanner` floats bottom-right globally.

---

## Color palette (Tailwind custom tokens)
```
Token                    Hex        Use
bg-bg-main              #EEF0F6    page background
bg-bg-secondary         #E8EBF3    subtle secondary bg, pill containers
bg-primary              #6976CC    primary actions, productive classification
bg-primary-dark         #626FC5    hover state for primary
bg-lavender-light       #C4C9E5    neutral information
bg-lavender-pale        #D8DFFD    pale lavender, highlight bg
text-primary            #6976CC    primary text / links
text-coral              #E98F91    distracting classification, soft warnings
text-coral-strong       #E4484B    errors, destructive actions
bg-white                #FFFFFF    cards, modals, panels
text-text-primary       #41465D    primary body text
text-text-secondary     #929BB8    muted text, labels
border-border           #E5E8F0    all borders
shadow-card             0 1px 3px rgba(65,70,93,0.08)
shadow-modal            0 4px 24px rgba(65,70,93,0.12)
```

---

## Key design constraints (NEVER violate these)

1. **No background time tracking, no timer** — user manually enters duration after the fact
2. **Topic deadlines are optional** — deadline field is never required in any form
3. **Target study hours are optional** — never required
4. **No cloud dependency** — local SQLite only; no Supabase, Firebase, or any external DB
5. **No fake/seed data** — all analytics come from real user records; never insert demo data
6. **ReleaseGuard isolation** — test deployments MUST use a separate Docker volume (`daytrack-test-data`) and separate port (3002); they must never touch the personal database at `daytrack-data`

---

## Utils (`client/src/utils/format.ts`)
```ts
formatDuration(minutes)       // "2h 30m", "45m", "0m"
formatDate(YYYY-MM-DD)        // "Nov 16, 2026"
formatShortDate(YYYY-MM-DD)   // "Nov 16"
today()                       // YYYY-MM-DD for today
yesterday()                   // YYYY-MM-DD for yesterday
nDaysAgo(n)                   // negative n = future
startOfMonth()                // YYYY-MM-01
isOverdue(YYYY-MM-DD)         // date < today()
isDueSoon(YYYY-MM-DD, days=7) // within next N days
minutesToHours(minutes)       // 1 decimal place
```

---

## Testing
Tests live in `server/src/tests/server.test.ts`. Uses Vitest + Supertest against a real SQLite in a temp file (not the user's DB). Run with `npm test` from the server directory.

The test sets `process.env.DB_PATH` before importing server code so each test run gets a fresh isolated DB.

`buildServer()` is exported from `server.ts` for testing (returns Fastify instance without `.listen()`).

---

## Build status (as of 2026-11-16)
- [x] Project scaffold
- [x] Database schema + migration runner
- [x] All 10 backend modules
- [x] Frontend foundation (types, services, UI components, layouts)
- [x] All 8 frontend pages (full implementation, not stubs)
- [x] Dockerfile (3-stage: node:20 build → node:20-slim runtime)
- [x] docker-compose.yml
- [x] Integration tests
- [x] README.md
