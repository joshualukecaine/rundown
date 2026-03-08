"use client";

import type { WorkoutSection, WorkoutStep } from "@/lib/training-utils";
import { expandWorkoutSteps } from "@/lib/training-utils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

const ZONE_STYLES: Record<number, { color: string; glow: string; label: string }> = {
  1: { color: "hsl(185 100% 50%)",  glow: "hsl(185 100% 50% / 0.25)", label: "Z1" },
  2: { color: "hsl(270 80% 65%)",   glow: "hsl(270 80% 65% / 0.25)",  label: "Z2" },
  3: { color: "hsl(320 80% 60%)",   glow: "hsl(320 80% 60% / 0.25)",  label: "Z3" },
  4: { color: "hsl(50 100% 60%)",   glow: "hsl(50 100% 60% / 0.25)",  label: "Z4" },
  5: { color: "hsl(0 80% 55%)",     glow: "hsl(0 80% 55% / 0.25)",    label: "Z5" },
};

const ZONE_HEIGHT: Record<number, number> = { 1: 45, 2: 62, 3: 75, 4: 88, 5: 100 };

function getZone(n: number) {
  return ZONE_STYLES[n] ?? ZONE_STYLES[1];
}

interface SectionSpan {
  name: string;
  startIdx: number;
  endIdx: number;
}

function buildSectionSpans(steps: (WorkoutStep & { section: string })[]) {
  const spans: SectionSpan[] = [];
  let currentName = "";
  for (let i = 0; i < steps.length; i++) {
    if (steps[i].section !== currentName) {
      currentName = steps[i].section;
      spans.push({ name: currentName, startIdx: i, endIdx: i });
    } else {
      spans[spans.length - 1].endIdx = i;
    }
  }
  return spans;
}

function buildZoneTotals(steps: (WorkoutStep & { section: string })[]) {
  const totals = new Map<number, number>();
  for (const step of steps) {
    totals.set(step.zoneNumber, (totals.get(step.zoneNumber) ?? 0) + step.duration);
  }
  return [...totals.entries()].sort(([a], [b]) => a - b);
}

function SectionLabels({ spans, stepWidths }: { spans: SectionSpan[]; stepWidths: number[] }) {
  return (
    <div className="relative h-4">
      {spans.map((span) => {
        const left = stepWidths.slice(0, span.startIdx).reduce((a, b) => a + b, 0);
        const width = stepWidths.slice(span.startIdx, span.endIdx + 1).reduce((a, b) => a + b, 0);
        return (
          <span
            key={`${span.name}-${span.startIdx}`}
            className="absolute text-[10px] text-muted-foreground/70 truncate"
            style={{ left: `${left}%`, width: `${width}%` }}
          >
            {span.name}
          </span>
        );
      })}
    </div>
  );
}

function StepBar({ step, widthPct }: { step: WorkoutStep & { section: string }; widthPct: number }) {
  const zone = getZone(step.zoneNumber);
  const heightPct = ZONE_HEIGHT[step.zoneNumber] ?? 50;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="rounded-sm cursor-default border relative overflow-hidden flex items-center justify-center"
          style={{
            width: `${widthPct}%`,
            height: `${heightPct}%`,
            backgroundColor: `color-mix(in srgb, ${zone.color} 30%, transparent)`,
            borderColor: `color-mix(in srgb, ${zone.color} 50%, transparent)`,
            boxShadow: `0 0 12px ${zone.glow}, inset 0 0 8px ${zone.glow}`,
          }}
        >
          {step.label && widthPct > 3 && (
            <span
              className="text-[9px] font-medium leading-none select-none"
              style={{ color: `color-mix(in srgb, ${zone.color} 85%, white)` }}
            >
              {step.label}
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={6}
        className="border border-border bg-card text-card-foreground shadow-lg"
      >
        <div className="text-xs font-mono">
          <p style={{ color: zone.color }}>{step.raw}</p>
          <p className="text-foreground/60">{step.duration}m</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function ZoneLegend({ zoneTotals, totalDuration }: { zoneTotals: [number, number][]; totalDuration: number }) {
  return (
    <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground">
      <span className="font-mono font-semibold text-foreground/60">{totalDuration}m</span>
      {zoneTotals.map(([zone, mins]) => {
        const z = getZone(zone);
        const pct = Math.round((mins / totalDuration) * 100);
        return (
          <div key={zone} className="flex items-center gap-1.5">
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: z.color, opacity: 0.85 }}
            />
            <span>
              <span className="font-semibold text-foreground/70">{z.label}</span>{" "}
              <span className="font-mono">{mins}m</span>{" "}
              <span className="text-muted-foreground/50">{pct}%</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function WorkoutBreakdown({ sections }: { sections: WorkoutSection[] }) {
  const steps = expandWorkoutSteps(sections);
  if (steps.length === 0) return null;

  const totalDuration = steps.reduce((sum, s) => sum + s.duration, 0);
  const stepWidths = steps.map((s) => (s.duration / totalDuration) * 100);
  const sectionSpans = buildSectionSpans(steps);
  const zoneTotals = buildZoneTotals(steps);

  return (
    <div className="mt-5 space-y-1">
      <SectionLabels spans={sectionSpans} stepWidths={stepWidths} />

      <div className="flex items-end gap-[2px]" style={{ height: 56 }}>
        {steps.map((step, i) => (
          <StepBar key={i} step={step} widthPct={stepWidths[i]} />
        ))}
      </div>

      <ZoneLegend zoneTotals={zoneTotals} totalDuration={totalDuration} />
    </div>
  );
}
