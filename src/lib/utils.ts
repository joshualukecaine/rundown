import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Event } from "@/lib/intervals"
import type { TrainingWeek } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Normalise a date string to YYYY-MM-DD (strip any T suffix the API adds) */
function dateOnly(dateStr: string): string {
  return dateStr.slice(0, 10);
}

/** Parse a date string into a local Date, handling both "2026-03-03" and "2026-03-03T00:00:00" */
function parseLocalDate(dateStr: string): Date {
  return new Date(dateOnly(dateStr) + "T00:00:00");
}

/** Get ISO date string for today */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Get the Monday of the week containing the given date */
export function getWeekStart(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

/** Format metres to km display string */
export function formatDistance(metres: number): string {
  return `${(metres / 1000).toFixed(1)}km`;
}

/** Format ISO date string to display format, e.g. "Tue 3 Mar" */
export function formatDate(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString("en-AU", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** Extract phase name from event tags. Falls back to "Unknown". */
export function getPhase(event: Event): string {
  return event.tags?.[0] ?? "Unknown";
}

/** Group a flat list of events into TrainingWeek objects */
export function groupEventsByWeek(events: Event[]): TrainingWeek[] {
  const today = todayISO();
  const currentWeekStart = getWeekStart(today);
  const weekMap = new Map<string, Event[]>();

  const sorted = [...events].sort((a, b) =>
    a.start_date_local.localeCompare(b.start_date_local)
  );

  for (const event of sorted) {
    const ws = getWeekStart(event.start_date_local.slice(0, 10));
    if (!weekMap.has(ws)) weekMap.set(ws, []);
    weekMap.get(ws)!.push(event);
  }

  return Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, weekEvents], index) => ({
      weekStart,
      weekNumber: index + 1,
      phase: getPhase(weekEvents[0]),
      events: weekEvents,
      totalDistance: weekEvents.reduce((sum, e) => sum + getEventDistance(e), 0),
      completedDistance: weekEvents
        .filter((e) => e.start_date_local.slice(0, 10) < today)
        .reduce((sum, e) => sum + getEventDistance(e), 0),
      isCurrent: weekStart === currentWeekStart,
      isPast: weekStart < currentWeekStart,
    }));
}

/** Get the next upcoming event (today or later) */
export function getNextEvent(events: Event[]): Event | null {
  const today = todayISO();
  return (
    events
      .filter((e) => e.start_date_local.slice(0, 10) >= today)
      .sort((a, b) => a.start_date_local.localeCompare(b.start_date_local))[0] ??
    null
  );
}

/** Get the first line of a description (the human-readable note) */
export function getDescriptionSummary(description: string | undefined): string {
  if (!description) return "";
  return description.split("\n")[0];
}

/** Get the base phase name from a tag like "Restart Wk1" → "Restart" */
export function getBasePhase(phase: string): string {
  if (phase.startsWith("Restart")) return "Restart";
  if (phase.startsWith("Recovery")) return "Recovery";
  if (phase.startsWith("Base")) return "Base";
  if (phase.startsWith("Build")) return "Build";
  return "Restart";
}

/** Get phase text color CSS class */
export function getPhaseColorClass(phase: string): string {
  switch (getBasePhase(phase)) {
    case "Restart": return "phase-restart";
    case "Recovery": return "phase-recovery";
    case "Base": return "phase-base";
    case "Build": return "phase-build";
    default: return "phase-restart";
  }
}

/** Get phase bg CSS class */
export function getPhaseBgClass(phase: string): string {
  switch (getBasePhase(phase)) {
    case "Restart": return "bg-phase-restart";
    case "Recovery": return "bg-phase-recovery";
    case "Base": return "bg-phase-base";
    case "Build": return "bg-phase-build";
    default: return "bg-phase-restart";
  }
}

/** Format distance in km as a number (for display with separate unit) */
export function distanceKm(metres: number): number {
  return Math.round((metres / 1000) * 10) / 10;
}

/** Format ISO date string to long format, e.g. "Tuesday, Mar 3" */
export function formatDateLong(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString("en-AU", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

/**
 * Get the distance in metres for an event.
 * The Intervals.icu API doesn't return a `distance` field for planned workouts,
 * so we parse it from the event name (e.g. "Run: 1.5km" → 1500).
 */
export function getEventDistance(event: Event): number {
  if (event.distance && event.distance > 0) return event.distance;
  const match = event.name.match(/([\d.]+)\s*km/i);
  if (match) return parseFloat(match[1]) * 1000;
  return 0;
}
