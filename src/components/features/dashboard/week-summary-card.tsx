import type { TrainingWeek } from "@/types";
import { todayISO } from "@/lib/date-utils";
import { getPhaseColorClass, getBasePhase, getEventDuration } from "@/lib/training-utils";

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function getWeekDays(weekStart: string) {
  const start = new Date(weekStart + "T00:00:00");
  return DAYS_OF_WEEK.map((dow, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return {
      dow,
      dom: d.getDate(),
      date: d.toISOString().slice(0, 10),
    };
  });
}

export function WeekSummaryCard({ week }: { week: TrainingWeek | null }) {
  if (!week) {
    return (
      <div className="rounded-xl synthwave-card p-6">
        <p className="text-[11px] font-semibold text-neon-cyan uppercase tracking-[0.08em]">
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
  const basePhase = getBasePhase(week.phase);
  const days = getWeekDays(week.weekStart);

  const eventsByDate = new Map(
    week.events.map((e) => [e.start_date_local.slice(0, 10), e])
  );

  return (
    <div className="rounded-xl synthwave-card p-6">
      <div className="flex items-start justify-between gap-3 mb-3.5">
        <div>
          <p className="text-[11px] font-semibold text-neon-cyan uppercase tracking-[0.08em]">
            This Week
          </p>
          <h3 className="text-lg font-bold mt-0.5">
            Week {week.weekNumber} · <span className={phaseColor}>{basePhase}</span>
          </h3>
        </div>
        <span
          className={`text-[11px] font-semibold rounded-full px-2.5 py-1 bg-[hsl(320_80%_60%/0.12)] border border-[hsl(320_80%_60%/0.4)] ${phaseColor}`}
        >
          {week.phase}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-[18px] mb-[18px]">
        <div>
          <p className="text-[28px] font-bold font-mono leading-none">
            {completed}<span className="text-[13px] font-normal text-muted-foreground ml-1">/ {total}</span>
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Sessions completed</p>
        </div>
        <div>
          <p className="text-[28px] font-bold font-mono leading-none">
            {week.totalDuration}<span className="text-[13px] font-normal text-muted-foreground ml-1">min</span>
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Total planned</p>
        </div>
      </div>

      {/* 7-day strip */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map(({ dow, dom, date }) => {
          const event = eventsByDate.get(date);
          const isToday = date === today;
          const isPast = date < today;
          const hasSession = !!event;

          return (
            <div
              key={date}
              className={`relative rounded-lg border text-center py-2 px-1 min-h-[64px] ${
                isToday
                  ? "bg-[hsl(320_80%_60%/0.12)] border-[hsl(320_80%_60%/0.55)] shadow-[var(--glow-pink)]"
                  : "bg-[hsl(263_35%_14%/0.6)] border-border"
              }`}
            >
              {isPast && hasSession && (
                <span className="absolute top-1 right-1.5 text-[10px] text-success">✓</span>
              )}
              <div className="text-[10px] uppercase tracking-[0.04em] text-muted-foreground">{dow}</div>
              <div className={`font-mono text-[13px] font-semibold mt-0.5 ${isToday ? "text-neon-pink" : ""}`}>
                {dom}
              </div>
              <div className={`font-mono text-[10px] mt-1.5 ${
                hasSession
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground/50"
              }`}>
                {hasSession ? `${getEventDuration(event)}m` : "rest"}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-3 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[hsl(320_80%_60%)]" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[hsl(263_35%_30%)]" />
          <span>Planned</span>
        </div>
        <span className="ml-auto font-mono">{total} sessions · {week.totalDuration} min</span>
      </div>
    </div>
  );
}
