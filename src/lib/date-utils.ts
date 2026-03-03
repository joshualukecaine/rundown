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

/** Format ISO date string to display format, e.g. "Tue 3 Mar" */
export function formatDate(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString("en-AU", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** Format ISO date string to long format, e.g. "Tuesday, Mar 3" */
export function formatDateLong(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString("en-AU", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}
