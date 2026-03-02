import { IntervalsClient } from "../../src/lib/intervals/index.js";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function listEvents(options: { from?: string; to?: string; raw?: boolean }) {
  const client = IntervalsClient.fromEnv();
  const oldest = options.from ?? todayISO();
  const newest = options.to ?? addDays(oldest, 30);

  console.log(`Listing events: ${oldest} → ${newest}\n`);
  const events = await client.listEvents(oldest, newest);

  if (events.length === 0) {
    console.log("No events found.");
    return;
  }

  if (options.raw) {
    console.log(JSON.stringify(events, null, 2));
    return;
  }

  let currentWeek = "";
  let weekTotal = 0;

  for (const e of events) {
    const weekStart = getWeekStart(e.start_date_local);
    if (weekStart !== currentWeek) {
      if (currentWeek) {
        console.log(`  ${"─".repeat(40)}  Week total: ${(weekTotal / 1000).toFixed(1)}km\n`);
      }
      currentWeek = weekStart;
      weekTotal = 0;
    }

    const dist = e.distance ? `${(e.distance / 1000).toFixed(1)}km` : "";
    const tags = e.tags?.length ? `[${e.tags.join(", ")}]` : "";
    console.log(`  ${e.start_date_local}  ${padRight(e.name, 25)}  ${padRight(dist, 8)}  ${tags}`);
    weekTotal += e.distance ?? 0;
  }

  if (currentWeek) {
    console.log(`  ${"─".repeat(40)}  Week total: ${(weekTotal / 1000).toFixed(1)}km`);
  }

  const totalDist = events.reduce((sum, e) => sum + (e.distance ?? 0), 0);
  console.log(`\n${events.length} events | Total: ${(totalDist / 1000).toFixed(1)}km`);
}

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

function padRight(s: string, len: number): string {
  return s.padEnd(len);
}
