"use client";

import type { Wellness } from "@/lib/intervals";
import { averageNonNull } from "@/lib/wellness-utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

const TOOLTIP_STYLE = {
  backgroundColor: "hsl(263 45% 10%)",
  border: "1px solid hsl(263 35% 20%)",
  borderRadius: "8px",
  padding: "8px 12px",
  fontSize: "12px",
  color: "hsl(240 20% 92%)",
};

const AXIS_TICK = { fontSize: 11, fill: "hsl(263 15% 55%)" };

interface HrvTrendProps {
  data: Wellness[];
}

export function HrvTrendChart({ data }: HrvTrendProps) {
  const chartData = data.map((d) => ({
    date: formatDate(d.id),
    hrv: d.hrv,
  }));

  const hrvValues = data.map((d) => d.hrv);
  const avg = Math.round((averageNonNull(hrvValues) ?? 0) * 10) / 10;
  const avg7d = Math.round((averageNonNull(hrvValues.slice(-7)) ?? 0) * 10) / 10;
  const baselineLow = Math.round(avg - 2);
  const baselineHigh = Math.round(avg + 2);

  return (
    <div className="rounded-xl synthwave-card p-6">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neon-cyan">HRV Trend</span>
        <div className="inline-flex p-0.5 bg-[hsl(263_35%_14%)] rounded-md text-[11px]">
          <span className="px-2.5 py-1 rounded text-muted-foreground">7d</span>
          <span className="px-2.5 py-1 rounded bg-secondary text-foreground font-semibold">28d</span>
        </div>
      </div>

      <div className="flex items-end gap-3 mt-1.5 mb-3.5">
        <div>
          <div className="font-mono text-2xl font-bold leading-none">
            {avg7d} <span className="text-[13px] font-normal text-muted-foreground">ms · 7d avg</span>
          </div>
          <div className="text-[11px] text-muted-foreground mt-1.5 font-mono">
            Baseline band <span className="text-neon-cyan">{baselineLow}–{baselineHigh} ms</span>
          </div>
        </div>
        <div className="ml-auto flex gap-3.5 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: "hsl(185 100% 50%)" }} />
            HRV
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3.5 h-1.5 rounded-sm" style={{ background: "hsl(185 100% 50% / 0.10)", border: "1px dashed hsl(185 100% 50% / 0.35)" }} />
            Baseline
          </span>
        </div>
      </div>

      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              interval="preserveStartEnd"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              domain={["dataMin - 3", "dataMax + 3"]}
              width={35}
              tickFormatter={(v) => `${v}`}
            />
            <ReferenceArea
              y1={baselineLow}
              y2={baselineHigh}
              fill="hsl(185 100% 50% / 0.08)"
              strokeOpacity={0}
            />
            <ReferenceLine
              y={avg}
              stroke="hsl(185 100% 50% / 0.35)"
              strokeDasharray="2 3"
              strokeWidth={1}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload;
                if (!d) return null;
                return (
                  <div style={TOOLTIP_STYLE}>
                    <p style={{ fontWeight: 600, marginBottom: 4 }}>{d.date}</p>
                    {d.hrv != null && (
                      <p>
                        <span style={{ color: "hsl(185 100% 50%)" }}>HRV:</span> {d.hrv} ms
                      </p>
                    )}
                  </div>
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="hrv"
              stroke="hsl(185 100% 50%)"
              strokeWidth={2}
              dot={false}
              connectNulls
              activeDot={{ r: 4, fill: "hsl(185 100% 50%)", stroke: "hsl(263 50% 6%)", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface FormCurveProps {
  data: Wellness[];
}

export function FormCurveChart({ data }: FormCurveProps) {
  const chartData = data.map((d) => ({
    date: formatDate(d.id),
    ctl: d.ctl != null ? Math.round(d.ctl * 10) / 10 : null,
    atl: d.atl != null ? Math.round(d.atl * 10) / 10 : null,
    tsb: d.ctl != null && d.atl != null ? Math.round((d.ctl - d.atl) * 10) / 10 : null,
  }));

  const latest = chartData[chartData.length - 1];

  return (
    <div className="rounded-xl synthwave-card p-6">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neon-cyan">
          Fitness · Fatigue · Form
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] bg-[hsl(263_35%_18%/0.6)] border border-border text-muted-foreground">
          CTL · ATL · TSB
        </span>
      </div>

      <div className="flex items-end gap-3.5 mt-1.5 mb-2 flex-wrap">
        <div>
          <div className="font-mono text-[11px] text-muted-foreground">Fitness (CTL)</div>
          <div className="font-mono text-lg font-bold text-neon-cyan">{latest?.ctl ?? "—"}</div>
        </div>
        <div>
          <div className="font-mono text-[11px] text-muted-foreground">Fatigue (ATL)</div>
          <div className="font-mono text-lg font-bold text-neon-pink">{latest?.atl ?? "—"}</div>
        </div>
        <div>
          <div className="font-mono text-[11px] text-muted-foreground">Form (TSB)</div>
          <div className="font-mono text-lg font-bold text-neon-purple">
            {latest?.tsb != null ? (latest.tsb >= 0 ? "+" : "") + latest.tsb : "—"}
          </div>
        </div>
        <div className="ml-auto text-[11px] text-muted-foreground text-right leading-snug max-w-[200px]">
          Just starting out — full picture in ~4 weeks.
        </div>
      </div>

      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              interval="preserveStartEnd"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              width={35}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload;
                if (!d) return null;
                return (
                  <div style={TOOLTIP_STYLE}>
                    <p style={{ fontWeight: 600, marginBottom: 4 }}>{d.date}</p>
                    {d.ctl != null && <p><span style={{ color: "hsl(185 100% 50%)" }}>CTL:</span> {d.ctl}</p>}
                    {d.atl != null && <p><span style={{ color: "hsl(320 80% 60%)" }}>ATL:</span> {d.atl}</p>}
                    {d.tsb != null && <p><span style={{ color: "hsl(270 80% 65%)" }}>TSB:</span> {d.tsb}</p>}
                  </div>
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="ctl"
              stroke="hsl(185 100% 50%)"
              strokeWidth={2}
              dot={false}
              connectNulls
              activeDot={{ r: 3.5, fill: "hsl(185 100% 50%)", stroke: "hsl(263 50% 6%)", strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="atl"
              stroke="hsl(320 80% 60%)"
              strokeWidth={2}
              dot={false}
              connectNulls
              activeDot={{ r: 3.5, fill: "hsl(320 80% 60%)", stroke: "hsl(263 50% 6%)", strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="tsb"
              stroke="hsl(270 80% 65%)"
              strokeWidth={2}
              strokeDasharray="4 3"
              dot={false}
              connectNulls
              activeDot={{ r: 3.5, fill: "hsl(270 80% 65%)", stroke: "hsl(263 50% 6%)", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap gap-3.5 mt-1.5 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: "hsl(185 100% 50%)" }} />
          Fitness (CTL)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: "hsl(320 80% 60%)" }} />
          Fatigue (ATL)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3.5 h-0.5" style={{ background: "hsl(270 80% 65%)", borderTop: "1px dashed hsl(270 80% 65%)" }} />
          Form (TSB)
        </span>
      </div>
    </div>
  );
}
