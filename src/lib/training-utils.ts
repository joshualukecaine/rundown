import type { Event } from "@/lib/intervals";
import type { TrainingWeek } from "@/types";
import { todayISO, getWeekStart } from "@/lib/date-utils";

/** Format metres to km display string */
export function formatDistance(metres: number): string {
  return `${(metres / 1000).toFixed(1)}km`;
}

/** Format distance in km as a number (for display with separate unit) */
export function distanceKm(metres: number): number {
  return Math.round((metres / 1000) * 10) / 10;
}

/** Get the first line of a description (the human-readable note) */
export function getDescriptionSummary(description: string | undefined): string {
  if (!description) return "";
  return description.split("\n")[0];
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

/**
 * Get the planned duration in minutes for an event.
 * Uses moving_time from the API (seconds), or parses from name (e.g. "Run: 23m" → 23).
 */
export function getEventDuration(event: Event): number {
  if (event.moving_time && event.moving_time > 0) return Math.round(event.moving_time / 60);
  const match = event.name.match(/([\d]+)\s*m$/i);
  if (match) return parseInt(match[1], 10);
  return 0;
}

/** Extract phase name from event tags. Falls back to "Unknown". */
export function getPhase(event: Event): string {
  return event.tags?.[0] ?? "Unknown";
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

/** Get a human-readable activity label from an event's sport type */
export function getActivityLabel(event: Event): string {
  return getSportLabel(event.type);
}

/** Map a sport type string to a display label */
export function getSportLabel(type: string | undefined): string {
  switch (type) {
    case "Run":
    case "TrailRun":
    case "VirtualRun":
      return "Run";
    case "Ride":
    case "VirtualRide":
      return "Ride";
    case "Swim":
      return "Swim";
    case "WeightTraining":
      return "Weights";
    case "Hike":
      return "Hike";
    case "Walk":
      return "Walk";
    default:
      return "Session";
  }
}

/** Get sport-type color CSS class */
export function getSportColorClass(type: string | undefined): string {
  switch (getSportLabel(type)) {
    case "Run": return "phase-base";
    case "Ride": return "phase-build";
    case "Swim": return "phase-restart";
    case "Weights": return "phase-recovery";
    default: return "phase-restart";
  }
}

export interface WorkoutStep {
  /** Duration in minutes */
  duration: number;
  /** Zone label, e.g. "Z1", "Z2" */
  zone: string;
  /** Zone number (1-5) */
  zoneNumber: number;
  /** Raw step text, e.g. "2m Z1 HR (96-121bpm)" */
  raw: string;
  /** Optional step label, e.g. "Run", "Walk" */
  label?: string;
}

export interface WorkoutSection {
  /** Section name, e.g. "Warm Up", "Walk/Run 7x", "Cool Down" */
  name: string;
  /** Repeat count (default 1) */
  repeat: number;
  /** Steps within this section */
  steps: WorkoutStep[];
}

/**
 * Parse a workout description into structured sections with steps.
 *
 * Expected format:
 *   Summary line (skipped)
 *   Section Name [Nx]
 *   - <duration>m Z<n> HR [(...)]
 *   - <duration>m Z<n> HR [(...)]
 *   Another Section
 *   - <duration>m Z<n> HR [(...)]
 */
export function parseWorkoutDescription(description: string | undefined): WorkoutSection[] {
  if (!description) return [];
  const lines = description.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const sections: WorkoutSection[] = [];
  let current: WorkoutSection | null = null;

  // Skip first line (summary)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith("- ")) {
      // Step line: "- Run 2m Z2 HR" or "- 1m Z1 HR intensity=warmup"
      const stepMatch = line.match(/(\d+)m\s+Z(\d)/);
      if (stepMatch && current) {
        let raw = line.slice(2).trim();
        // Strip intensity= parameter (used by Garmin, not needed in display)
        raw = raw.replace(/\s*intensity=\w+/, "");
        // Extract optional label (e.g. "Run", "Walk") before the duration
        const labelMatch = raw.match(/^([A-Za-z]+)\s+\d+m/);
        current.steps.push({
          duration: parseInt(stepMatch[1], 10),
          zone: `Z${stepMatch[2]}`,
          zoneNumber: parseInt(stepMatch[2], 10),
          raw,
          label: labelMatch ? labelMatch[1] : undefined,
        });
      }
    } else {
      // Section header: "Warm Up", "Walk/Run 7x", "Cool Down"
      const repeatMatch = line.match(/(\d+)x\s*$/);
      current = {
        name: line,
        repeat: repeatMatch ? parseInt(repeatMatch[1], 10) : 1,
        steps: [],
      };
      sections.push(current);
    }
  }

  return sections;
}

/**
 * Expand parsed workout sections into a flat list of steps
 * (with repeats unrolled) for visualization.
 */
export function expandWorkoutSteps(sections: WorkoutSection[]): (WorkoutStep & { section: string })[] {
  const steps: (WorkoutStep & { section: string })[] = [];
  for (const section of sections) {
    for (let r = 0; r < section.repeat; r++) {
      for (const step of section.steps) {
        steps.push({ ...step, section: section.name });
      }
    }
  }
  return steps;
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
      totalDuration: weekEvents.reduce((sum, e) => sum + getEventDuration(e), 0),
      completedDistance: weekEvents
        .filter((e) => e.start_date_local.slice(0, 10) < today)
        .reduce((sum, e) => sum + getEventDistance(e), 0),
      isCurrent: weekStart === currentWeekStart,
      isPast: weekStart < currentWeekStart,
    }));
}
