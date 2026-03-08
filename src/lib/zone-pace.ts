import type { Interval } from "@/lib/intervals";

export type ZonePaceMap = Record<number, number>;

export function computeZonePace(allIntervals: Interval[]): ZonePaceMap {
  const accum = new Map<number, { weightedSpeed: number; totalTime: number }>();

  for (const interval of allIntervals) {
    if (interval.average_speed <= 0 || interval.moving_time <= 0) continue;
    if (interval.zone < 1 || interval.zone > 5) continue;

    const existing = accum.get(interval.zone) ?? { weightedSpeed: 0, totalTime: 0 };
    existing.weightedSpeed += interval.average_speed * interval.moving_time;
    existing.totalTime += interval.moving_time;
    accum.set(interval.zone, existing);
  }

  const result: ZonePaceMap = {};
  for (const [zone, { weightedSpeed, totalTime }] of accum) {
    result[zone] = weightedSpeed / totalTime;
  }
  return result;
}

export function estimateWorkoutDistance(
  steps: { duration: number; zoneNumber: number }[],
  zonePace: ZonePaceMap,
): number {
  const allSpeeds = Object.values(zonePace);
  const fallbackSpeed =
    allSpeeds.length > 0
      ? allSpeeds.reduce((a, b) => a + b, 0) / allSpeeds.length
      : 0;

  let totalMetres = 0;
  for (const step of steps) {
    const speed = zonePace[step.zoneNumber] ?? fallbackSpeed;
    totalMetres += speed * step.duration * 60;
  }
  return totalMetres;
}
