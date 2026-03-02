# Intervals.icu Dashboard & CLI

## Context

After being sick for 5+ weeks, the running schedule needs to restart from scratch. The current workflow uses spreadsheets and ICS files which are hard to maintain programmatically. Intervals.icu has a free REST API that auto-syncs planned workouts to Garmin watches. Building a Next.js dashboard + CLI gives:

- A custom dashboard (replacing Intervals.icu's cluttered UI)
- A CLI that Claude can use to push/manage workouts
- Automatic Garmin watch sync via Intervals.icu's built-in integration

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript** (strict mode)
- **shadcn/ui** + **Tailwind CSS v4**
- **TanStack React Query** (data fetching/caching)
- **Zod** (API response validation)
- **tsx** (CLI runner)

## Project Location

`/home/jlcain3/projects/training/`

## Structure

```
training/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout (providers, nav)
│   │   ├── page.tsx                  # Dashboard home
│   │   ├── schedule/
│   │   │   └── page.tsx              # Training schedule (calendar/list)
│   │   ├── api/                      # API route handlers
│   │   │   └── events/
│   │   │       ├── route.ts          # GET (list) / POST (create)
│   │   │       ├── [id]/route.ts     # PUT (update) / DELETE
│   │   │       └── bulk/route.ts     # POST (bulk create/upsert)
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui primitives
│   │   ├── layout/                   # Nav, sidebar, theme toggle
│   │   └── features/
│   │       ├── schedule/             # WeekView, WorkoutCard, PhaseHeader
│   │       └── dashboard/            # WeeklySummary, NextRun, VolumeChart
│   │
│   ├── lib/
│   │   ├── intervals/                # Intervals.icu API client (shared by dashboard + CLI)
│   │   │   ├── client.ts             # IntervalsClient class
│   │   │   ├── types.ts              # TypeScript types (from OpenAPI spec)
│   │   │   └── errors.ts             # Error classes
│   │   └── utils.ts                  # cn() helper, date formatting
│   │
│   ├── hooks/
│   │   ├── use-events.ts             # React Query hooks for events API
│   │   └── use-athlete.ts            # Athlete profile hook
│   │
│   └── types/
│       └── index.ts                  # Shared app types (phases, schedule)
│
├── cli/
│   ├── index.ts                      # CLI entry point (argparse-style)
│   ├── commands/
│   │   ├── push-plan.ts              # Push training plan from JSON
│   │   ├── list-events.ts            # List upcoming workouts
│   │   └── clear-events.ts           # Remove planned workouts in date range
│   └── plans/
│       └── restart-2026.json         # The 12-week restart plan data
│
├── .env.local                        # INTERVALS_API_KEY, INTERVALS_ATHLETE_ID
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
└── components.json                   # shadcn/ui config
```

## API Client (`src/lib/intervals/client.ts`)

Shared by both the Next.js API routes and CLI. Follows the Hevy client pattern:

```typescript
class IntervalsClient {
  constructor(apiKey: string, athleteId: string)

  // Events (planned workouts)
  listEvents(oldest: string, newest: string): Promise<Event[]>
  createEvent(event: CreateEventInput): Promise<Event>
  createEventsBulk(events: CreateEventInput[], upsert?: boolean): Promise<Event[]>
  updateEvent(id: number, event: Partial<CreateEventInput>): Promise<Event>
  deleteEvent(id: number): Promise<void>

  // Athlete
  getAthlete(): Promise<Athlete>
}
```

Auth: Basic auth with `API_KEY` as username and the API key as password, per Intervals.icu docs.

## Key Types (`src/lib/intervals/types.ts`)

Derived from the OpenAPI spec:

```typescript
interface CreateEventInput {
  start_date_local: string        // "2026-03-03"
  category: "WORKOUT" | "NOTE" | "RACE_A" | ...
  type: "Run" | "Ride" | "Swim" | ...
  name: string
  description?: string            // Workout steps in Intervals.icu text format
  distance?: number               // metres
  moving_time?: number            // seconds
  target?: "AUTO" | "HR" | "PACE" | "POWER"
  tags?: string[]
  uid?: string                    // For upsert matching
  external_id?: string            // For bulk upsert matching
}

interface Event extends CreateEventInput {
  id: number
  athlete_id: string
  icu_training_load?: number
  workout_doc?: Record<string, unknown>
}
```

## Dashboard Pages

### Home (`/`)
- **Next run** card — name, date, distance, description
- **This week** summary — total km, runs completed/planned, phase name
- **Volume chart** — weekly km bar chart with phase markers
- **Phase progression** — current phase, weeks completed

### Schedule (`/schedule`)
- Week-by-week list view (not a full calendar — keep it simple)
- Each week shows: phase name, runs with date/distance/description, weekly total
- Current week highlighted
- Past workouts greyed out

## CLI Commands

Run via `npx tsx cli/index.ts <command>`:

| Command | Description |
|---------|-------------|
| `push-plan <file>` | Push a training plan JSON to Intervals.icu (bulk upsert) |
| `list [--from DATE] [--to DATE]` | List planned events |
| `clear --from DATE --to DATE` | Delete planned events in range |

The `push-plan` command reads a JSON file with the schedule and uses bulk upsert to create/update all events. The JSON format matches `CreateEventInput[]`.

## Implementation Order

### Phase 1: CLI + API Client (NOW)
1. Init Node.js project with TypeScript
2. Create `src/lib/intervals/` — client, types, errors
3. Create `.env` with API key + athlete ID
4. Build CLI with push-plan, list, clear commands
5. Create `cli/plans/restart-2026.json` from the ICS data
6. Push the 12-week restart plan to Intervals.icu
7. Verify workouts appear in Intervals.icu calendar

### Phase 2: Next.js Dashboard (LATER)
8. Scaffold Next.js with shadcn/ui, Tailwind, React Query
9. Create API route handlers (proxy to IntervalsClient)
10. Home page — next run, weekly summary, volume chart
11. Schedule page — week-by-week list view

## Verification

1. `npx tsx cli/index.ts push-plan cli/plans/restart-2026.json` — workouts appear in Intervals.icu
2. `npx tsx cli/index.ts list --from 2026-03-03 --to 2026-05-25` — shows all 36 planned runs
3. Check Garmin Connect — upcoming week's workouts should sync within minutes (requires user to enable "Upload planned workouts" in Intervals.icu settings)
