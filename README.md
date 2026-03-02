# Training CLI

CLI tool for managing running training plans via the [Intervals.icu](https://intervals.icu) API. Planned workouts sync automatically to Garmin watches.

## Setup

```bash
npm install
cp .env.example .env
```

Add your credentials to `.env`:

```
INTERVALS_API_KEY=your-api-key
INTERVALS_ATHLETE_ID=your-athlete-id
```

Get both from Intervals.icu > Settings > Developer.

## Commands

### Push a training plan

```bash
npx tsx cli/index.ts push-plan cli/plans/restart-2026.json
npx tsx cli/index.ts push-plan cli/plans/restart-2026.json --dry-run
```

Bulk-creates events in Intervals.icu. Uses `external_id` for upsert — re-running the same plan updates existing events rather than duplicating.

### List planned events

```bash
npx tsx cli/index.ts list
npx tsx cli/index.ts list --from 2026-03-03 --to 2026-05-25
npx tsx cli/index.ts list --raw
```

Defaults to today + 30 days. Groups by week with distance totals.

### Clear planned events

```bash
npx tsx cli/index.ts clear --from 2026-03-03 --to 2026-05-25
npx tsx cli/index.ts clear --from 2026-03-03 --to 2026-05-25 --dry-run
```

Deletes all workout events in the given date range.

## Plan format

Plans are JSON arrays of event objects:

```json
[
  {
    "start_date_local": "2026-03-03",
    "category": "WORKOUT",
    "type": "Run",
    "name": "Run: 1.5km",
    "description": "Z1-Z2. Walk/run 1:1. FLAT.",
    "distance": 1500,
    "target": "HR",
    "tags": ["Restart Wk1"],
    "external_id": "restart-2026-wk1-tue"
  }
]
```

| Field | Description |
|-------|-------------|
| `start_date_local` | Date (`YYYY-MM-DD` or `YYYY-MM-DDTHH:MM:SS`) |
| `category` | `WORKOUT`, `NOTE`, `RACE_A`, `RACE_B`, `RACE_C` |
| `type` | `Run`, `Ride`, `Swim`, `Walk`, `Hike`, etc. |
| `name` | Display name |
| `description` | Workout notes + structured steps (see below) |
| `distance` | Distance in metres |
| `target` | Target type: `HR`, `PACE`, `POWER`, `AUTO` |
| `tags` | Array of tags for filtering |
| `external_id` | Unique ID for upsert matching |

## Structured workouts

The `description` field does double duty — it's both human-readable notes and a structured workout definition. Intervals.icu's parser picks up step syntax and converts it into guided workout steps that sync to your Garmin watch.

Plain text at the top acts as notes. Lines starting with `- ` become guided steps with HR/pace/power targets.

```json
{
  "description": "First run back. FLAT.\nWarm Up\n- 2m Z1 HR\n\nWalk/Run 5x\n- 1m Z2 HR\n- 1m Z1 HR\n\nCool Down\n- 1m Z1 HR"
}
```

**Important:** Use `Z2 HR` not just `Z2` — without `HR` it defaults to power zones.

See [docs/knowledge/api.md](docs/knowledge/api.md#structured-workout-descriptions) for full syntax reference.

## Garmin sync

Enable "Upload planned workouts" in Intervals.icu > Settings > Garmin. The next 7 days of planned workouts sync automatically to Garmin Connect and then to your watch.

## Project structure

```
training/
├── src/lib/intervals/    # API client (reusable by future dashboard)
│   ├── client.ts         # IntervalsClient class
│   ├── types.ts          # TypeScript types
│   └── errors.ts         # Error classes
├── cli/
│   ├── index.ts          # CLI entry point
│   ├── commands/         # Command implementations
│   └── plans/            # Training plan JSON files
└── plan.md               # Project roadmap
```
