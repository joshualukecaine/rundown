"use client";

import type { TrainingWeek } from "@/types";
import { getBasePhase, getPhaseBgClass } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface Props {
  weeks: TrainingWeek[];
}

export function VolumeChart({ weeks }: Props) {
  const currentWeekNumber =
    weeks.find((w) => w.isCurrent)?.weekNumber ?? 0;

  const data = weeks.map((w) => {
    const completedKm = Math.round((w.completedDistance / 1000) * 10) / 10;
    const totalKm = Math.round((w.totalDistance / 1000) * 10) / 10;
    return {
      week: `W${w.weekNumber}`,
      completed: completedKm,
      remaining: Math.max(0, Math.round((totalKm - completedKm) * 10) / 10),
      total: totalKm,
      phase: w.phase,
      isCurrent: w.isCurrent,
      isPast: w.isPast,
      weekNumber: w.weekNumber,
    };
  });

  // Build phase legend
  const phases: { name: string; startWeek: number; endWeek: number }[] = [];
  for (const w of weeks) {
    const base = getBasePhase(w.phase);
    const last = phases[phases.length - 1];
    if (last?.name === base) {
      last.endWeek = w.weekNumber;
    } else {
      phases.push({
        name: base,
        startWeek: w.weekNumber,
        endWeek: w.weekNumber,
      });
    }
  }

  return (
    <div className="rounded-xl synthwave-card p-6">
      <h3 className="text-xs font-semibold text-neon-cyan uppercase tracking-wider mb-1">
        12-Week Volume
      </h3>
      <p className="text-lg font-bold mb-4">Distance per Week</p>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="20%">
            <XAxis
              dataKey="week"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "hsl(263 15% 55%)" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "hsl(263 15% 55%)" }}
              tickFormatter={(v) => `${v}km`}
              width={45}
            />
            <Tooltip
              cursor={{ fill: "hsl(263 35% 14% / 0.5)" }}
              contentStyle={{
                backgroundColor: "hsl(263 45% 10%)",
                border: "1px solid hsl(263 35% 20%)",
                borderRadius: "8px",
                fontSize: "12px",
                color: "hsl(240 20% 92%)",
              }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload;
                if (!d) return null;
                return (
                  <div
                    style={{
                      backgroundColor: "hsl(263 45% 10%)",
                      border: "1px solid hsl(263 35% 20%)",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      fontSize: "12px",
                      color: "hsl(240 20% 92%)",
                    }}
                  >
                    <p style={{ fontWeight: 600, marginBottom: 4 }}>
                      {d.week} &middot; {d.phase}
                    </p>
                    <p>
                      <span style={{ color: "hsl(320 80% 60%)" }}>
                        {d.completed} km
                      </span>{" "}
                      / {d.total} km
                    </p>
                  </div>
                );
              }}
            />
            {/* Completed distance (bottom, bright) */}
            <Bar dataKey="completed" stackId="distance" radius={[0, 0, 0, 0]}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.isCurrent
                      ? "hsl(320 80% 60%)"
                      : entry.isPast
                        ? "hsl(170 70% 45%)"
                        : "hsl(263 30% 30%)"
                  }
                  style={
                    entry.isCurrent
                      ? {
                          filter:
                            "drop-shadow(0 0 6px hsl(320 80% 60% / 0.5))",
                        }
                      : {}
                  }
                />
              ))}
            </Bar>
            {/* Remaining distance (top, dim) */}
            <Bar dataKey="remaining" stackId="distance" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.isCurrent
                      ? "hsl(320 60% 35%)"
                      : entry.isPast
                        ? "hsl(170 30% 25%)"
                        : "hsl(263 35% 20%)"
                  }
                  stroke={entry.isCurrent ? "hsl(320 80% 50%)" : "none"}
                  strokeWidth={entry.isCurrent ? 1 : 0}
                  strokeDasharray={entry.isCurrent ? "3 2" : "none"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex mt-3 gap-4 flex-wrap items-center">
        <div className="flex items-center gap-4">
          {phases.map((p, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <div
                className={`h-2.5 w-2.5 rounded-full ${getPhaseBgClass(p.name)}`}
              />
              <span>
                {p.name} (W{p.startWeek}&ndash;{p.endWeek})
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 ml-auto text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-6 rounded-sm" style={{ backgroundColor: "hsl(170 70% 45%)" }} />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-6 rounded-sm" style={{ backgroundColor: "hsl(263 35% 20%)" }} />
            <span>Planned</span>
          </div>
        </div>
      </div>
    </div>
  );
}
