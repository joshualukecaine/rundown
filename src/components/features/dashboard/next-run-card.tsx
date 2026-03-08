"use client";

import type { Event } from "@/lib/intervals";
import { Calendar, MapPin, Play, Loader2 } from "lucide-react";
import { formatDateLong } from "@/lib/date-utils";
import {
  distanceKm,
  getDescriptionSummary,
  getSportColorClass,
  getActivityLabel,
  parseWorkoutDescription,
} from "@/lib/training-utils";
import { WorkoutBreakdown } from "./workout-breakdown";
import { useEstimatedDistance } from "@/hooks/use-estimated-distance";

export function NextActivityCard({ event }: { event: Event | null }) {
  const { distance, isEstimated, isLoading } = useEstimatedDistance(event);

  if (!event) {
    return (
      <div className="rounded-xl synthwave-card p-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-neon-cyan mb-1 uppercase tracking-wider">
          <Play className="h-3 w-3" />
          <span>Next Session</span>
        </div>
        <p className="text-muted-foreground">No upcoming sessions</p>
      </div>
    );
  }

  const activityLabel = getActivityLabel(event);
  const sportColor = getSportColorClass(event.type);
  const sections = parseWorkoutDescription(event.description);

  return (
    <div className="relative overflow-hidden rounded-xl synthwave-card p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/5" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-2 text-xs font-semibold text-neon-cyan mb-1 uppercase tracking-wider">
          <Play className="h-3 w-3" />
          <span>Next {activityLabel}</span>
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
          {isLoading ? (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Loader2 className="h-4 w-4 text-neon-cyan animate-spin" />
              <span className="text-xs">Estimating distance…</span>
            </div>
          ) : distance > 0 ? (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-4 w-4 text-neon-cyan" />
              <span className="font-semibold text-foreground font-mono">
                {isEstimated ? "~" : ""}{distanceKm(distance)} km
                {isEstimated && (
                  <span className="text-xs font-normal text-muted-foreground ml-1">(est.)</span>
                )}
              </span>
            </div>
          ) : null}
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${sportColor} bg-secondary`}
          >
            {activityLabel}
          </span>
        </div>

        <WorkoutBreakdown sections={sections} />
      </div>
    </div>
  );
}
