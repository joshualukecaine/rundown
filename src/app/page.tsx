import { getClient } from "@/lib/intervals/server";
import { groupEventsByWeek, getNextEvent } from "@/lib/training-utils";
import { todayISO, addDays } from "@/lib/date-utils";
import {
  computeReadiness,
  metricSummary,
  formatSleepDuration,
  sleepQualityLabel,
} from "@/lib/wellness-utils";
import { NextActivityCard } from "@/components/features/dashboard/next-run-card";
import { WeekSummaryCard } from "@/components/features/dashboard/week-summary-card";
import { ReadinessRow } from "@/components/features/dashboard/wellness-chart";
import { HrvTrendChart, FormCurveChart } from "@/components/features/dashboard/trend-charts";
import { VolumeChart } from "@/components/features/dashboard/volume-chart";

export default async function HomePage() {
  const today = todayISO();
  const end = addDays(90);
  const wellnessFrom = addDays(-28);

  const client = await getClient();
  const [events, wellness] = await Promise.all([
    client.listEvents(today, end, "WORKOUT"),
    client.getWellness(wellnessFrom, today),
  ]);

  const weeks = groupEventsByWeek(events);
  const nextEvent = getNextEvent(events);
  const currentWeek = weeks.find((w) => w.isCurrent) ?? null;

  // Wellness computations
  const todayWellness = wellness.find((w) => w.id === today);
  const readiness = computeReadiness(todayWellness, wellness.slice(-7));
  const hrvMetric = metricSummary(wellness, (w) => w.hrv);
  const rhrMetric = metricSummary(wellness, (w) => w.restingHR);
  const sleepMetric = metricSummary(wellness, (w) => w.sleepScore);
  const sleepDuration = formatSleepDuration(todayWellness?.sleepSecs ?? null);
  const sleepQuality = sleepQualityLabel(todayWellness?.sleepQuality ?? null);

  const dateLabel = new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <div className="space-y-4">
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-[13px] text-muted-foreground">
          Your training at a glance · <span className="font-mono">{dateLabel}</span>
        </p>
      </div>

      {/* Row 1: Next Session + This Week */}
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <NextActivityCard event={nextEvent} readiness={readiness} />
        <WeekSummaryCard week={currentWeek} />
      </div>

      {/* Row 2: Readiness cards */}
      <ReadinessRow
        readiness={readiness}
        sleep={sleepMetric}
        sleepDuration={sleepDuration}
        sleepQuality={sleepQuality}
        hrv={hrvMetric}
        rhr={rhrMetric}
      />

      {/* Row 3: Trend charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <HrvTrendChart data={wellness} />
        <FormCurveChart data={wellness} />
      </div>

      {/* Row 4: 12-week volume */}
      <VolumeChart weeks={weeks} />

      {/* Footer source row */}
      <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground/70 pt-2">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[hsl(320_80%_60%)]" />
          Plan: Intervals.icu
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[hsl(185_100%_50%)]" />
          Health: Garmin Connect
        </span>
      </div>
    </div>
  );
}
