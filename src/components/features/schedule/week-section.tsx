import type { TrainingWeek } from "@/types";
import { WorkoutRow } from "./workout-row";
import { distanceKm, getPhaseColorClass, cn } from "@/lib/utils";

export function WeekSection({ week }: { week: TrainingWeek }) {
  const phaseColor = getPhaseColorClass(week.phase);
  const isPast = week.events.every(
    (e) => e.start_date_local.slice(0, 10) < new Date().toISOString().slice(0, 10)
  );

  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden transition-all synthwave-card",
        week.isCurrent && "neon-glow-pink",
        isPast && !week.isCurrent && "opacity-60"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between px-5 py-3 border-b border-border",
          week.isCurrent && "bg-primary/8"
        )}
      >
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold">Week {week.weekNumber}</h3>
          <span
            className={`text-xs font-semibold ${phaseColor} rounded-full bg-secondary px-2 py-0.5`}
          >
            {week.phase}
          </span>
          {week.isCurrent && (
            <span className="text-[10px] font-bold text-neon-pink bg-primary/15 rounded-full px-2 py-0.5 uppercase tracking-wider">
              Current
            </span>
          )}
        </div>
        <span className="text-sm font-semibold text-muted-foreground font-mono">
          {distanceKm(week.totalDistance)} km
        </span>
      </div>

      <div className="divide-y divide-border">
        {week.events.map((event) => (
          <WorkoutRow key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
