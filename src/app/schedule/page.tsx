import { getClient } from "@/lib/intervals/server";
import { groupEventsByWeek } from "@/lib/training-utils";
import { todayISO } from "@/lib/date-utils";
import { WeekSection } from "@/components/features/schedule/week-section";

export default async function SchedulePage() {
  const start = todayISO();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 90);
  const end = endDate.toISOString().slice(0, 10);

  const events = await getClient().listEvents(start, end, "WORKOUT");
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
