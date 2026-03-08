# Intervals.icu API Reference

Base URL: `https://intervals.icu/api/v1`

Full OpenAPI spec: `docs/knowledge/intervals-open-api-spec.json`

## Authentication

Basic Auth where username is the literal string `API_KEY` and password is your API key from Settings > Developer.

```
Authorization: Basic base64("API_KEY:<your-api-key>")
```

Athlete ID is also from Settings > Developer (format: `i123456`). Use `0` to reference the athlete associated with the API key.

## Gotchas

- **Dates must include time component.** `2026-03-03` fails with a 422. Must be `2026-03-03T00:00:00`. Our client normalises this automatically.
- **Bulk upsert matches on `external_id`** — but only for events created by the same API key/OAuth app. Set `upsert=true` on the bulk endpoint.
- **Single event upsert matches on `uid`** — use `upsertOnUid=true` query param.
- **Garmin sync** pushes only the next ~7 days of planned workouts. Enable in Settings > Garmin > "Upload planned workouts".
- **Distance field** is in metres (not km). A 1.5km run = `1500`.
- **`moving_time`** is in seconds.

---

## Endpoints We Use

### GET /api/v1/athlete/{id}/events

List events (planned workouts, notes) on the athlete's calendar.

**Client method:** `listEvents(oldest, newest, category?)`

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `oldest` | string (ISO date) | No | Start date. Default: today in athlete's timezone |
| `newest` | string (ISO date) | No | End date (inclusive). Default: oldest + 6 days |
| `category` | string | No | Comma-separated filter, e.g. `WORKOUT,NOTE` |
| `limit` | int | No | Max events to return (default: all) |

**Response:** `Event[]`

---

### POST /api/v1/athlete/{id}/events

Create a single event on the athlete's calendar.

**Client method:** `createEvent(event)`

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `upsertOnUid` | boolean | Yes | If true, update existing event with matching `uid` |

**Request body:** `CreateEventInput` (JSON)

**Response:** `Event`

---

### POST /api/v1/athlete/{id}/events/bulk

Create multiple events at once. Best for pushing an entire training plan.

**Client method:** `createEventsBulk(events, options)`

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `upsert` | boolean | No | Update events with matching `external_id` (default: false) |
| `upsertOnUid` | boolean | Yes | Update events with matching `uid`. Ignored if `upsert=true` |
| `updatePlanApplied` | boolean | Yes | Give all events the same `plan_applied` timestamp |

**Request body:** `CreateEventInput[]` (JSON array)

**Response:** `Event[]`

**Note:** The `upsert` flag matches on `external_id` and requires the events were created by the same API key. This is how we make `push-plan` idempotent.

---

### PUT /api/v1/athlete/{id}/events/{eventId}

Update an existing event.

**Client method:** `updateEvent(eventId, partialEvent)`

**Request body:** Partial `CreateEventInput` (only fields to change)

**Response:** `Event`

---

### DELETE /api/v1/athlete/{id}/events/{eventId}

Delete an event from the calendar.

**Client method:** `deleteEvent(eventId)`

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `others` | boolean | No | If true, also delete events added at the same time |
| `notBefore` | string (ISO date) | No | Don't delete other events before this date |

**Response:** 204 No Content

---

### GET /api/v1/athlete/{id}

Get athlete profile with sport settings and custom items.

**Client method:** `getAthlete()`

**Response:** `Athlete` (includes timezone, locale, sport settings)

---

## Event Object

### CreateEventInput (what we send)

```typescript
{
  start_date_local: string       // "2026-03-03T00:00:00"
  category: EventCategory        // "WORKOUT", "NOTE", "RACE_A", etc.
  type?: SportType               // "Run", "Ride", "Swim", etc.
  name: string                   // Display name
  description?: string           // Notes or structured workout steps
  distance?: number              // Metres
  moving_time?: number           // Seconds
  target?: TargetType            // "HR", "PACE", "POWER", "AUTO"
  tags?: string[]                // For filtering/grouping
  uid?: string                   // For single-event upsert
  external_id?: string           // For bulk upsert matching
  color?: string                 // Hex color
  indoor?: boolean               // Indoor workout flag
}
```

### Event (what we get back)

Extends `CreateEventInput` with:

```typescript
{
  id: number                     // Unique event ID
  athlete_id: string             // e.g. "i219999"
  icu_training_load?: number     // Computed training load
  icu_atl?: number               // Acute training load (fatigue)
  icu_ctl?: number               // Chronic training load (fitness)
  workout_doc?: object           // Parsed workout structure (if description has steps)
  updated?: string               // Last updated timestamp
  end_date_local?: string        // End date (for multi-day events)
}
```

