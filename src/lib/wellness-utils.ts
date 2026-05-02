import type { Wellness } from "@/lib/intervals";

export interface ReadinessScore {
  score: number;           // 0–100
  label: string;           // "Recovered", "Moderate", "Fatigued"
  color: "success" | "warning" | "danger";
  summary: string;         // One-line verdict
}

export interface MetricSummary {
  current: number | null;
  baseline: number | null;  // 7-day average
  delta: number | null;
  sparkline: number[];      // last 7 values
}

/** Score readiness 0-100 from today's wellness + recent baselines */
export function scoreReadiness(today: Wellness | undefined, recent: Wellness[]): number {
  if (!today) return 0;

  let score = 50;

  const hrvBaseline = averageNonNull(recent.map((w) => w.hrv));
  if (today.hrv != null && hrvBaseline != null) {
    score += Math.min(15, Math.max(-15, (today.hrv - hrvBaseline) * 2));
  }

  const rhrBaseline = averageNonNull(recent.map((w) => w.restingHR));
  if (today.restingHR != null && rhrBaseline != null) {
    score += Math.min(10, Math.max(-10, (rhrBaseline - today.restingHR) * 3));
  }

  if (today.sleepScore != null) {
    score += Math.min(25, Math.max(-15, (today.sleepScore - 60) * 0.5));
  }

  return Math.round(Math.min(100, Math.max(0, score)));
}

/** Format a readiness score + wellness data into a labelled result */
export function formatReadiness(score: number, today: Wellness | undefined, recent: Wellness[]): ReadinessScore {
  if (!today) {
    return { score: 0, label: "No data", color: "warning", summary: "No wellness data available today." };
  }

  const parts: string[] = [];
  const hrvBaseline = averageNonNull(recent.map((w) => w.hrv));
  if (today.hrv != null && hrvBaseline != null) {
    const d = Math.round(today.hrv - hrvBaseline);
    parts.push(`HRV ${d >= 0 ? "+" : ""}${d} vs baseline`);
  }
  if (today.sleepScore != null) parts.push(`sleep ${today.sleepScore}`);
  const rhrBaseline = averageNonNull(recent.map((w) => w.restingHR));
  if (today.restingHR != null && rhrBaseline != null) {
    const d = Math.round(today.restingHR - rhrBaseline);
    parts.push(`RHR ${today.restingHR} (${d >= 0 ? "+" : ""}${d})`);
  }

  if (score >= 70) {
    return { score, label: "Recovered", color: "success", summary: `You're recovered — ${parts.join(" · ")}.` };
  }
  if (score >= 40) {
    return { score, label: "Moderate", color: "warning", summary: `Recovery moderate — ${parts.join(" · ")}.` };
  }
  return { score, label: "Fatigued", color: "danger", summary: `Recovery low — ${parts.join(" · ")}. Consider going easier.` };
}

/** Compute a simple readiness score from today's wellness data + recent history */
export function computeReadiness(today: Wellness | undefined, recent: Wellness[]): ReadinessScore {
  return formatReadiness(scoreReadiness(today, recent), today, recent);
}

/** Compute metric summary for a single metric from wellness history */
export function metricSummary(data: Wellness[], getter: (w: Wellness) => number | null): MetricSummary {
  const values = data.map(getter);
  const last7 = values.slice(-7);
  const nonNull = last7.filter((v): v is number => v != null);
  const baseline = nonNull.length > 0 ? Math.round((nonNull.reduce((a, b) => a + b, 0) / nonNull.length) * 10) / 10 : null;
  const current = values[values.length - 1] ?? null;
  const delta = current != null && baseline != null ? Math.round((current - baseline) * 10) / 10 : null;

  return {
    current,
    baseline,
    delta,
    sparkline: last7.map((v) => v ?? 0),
  };
}

export function averageNonNull(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v != null);
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

/** Format seconds to "7h 12m" */
export function formatSleepDuration(secs: number | null): string {
  if (!secs) return "—";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

/** Map sleep quality number to label */
export function sleepQualityLabel(quality: number | null): string {
  switch (quality) {
    case 1: return "Excellent";
    case 2: return "Good";
    case 3: return "Fair";
    case 4: return "Poor";
    default: return "—";
  }
}
