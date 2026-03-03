import { IntervalsClient } from "../../src/lib/intervals/index.js";
import type { Activity } from "../../src/lib/intervals/index.js";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function subtractDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}m`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatPace(distanceM: number, movingTimeSec: number): string {
  if (!distanceM || !movingTimeSec) return "";
  const secPerKm = movingTimeSec / (distanceM / 1000);
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")}/km`;
}

function padRight(s: string, len: number): string {
  return s.padEnd(len);
}

function printWeeklySummary(
  weeks: Map<string, Activity[]>,
  sport: string,
) {
  console.log(`\nWeekly summary (${sport}):\n`);
  console.log(
    `  ${"Week".padEnd(12)}  ${"Runs".padStart(4)}  ${"Distance".padStart(10)}  ${"Time".padStart(8)}`,
  );
  console.log(`  ${"─".repeat(42)}`);

  let grandRuns = 0;
  let grandDist = 0;
  let grandTime = 0;

  for (const [week, acts] of weeks) {
    const dist = acts.reduce((s, a) => s + (a.distance ?? 0), 0);
    const time = acts.reduce((s, a) => s + (a.moving_time ?? 0), 0);
    console.log(
      `  ${week.padEnd(12)}  ${String(acts.length).padStart(4)}  ${((dist / 1000).toFixed(1) + "km").padStart(10)}  ${formatDuration(time).padStart(8)}`,
    );
    grandRuns += acts.length;
    grandDist += dist;
    grandTime += time;
  }

  console.log(`  ${"─".repeat(42)}`);
  console.log(
    `  ${"TOTAL".padEnd(12)}  ${String(grandRuns).padStart(4)}  ${((grandDist / 1000).toFixed(1) + "km").padStart(10)}  ${formatDuration(grandTime).padStart(8)}`,
  );
}

export async function listActivities(options: {
  from?: string;
  to?: string;
  weeks?: number;
  sport?: string;
  summary?: boolean;
  raw?: boolean;
}) {
  const client = IntervalsClient.fromEnv();
  const sport = options.sport ?? "Run";
  const newest = options.to ?? todayISO();
  const oldest =
    options.from ?? subtractDays(newest, (options.weeks ?? 12) * 7);

  console.log(`Fetching ${sport} activities: ${oldest} → ${newest}\n`);

  const all = await client.listActivities(oldest, newest);
  const activities = all.filter(
    (a) => a.type.toLowerCase() === sport.toLowerCase(),
  );

  if (activities.length === 0) {
    console.log("No activities found.");
    return;
  }

  if (options.raw) {
    console.log(JSON.stringify(activities, null, 2));
    return;
  }

  // Group by week for summary or separators
  const byWeek = new Map<string, Activity[]>();
  for (const a of activities) {
    const wk = getWeekStart(a.start_date_local);
    if (!byWeek.has(wk)) byWeek.set(wk, []);
    byWeek.get(wk)!.push(a);
  }

  if (options.summary) {
    printWeeklySummary(byWeek, sport);
    return;
  }

  // Full listing grouped by week
  let currentWeek = "";
  let weekDist = 0;

  for (const a of activities) {
    const wk = getWeekStart(a.start_date_local);

    if (wk !== currentWeek) {
      if (currentWeek) {
        console.log(
          `  ${"─".repeat(52)}  Week: ${(weekDist / 1000).toFixed(1)}km\n`,
        );
      }
      currentWeek = wk;
      weekDist = 0;
      console.log(`  Week of ${wk}`);
    }

    const dist = a.distance ? (a.distance / 1000).toFixed(1) + "km" : "—";
    const time = a.moving_time ? formatDuration(a.moving_time) : "—";
    const pace =
      a.distance && a.moving_time
        ? formatPace(a.distance, a.moving_time)
        : "—";
    const hr = a.average_heartrate ? `HR:${Math.round(a.average_heartrate)}` : "";
    const load = a.icu_training_load
      ? `Load:${Math.round(a.icu_training_load)}`
      : "";

    console.log(
      `  ${a.start_date_local}  ${padRight(a.name, 28)}  ${padRight(dist, 7)}  ${padRight(time, 8)}  ${padRight(pace, 10)}  ${padRight(hr, 8)}  ${load}`,
    );

    weekDist += a.distance ?? 0;
  }

  if (currentWeek) {
    console.log(
      `  ${"─".repeat(52)}  Week: ${(weekDist / 1000).toFixed(1)}km`,
    );
  }

  const totalDist = activities.reduce((s, a) => s + (a.distance ?? 0), 0);
  const totalTime = activities.reduce((s, a) => s + (a.moving_time ?? 0), 0);
  console.log(
    `\n${activities.length} activities | Total: ${(totalDist / 1000).toFixed(1)}km | Time: ${formatDuration(totalTime)}`,
  );
}
