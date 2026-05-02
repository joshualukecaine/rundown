"use client";

import type { Event } from "@/lib/intervals";
import type { ReadinessScore } from "@/lib/wellness-utils";
import { Calendar, MapPin, Play, Loader2, Clock, Activity } from "lucide-react";
import { formatDateLong } from "@/lib/date-utils";
import {
  distanceKm,
  getDescriptionSummary,
  getSportColorClass,
  getActivityLabel,
  getEventDuration,
  parseWorkoutDescription,
} from "@/lib/training-utils";
import { WorkoutBreakdown } from "./workout-breakdown";
import { useEstimatedDistance } from "@/hooks/use-estimated-distance";

const VERDICT_STYLES = {
  success: {
    bg: "bg-[hsl(160_80%_45%/0.08)]",
    border: "border-[hsl(160_80%_45%/0.30)]",
    dotColor: "hsl(160 80% 45%)",
    dotGlow: "0 0 10px hsl(160 80% 45%), 0 0 18px hsl(160 80% 45% / 0.6)",
    labelClass: "text-success",
    text: "Cleared to run",
  },
  warning: {
    bg: "bg-[hsl(38_95%_55%/0.08)]",
    border: "border-[hsl(38_95%_55%/0.32)]",
    dotColor: "hsl(38 95% 60%)",
    dotGlow: "0 0 10px hsl(38 95% 60%)",
    labelClass: "text-[hsl(38_95%_60%)]",
    text: "Take it easy",
  },
  danger: {
    bg: "bg-[hsl(0_80%_55%/0.08)]",
    border: "border-[hsl(0_80%_55%/0.32)]",
    dotColor: "hsl(0 80% 55%)",
    dotGlow: "0 0 10px hsl(0 80% 55%)",
    labelClass: "text-[hsl(0_80%_55%)]",
    text: "Consider resting",
  },
};

interface Props {
  event: Event | null;
  readiness?: ReadinessScore | null;
}

export function NextActivityCard({ event, readiness }: Props) {
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
  const duration = getEventDuration(event);
  const verdict = readiness ? VERDICT_STYLES[readiness.color] : null;

  return (
    <div className="relative overflow-hidden rounded-xl synthwave-card p-6">
      <div className="absolute top-0 right-0 w-[220px] h-[220px] bg-[hsl(320_80%_60%/0.18)] rounded-full blur-[60px] pointer-events-none" />
      <div className="absolute -bottom-10 -left-5 w-[180px] h-[180px] bg-[hsl(185_100%_50%/0.10)] rounded-full blur-[60px] pointer-events-none" />
      <div className="relative">
        <div className="flex justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neon-cyan uppercase tracking-[0.08em]">
              <Play className="h-3 w-3" />
              <span>Next {activityLabel} · Today</span>
            </div>
            <h2 className="text-[28px] font-bold tracking-tight mt-2">
              {event.name}
            </h2>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-[580px]">
              {getDescriptionSummary(event.description)}
            </p>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${sportColor} bg-secondary`}
          >
            {activityLabel}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-[18px] mt-4 text-[13px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-neon-pink" />
            <span>{formatDateLong(event.start_date_local)}</span>
          </div>
          {isLoading ? (
            <div className="flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 text-neon-cyan animate-spin" />
              <span className="text-xs">Estimating…</span>
            </div>
          ) : distance > 0 ? (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-neon-cyan" />
              <span className="font-semibold text-foreground font-mono">
                {isEstimated ? "~" : ""}{distanceKm(distance)} km
                {isEstimated && (
                  <span className="text-xs font-normal text-muted-foreground ml-1">(est.)</span>
                )}
              </span>
            </div>
          ) : null}
          {duration > 0 && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-neon-purple" />
              <span className="font-semibold text-foreground font-mono">{duration} min</span>
            </div>
          )}
          {event.target && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] bg-[hsl(263_35%_18%/0.6)] border border-border text-muted-foreground">
              <Activity className="h-3 w-3" />
              HR Z1–Z2
            </span>
          )}
        </div>

        {verdict && readiness && (
          <div className={`flex items-center gap-3 mt-5 p-3 rounded-[10px] ${verdict.bg} border ${verdict.border}`}>
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse-soft"
              style={{ backgroundColor: verdict.dotColor, boxShadow: verdict.dotGlow }}
            />
            <div className="flex-1 min-w-0">
              <span className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${verdict.labelClass}`}>
                {verdict.text}
              </span>
              <div className="text-sm text-foreground mt-0.5">
                {readiness.summary}
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] bg-[hsl(263_35%_18%/0.6)] border border-border text-muted-foreground">
              {readiness.score} / 100
            </span>
          </div>
        )}

        <WorkoutBreakdown sections={sections} />
      </div>
    </div>
  );
}
