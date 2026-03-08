import type { Event } from "@/lib/intervals";

/** A week of training events, grouped for display */
export interface TrainingWeek {
  /** Monday of this week, ISO date string */
  weekStart: string;
  /** 1-indexed week number in the plan */
  weekNumber: number;
  /** Phase name from tags, e.g. "Restart Wk1", "Base Wk3", "Recovery" */
  phase: string;
  /** Events in this week, sorted by date */
  events: Event[];
  /** Total planned distance for the week in metres */
  totalDistance: number;
  /** Total planned duration for the week in minutes */
  totalDuration: number;
  /** Distance completed so far (past events) in metres */
  completedDistance: number;
  /** Whether this is the current week */
  isCurrent: boolean;
  /** Whether this week is entirely in the past */
  isPast: boolean;
}
