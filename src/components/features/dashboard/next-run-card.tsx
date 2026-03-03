import type { Event } from "@/lib/intervals";
import { Calendar, MapPin, Play, ArrowRight } from "lucide-react";
import {
  formatDateLong,
  distanceKm,
  getDescriptionSummary,
  getPhaseColorClass,
  getPhase,
  getEventDistance,
} from "@/lib/utils";

export function NextRunCard({ event }: { event: Event | null }) {
  if (!event) {
    return (
      <div className="rounded-xl synthwave-card p-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-neon-cyan mb-1 uppercase tracking-wider">
          <Play className="h-3 w-3" />
          <span>Next Run</span>
        </div>
        <p className="text-muted-foreground">No upcoming runs</p>
      </div>
    );
  }

  const phase = getPhase(event);
  const phaseColor = getPhaseColorClass(phase);
  const distance = getEventDistance(event);

  // Parse workout sections from description (non-step lines like "Warm Up", "Walk/Run 5x", "Cool Down")
  const sections = event.description
    ?.split("\n")
    .filter((line) => line.trim().length > 0 && !line.startsWith("- "))
    .slice(1) ?? []; // skip first line (it's the summary)

  return (
    <div className="relative overflow-hidden rounded-xl synthwave-card p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/5" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-2 text-xs font-semibold text-neon-cyan mb-1 uppercase tracking-wider">
          <Play className="h-3 w-3" />
          <span>Next Run</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">
          {event.name}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {getDescriptionSummary(event.description)}
        </p>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-4 w-4 text-neon-pink" />
            <span>{formatDateLong(event.start_date_local)}</span>
          </div>
          {distance > 0 && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-4 w-4 text-neon-cyan" />
              <span className="font-semibold text-foreground font-mono">
                {distanceKm(distance)} km
              </span>
            </div>
          )}
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${phaseColor} bg-secondary`}
          >
            {phase}
          </span>
        </div>

        {sections.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {sections.map((section, i) => (
              <div
                key={i}
                className="flex items-center gap-1 text-xs text-muted-foreground"
              >
                {i > 0 && (
                  <ArrowRight className="h-3 w-3 text-neon-purple" />
                )}
                <span className="rounded bg-secondary px-2 py-1 border border-border">
                  {section.trim()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
