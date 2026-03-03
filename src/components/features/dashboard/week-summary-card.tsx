import type { TrainingWeek } from "@/types";
import { CheckCircle2, Circle } from "lucide-react";
import {
  todayISO,
  distanceKm,
  getPhaseColorClass,
  getEventDistance,
} from "@/lib/utils";

export function WeekSummaryCard({ week }: { week: TrainingWeek | null }) {
  if (!week) {
    return (
      <div className="rounded-xl synthwave-card p-6">
        <p className="text-xs font-semibold text-neon-cyan uppercase tracking-wider">
          This Week
        </p>
        <p className="text-muted-foreground mt-2">No training this week</p>
      </div>
    );
  }

  const today = todayISO();
  const completed = week.events.filter(
    (e) => e.start_date_local.slice(0, 10) < today
  ).length;
  const total = week.events.length;
  const phaseColor = getPhaseColorClass(week.phase);

  return (
    <div className="rounded-xl synthwave-card p-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-semibold text-neon-cyan uppercase tracking-wider">
            This Week
          </p>
          <h3 className="text-lg font-bold">Week {week.weekNumber}</h3>
        </div>
        <span
          className={`text-xs font-semibold ${phaseColor} rounded-full bg-secondary px-2.5 py-1`}
        >
          {week.phase}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-2xl font-bold font-mono">
            {distanceKm(week.totalDistance)}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              km
            </span>
          </p>
          <p className="text-xs text-muted-foreground">Total distance</p>
        </div>
        <div>
          <p className="text-2xl font-bold font-mono">
            {completed}
            <span className="text-sm font-normal text-muted-foreground">
              /{total}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">Runs completed</p>
        </div>
      </div>

      <div className="flex gap-2">
        {week.events.map((e) => {
          const isPast = e.start_date_local.slice(0, 10) < today;
          return (
            <div
              key={e.id}
              className="flex items-center gap-1 text-xs text-muted-foreground"
            >
              {isPast ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/40" />
              )}
              <span
                className={`font-mono ${isPast ? "text-success line-through" : ""}`}
              >
                {distanceKm(getEventDistance(e))}km
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
