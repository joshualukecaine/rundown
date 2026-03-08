import type { Event } from "@/lib/intervals";
import { CheckCircle2, Circle } from "lucide-react";
import { todayISO, formatDate } from "@/lib/date-utils";
import { getDescriptionSummary, getEventDuration } from "@/lib/training-utils";

export function WorkoutRow({ event }: { event: Event }) {
  const today = todayISO();
  const isPast = event.start_date_local.slice(0, 10) < today;

  return (
    <div
      className={`flex items-center gap-4 px-5 py-3 ${
        isPast ? "text-muted-foreground" : "text-foreground"
      }`}
    >
      {isPast ? (
        <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
      ) : (
        <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <span
          className={`text-sm font-semibold ${isPast ? "line-through" : ""}`}
        >
          {event.name}
        </span>
        <p className="text-xs text-muted-foreground truncate">
          {getDescriptionSummary(event.description)}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs text-muted-foreground">
          {formatDate(event.start_date_local)}
        </p>
        <p
          className={`text-sm font-bold font-mono ${!isPast ? "text-foreground" : ""}`}
        >
          {getEventDuration(event) > 0 ? `${getEventDuration(event)} min` : ""}
        </p>
      </div>
    </div>
  );
}
