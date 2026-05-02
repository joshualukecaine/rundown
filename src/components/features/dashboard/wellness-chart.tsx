"use client";

import type { ReadinessScore, MetricSummary } from "@/lib/wellness-utils";

/** SVG sparkline for metric cards */
function Sparkline({ data, color, gradientId }: { data: number[]; color: string; gradientId: string }) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const h = 40;
  const w = 200;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });

  const linePath = `M${points.join(" L")}`;
  const areaPath = `${linePath} L${w},${h} L0,${h} Z`;
  const last = points[points.length - 1];

  return (
    <svg className="w-full h-10 mt-2" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.45} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path d={linePath} stroke={color} strokeWidth={1.6} fill="none" />
      <circle cx={last.split(",")[0]} cy={last.split(",")[1]} r={3} fill={color} />
    </svg>
  );
}

/** Readiness gauge (circular) */
function ReadinessGauge({ readiness }: { readiness: ReadinessScore }) {
  const circumference = 2 * Math.PI * 34;
  const offset = circumference - (readiness.score / 100) * circumference;

  const colorMap = {
    success: "hsl(160 80% 45%)",
    warning: "hsl(38 95% 60%)",
    danger: "hsl(0 80% 55%)",
  };
  const textClass = {
    success: "text-success",
    warning: "text-[hsl(38_95%_60%)]",
    danger: "text-[hsl(0_80%_55%)]",
  };

  return (
    <div className="rounded-xl synthwave-card p-5">
      <div className="flex items-center justify-between mb-3.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neon-cyan">Readiness</span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] bg-[hsl(263_35%_18%/0.6)] border border-border text-muted-foreground">
          Today
        </span>
      </div>
      <div className="flex items-center gap-3.5">
        <div className="relative w-20 h-20 shrink-0">
          <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(263 35% 18%)" strokeWidth={8} />
            <circle
              cx="40" cy="40" r="34" fill="none"
              stroke={colorMap[readiness.color]}
              strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
            <span className={`text-[22px] font-bold leading-none ${textClass[readiness.color]}`}>
              {readiness.score}
            </span>
            <span className="text-[9px] text-muted-foreground">/ 100</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-semibold ${textClass[readiness.color]}`}>{readiness.label}</div>
          <div className="text-[11px] text-muted-foreground mt-1 leading-snug">{readiness.summary}</div>
        </div>
      </div>
    </div>
  );
}

/** Single metric card with sparkline (Sleep, HRV, or RHR) */
function MetricCard({
  title,
  titleColor,
  unit,
  badgeText,
  metric,
  color,
  gradientId,
  invertDelta,
}: {
  title: string;
  titleColor?: string;
  unit: string;
  badgeText?: string;
  metric: MetricSummary;
  color: string;
  gradientId: string;
  invertDelta?: boolean;
}) {
  const deltaIsGood = invertDelta
    ? (metric.delta ?? 0) <= 0
    : (metric.delta ?? 0) >= 0;

  return (
    <div className="rounded-xl synthwave-card p-5">
      <div className="flex items-center justify-between mb-3.5">
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.08em]"
          style={{ color: titleColor ?? "hsl(185 100% 50%)" }}
        >
          {title}
        </span>
        {badgeText && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] bg-[hsl(263_35%_18%/0.6)] border border-border text-muted-foreground">
            {badgeText}
          </span>
        )}
      </div>
      <div className="text-[32px] font-bold font-mono leading-none">
        {metric.current ?? "—"}
        <span className="text-[13px] font-normal text-muted-foreground ml-1">{unit}</span>
      </div>
      {metric.baseline != null && (
        <div className="text-[11px] text-muted-foreground mt-1.5 font-mono">
          Baseline <span>{metric.baseline}</span> ·{" "}
          <span className={deltaIsGood ? "text-success" : "text-[hsl(0_80%_55%)]"}>
            {invertDelta
              ? `${(metric.delta ?? 0) <= 0 ? "▼" : "▲"} ${metric.delta != null ? (metric.delta >= 0 ? "+" : "") + metric.delta : "—"}`
              : `${(metric.delta ?? 0) >= 0 ? "▲" : "▼"} ${metric.delta != null ? (metric.delta >= 0 ? "+" : "") + metric.delta : "—"}`
            }
          </span>{" "}
          7d
        </div>
      )}
      <Sparkline data={metric.sparkline} color={color} gradientId={gradientId} />
    </div>
  );
}

interface ReadinessRowProps {
  readiness: ReadinessScore;
  sleep: MetricSummary;
  sleepDuration: string;
  sleepQuality: string;
  hrv: MetricSummary;
  rhr: MetricSummary;
}

export function ReadinessRow({ readiness, sleep, sleepDuration, sleepQuality, hrv, rhr }: ReadinessRowProps) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <ReadinessGauge readiness={readiness} />

      {/* Sleep */}
      <div className="rounded-xl synthwave-card p-5">
        <div className="flex items-center justify-between mb-3.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neon-purple">
            Sleep · Last night
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] bg-[hsl(263_35%_18%/0.6)] border border-border text-muted-foreground">
            {sleepDuration}
          </span>
        </div>
        <div className="text-[32px] font-bold font-mono leading-none">
          {sleep.current ?? "—"}
          <span className="text-[13px] font-normal text-muted-foreground ml-1">/ 100</span>
        </div>
        <div className="text-[11px] text-muted-foreground mt-1.5 font-mono">
          Quality <span className={sleep.current != null && sleep.current >= 70 ? "text-success" : "text-[hsl(38_95%_60%)]"}>
            {sleepQuality}
          </span> · 7d avg <span>{sleep.baseline ?? "—"}</span>
        </div>
        <Sparkline data={sleep.sparkline} color="hsl(270 80% 65%)" gradientId="sleepGrad" />
      </div>

      <MetricCard
        title="HRV"
        unit=".0 ms"
        badgeText="ms"
        metric={hrv}
        color="hsl(185 100% 50%)"
        gradientId="hrvGrad"
      />

      <MetricCard
        title="Resting HR"
        titleColor="hsl(320 80% 60%)"
        unit="bpm"
        badgeText="bpm"
        metric={rhr}
        color="hsl(320 80% 60%)"
        gradientId="rhrGrad"
        invertDelta
      />
    </section>
  );
}
