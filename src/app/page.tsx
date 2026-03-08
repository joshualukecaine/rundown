import { getClient } from "@/lib/intervals/server";
import { groupEventsByWeek, getNextEvent } from "@/lib/training-utils";
import { todayISO } from "@/lib/date-utils";
import { NextActivityCard } from "@/components/features/dashboard/next-run-card";
import { WeekSummaryCard } from "@/components/features/dashboard/week-summary-card";
import { VolumeChart } from "@/components/features/dashboard/volume-chart";

export default async function HomePage() {
  const start = todayISO();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 90);
  const end = endDate.toISOString().slice(0, 10);

  const client = await getClient();
  const events = await client.listEvents(start, end, "WORKOUT");
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
        <NextActivityCard event={nextEvent} />
        <WeekSummaryCard week={currentWeek} />
      </div>

      <VolumeChart weeks={weeks} />
    </div>
  );
}
