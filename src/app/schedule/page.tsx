import { getClient } from "@/lib/intervals/server";
import { groupEventsByWeek } from "@/lib/utils";
import { WeekSection } from "@/components/features/schedule/week-section";

export default async function SchedulePage() {
  const events = await getClient().listEvents(
    "2026-03-03",
    "2026-05-25",
    "WORKOUT"
  );
  const weeks = groupEventsByWeek(events);

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
        <p className="text-sm text-muted-foreground">All 12 weeks of your plan</p>
      </div>
      {weeks.map((week) => (
        <WeekSection key={week.weekStart} week={week} />
      ))}
    </div>
  );
}
