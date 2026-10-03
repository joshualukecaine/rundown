# Viewing Training via Intervals.icu API

## This week's plan

```bash
npx tsx -e '
const { IntervalsClient } = require("./src/lib/intervals/client");
const c = IntervalsClient.fromEnv();
c.listEvents("2026-10-03", "2026-10-11").then((e: any[]) =>
  e.forEach((x: any) => console.log(x.start_date_local?.slice(0,10), x.type, x.name))
);'
```

## Completed activities

```bash
npx tsx -e '
const { IntervalsClient } = require("./src/lib/intervals/client");
const c = IntervalsClient.fromEnv();
c.listActivities("2026-10-03", "2026-10-11").then((a: any[]) =>
  a.filter((x: any) => x.type).forEach((x: any) =>
    console.log(x.start_date_local?.slice(0,10), x.type, x.name, Math.round((x.moving_time||0)/60)+"m", ((x.distance||0)/1000).toFixed(1)+"km", "HR:", x.average_heartrate)
  )
);'
```

## Wellness (weight, HRV, RHR, sleep)

```bash
npx tsx -e '
const { IntervalsClient } = require("./src/lib/intervals/client");
const c = IntervalsClient.fromEnv();
c.getWellness("2026-10-03", "2026-10-11").then((w: any[]) =>
  w.forEach((d: any) => console.log(d.id, "wt:", d.weight, "hrv:", d.hrv, "rhr:", d.restingHR, "sleep:", d.sleepScore))
);'
```

## Gym sessions (Hevy API)

```bash
curl -s -H "api-key: $HEVY_API_KEY" "https://api.hevyapp.com/v1/workouts?page=1&pageSize=5" | python3 -c "
import json, sys
for w in json.load(sys.stdin).get('workouts', []):
    print(w.get('start_time','')[:10], w.get('title'))
    for e in w.get('exercises', []):
        sets = ', '.join(f\"{s['weight_kg']}kg x {s['reps']}\" for s in e.get('sets', []))
        print(f'  {e[\"title\"]} - {sets}')
"
```

## Notes

- Dates are `YYYY-MM-DD` format, adjust as needed.
- `IntervalsClient.fromEnv()` reads `INTERVALS_API_KEY` and `INTERVALS_ATHLETE_ID` from `.env`.
- Hevy API uses `HEVY_API_KEY` from `.env`.
- Strava-sourced activities return minimal data via Intervals.icu API (id/date only).