### EventCategory enum

`WORKOUT` | `RACE_A` | `RACE_B` | `RACE_C` | `NOTE` | `PLAN` | `HOLIDAY` | `SICK` | `INJURED` | `SET_EFTP` | `FITNESS_DAYS` | `SEASON_START` | `TARGET` | `SET_FITNESS`

### SportType enum

`Run` | `Ride` | `Swim` | `WeightTraining` | `Hike` | `Walk` | `TrailRun` | `VirtualRun` | and many more (see OpenAPI spec)

---

## Structured Workout Descriptions

The `description` field serves a dual purpose in the Intervals.icu API — it's both the human-readable notes AND the structured workout definition. Intervals.icu's parser scans the text for step syntax (lines starting with `- `) and converts them into a `workout_doc` object with proper steps, durations, and targets. This `workout_doc` is what gets pushed to Garmin as a guided workout.

### How it works

1. **Plain text at the top** (before any step syntax) is treated as notes/description
2. **Section headers** (plain text lines like `Warm Up`, `Main set 3x`) define workout structure
3. **Step lines** (`- 5m Z2 HR`) become guided steps with targets on your Garmin
4. The API returns a `workout_doc` field with the parsed step objects

### Important: `Z2` vs `Z2 HR`

- `- 5m Z2` → Targets **power** zone 2 (default, useless for running without a power meter)
- `- 5m Z2 HR` → Targets **heart rate** zone 2 (what we want for running)

Always append `HR` for running workouts.

### Example

This description:

```
First run back. FLAT. Stop if dizzy.
Warm Up
- 2m Z1 HR intensity=warmup

Walk/Run 5x
- 1m Z2 HR
- 1m Z1 HR

Cool Down
- 1m Z1 HR intensity=cooldown
```

Gets parsed into this `workout_doc`:

```json
{
  "steps": [
    { "hr": { "units": "hr_zone", "value": 1 }, "duration": 120 },
    {
      "reps": 5,
      "text": "Walk/Run 5x",
      "steps": [
        { "hr": { "units": "hr_zone", "value": 2 }, "duration": 60 },
        { "hr": { "units": "hr_zone", "value": 1 }, "duration": 60 }
      ]
    },
    { "hr": { "units": "hr_zone", "value": 1 }, "duration": 60 }
  ],
  "zoneTimes": [
    { "id": "Z1", "secs": 480 },
    { "id": "Z2", "secs": 300 }
  ]
}
```

On Garmin, this shows as discrete steps: warm up → 5 repeats of run/walk → cool down, with HR zone alerts.

### Step syntax reference

| Element | Syntax | Examples |
|---------|--------|---------|
| Duration | `30s`, `10m`, `1h` | `- 10m Z2 HR` |
| Distance | `2km`, `1mi` | `- 2km Z2 HR` |
| HR zones | `Z1 HR`, `Z2 HR` | `- 30m Z2 HR` |
| HR percentage | `60% HR`, `75% LTHR` | `- 30m 75% HR` |
| Pace zones | `Z4 Pace` | `- 1mi Z4 Pace` |
| Power (% FTP) | `60%`, `88-94%` | `- 8m 88-94%` |
| Repeats | `Nx` after section | `Main set 6x` |
| Sections | Plain text headers | `Warm Up`, `Cool Down` |
| Intensity | `intensity=<type>` | `- 5m Z1 HR intensity=warmup` |

#### Intensity types

The `intensity=` parameter controls how a step appears on the Garmin watch. Without it, all steps show as "Run" (active).

| Intensity | Garmin display | Use for |
|-----------|---------------|---------|
| `warmup` | "Warm Up" | Warm-up steps |
| `cooldown` | "Cool Down" | Cool-down steps |
| `active` | "Run" (default) | Main work steps |
| `recovery` | "Recovery" | Rest/walk intervals |

### How we use it

All 36 workouts in the restart plan use structured descriptions with HR zones:

| Phase | Structure |
|-------|-----------|
| Restart Wk1-3 (walk/run) | Warm up Z1 → Repeating walk/run intervals (Z2/Z1) → Cool down Z1 |
| Restart Wk4 (continuous) | Warm up Z1 → Easy run Z2 → Cool down Z1 |
| Recovery | Single Z1 block |
| Base/Build | Warm up Z1 → Steady/easy run Z2 → Cool down Z1 |
