import { getClient } from "@/lib/intervals/server";
import { groupEventsByWeek, getNextEvent } from "@/lib/utils";
import { NextRunCard } from "@/components/features/dashboard/next-run-card";
import { WeekSummaryCard } from "@/components/features/dashboard/week-summary-card";
import { VolumeChart } from "@/components/features/dashboard/volume-chart";


export default async function HomePage() {
  const events = await getClient().listEvents(
    "2026-03-03",
    "2026-05-25",
    "WORKOUT"
  );
  const weeks = groupEventsByWeek(events);
  const nextEvent = getNextEvent(events);
  const currentWeek = weeks.find((w) => w.isCurrent) ?? null;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Your training at a glance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <NextRunCard event={nextEvent} />
        <WeekSummaryCard week={currentWeek} />
      </div>

      <VolumeChart weeks={weeks} />
    </div>
  );
}
