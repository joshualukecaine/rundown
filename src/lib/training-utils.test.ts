import type { Event } from "@/lib/intervals";
import {
  formatDistance,
  distanceKm,
  getDescriptionSummary,
  getEventDistance,
  getPhase,
  getBasePhase,
  getPhaseColorClass,
  getPhaseBgClass,
  getNextEvent,
  groupEventsByWeek,
} from "./training-utils";

function makeEvent(overrides: Partial<Event> & { start_date_local: string; name: string }): Event {
  return {
    id: 1,
    athlete_id: "a123",
    category: "WORKOUT",
    ...overrides,
  } as Event;
}

describe("formatDistance", () => {
  it("should format metres to km string with 1 decimal", () => {
    expect(formatDistance(5000)).toBe("5.0km");
    expect(formatDistance(10500)).toBe("10.5km");
  });

  it("should round to 1 decimal place", () => {
    expect(formatDistance(1234)).toBe("1.2km");
  });
});

describe("distanceKm", () => {
  it("should convert metres to km rounded to 1 decimal", () => {
    expect(distanceKm(5000)).toBe(5);
    expect(distanceKm(1500)).toBe(1.5);
    expect(distanceKm(1234)).toBe(1.2);
  });
});

describe("getDescriptionSummary", () => {
  it("should return empty string for undefined", () => {
    expect(getDescriptionSummary(undefined)).toBe("");
  });

  it("should return empty string for empty string", () => {
    expect(getDescriptionSummary("")).toBe("");
  });

  it("should return the first line of a multi-line description", () => {
    expect(getDescriptionSummary("Easy run\nKeep HR low")).toBe("Easy run");
  });

  it("should return the full string when single line", () => {
    expect(getDescriptionSummary("Easy run")).toBe("Easy run");
  });
});

describe("getEventDistance", () => {
  it("should return the distance field when present and positive", () => {
    const event = makeEvent({ start_date_local: "2026-03-03", name: "Run", distance: 5000 });
    expect(getEventDistance(event)).toBe(5000);
  });

  it("should parse km from event name when distance field is absent", () => {
    const event = makeEvent({ start_date_local: "2026-03-03", name: "Run: 10km easy" });
    expect(getEventDistance(event)).toBe(10000);
  });

  it("should parse decimal km from event name", () => {
    const event = makeEvent({ start_date_local: "2026-03-03", name: "Run 1.5km" });
    expect(getEventDistance(event)).toBe(1500);
  });

  it("should return 0 when no distance is available", () => {
    const event = makeEvent({ start_date_local: "2026-03-03", name: "Rest day" });
    expect(getEventDistance(event)).toBe(0);
  });

  it("should use distance field over name parsing when both present", () => {
    const event = makeEvent({ start_date_local: "2026-03-03", name: "Run 5km", distance: 3000 });
    expect(getEventDistance(event)).toBe(3000);
  });

  it("should fall back to name parsing when distance field is 0", () => {
    const event = makeEvent({ start_date_local: "2026-03-03", name: "Run 5km", distance: 0 });
    expect(getEventDistance(event)).toBe(5000);
  });
});

describe("getPhase", () => {
  it("should return the first tag", () => {
    const event = makeEvent({ start_date_local: "2026-03-03", name: "Run", tags: ["Base Wk2", "other"] });
    expect(getPhase(event)).toBe("Base Wk2");
  });

  it("should return Unknown when tags array is empty", () => {
    const event = makeEvent({ start_date_local: "2026-03-03", name: "Run", tags: [] });
    expect(getPhase(event)).toBe("Unknown");
  });

  it("should return Unknown when tags is absent", () => {
    const event = makeEvent({ start_date_local: "2026-03-03", name: "Run" });
    expect(getPhase(event)).toBe("Unknown");
  });
});

describe("getBasePhase", () => {
  it.each([
    ["Restart Wk1", "Restart"],
    ["Restart", "Restart"],
    ["Recovery Wk1", "Recovery"],
    ["Recovery", "Recovery"],
    ["Base Wk3", "Base"],
    ["Base", "Base"],
    ["Build Wk2", "Build"],
    ["Build", "Build"],
    ["Unknown", "Restart"],
    ["Something else", "Restart"],
  ])('should map "%s" to "%s"', (input, expected) => {
    expect(getBasePhase(input)).toBe(expected);
  });
});

describe("getPhaseColorClass", () => {
  it("should return phase-restart for Restart phase", () => {
    expect(getPhaseColorClass("Restart Wk1")).toBe("phase-restart");
  });

  it("should return phase-recovery for Recovery phase", () => {
    expect(getPhaseColorClass("Recovery")).toBe("phase-recovery");
  });

  it("should return phase-base for Base phase", () => {
    expect(getPhaseColorClass("Base Wk1")).toBe("phase-base");
  });

  it("should return phase-build for Build phase", () => {
    expect(getPhaseColorClass("Build Wk2")).toBe("phase-build");
  });

  it("should return phase-restart for unknown phase", () => {
    expect(getPhaseColorClass("Unknown")).toBe("phase-restart");
  });
});

describe("getPhaseBgClass", () => {
  it("should return bg-phase-restart for Restart phase", () => {
    expect(getPhaseBgClass("Restart")).toBe("bg-phase-restart");
  });

  it("should return bg-phase-recovery for Recovery phase", () => {
    expect(getPhaseBgClass("Recovery")).toBe("bg-phase-recovery");
  });

  it("should return bg-phase-base for Base phase", () => {
    expect(getPhaseBgClass("Base Wk1")).toBe("bg-phase-base");
  });

  it("should return bg-phase-build for Build phase", () => {
    expect(getPhaseBgClass("Build")).toBe("bg-phase-build");
  });
});

describe("getNextEvent", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-04T09:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return null for empty events array", () => {
    expect(getNextEvent([])).toBeNull();
  });

  it("should return the first upcoming event (today or later)", () => {
    const events = [
      makeEvent({ start_date_local: "2026-03-03", name: "Past" }),
      makeEvent({ id: 2, start_date_local: "2026-03-04", name: "Today" }),
      makeEvent({ id: 3, start_date_local: "2026-03-05", name: "Tomorrow" }),
    ];
    expect(getNextEvent(events)?.name).toBe("Today");
  });

  it("should return null when all events are in the past", () => {
    const events = [
      makeEvent({ start_date_local: "2026-03-01", name: "Past 1" }),
      makeEvent({ id: 2, start_date_local: "2026-03-02", name: "Past 2" }),
    ];
    expect(getNextEvent(events)).toBeNull();
  });

  it("should return the earliest future event when multiple future events exist", () => {
    const events = [
      makeEvent({ id: 2, start_date_local: "2026-03-10", name: "Later" }),
      makeEvent({ id: 3, start_date_local: "2026-03-05", name: "Earlier" }),
    ];
    expect(getNextEvent(events)?.name).toBe("Earlier");
  });
});

describe("groupEventsByWeek", () => {
  // System time: Wednesday 2026-03-04. Week start: 2026-03-02 (Monday).
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-04T09:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return empty array for no events", () => {
    expect(groupEventsByWeek([])).toEqual([]);
  });

  it("should group events from the same week together", () => {
    const events = [
      makeEvent({ start_date_local: "2026-03-02", name: "Mon", tags: ["Base Wk1"] }),
      makeEvent({ id: 2, start_date_local: "2026-03-04", name: "Wed", tags: ["Base Wk1"] }),
      makeEvent({ id: 3, start_date_local: "2026-03-09", name: "Next week", tags: ["Base Wk2"] }),
    ];
    const weeks = groupEventsByWeek(events);
    expect(weeks).toHaveLength(2);
    expect(weeks[0].events).toHaveLength(2);
    expect(weeks[1].events).toHaveLength(1);
  });

  it("should sort weeks chronologically", () => {
    const events = [
      makeEvent({ start_date_local: "2026-03-16", name: "Future", tags: ["Build"] }),
      makeEvent({ id: 2, start_date_local: "2026-03-02", name: "Current", tags: ["Base"] }),
    ];
    const weeks = groupEventsByWeek(events);
    expect(weeks[0].weekStart).toBe("2026-03-02");
    expect(weeks[1].weekStart).toBe("2026-03-16");
  });

  it("should calculate totalDistance from all events in the week", () => {
    const events = [
      makeEvent({ start_date_local: "2026-03-02", name: "Run", distance: 5000, tags: ["Base"] }),
      makeEvent({ id: 2, start_date_local: "2026-03-04", name: "Run", distance: 10000, tags: ["Base"] }),
    ];
    const weeks = groupEventsByWeek(events);
    expect(weeks[0].totalDistance).toBe(15000);
  });

  it("should calculate completedDistance from past events only", () => {
    // System time is 2026-03-04 (Wednesday). Events before that date are past.
    const events = [
      makeEvent({ start_date_local: "2026-03-02", name: "Past", distance: 5000, tags: ["Base"] }),
      makeEvent({ id: 2, start_date_local: "2026-03-04", name: "Today", distance: 8000, tags: ["Base"] }),
    ];
    const weeks = groupEventsByWeek(events);
    expect(weeks[0].completedDistance).toBe(5000);
  });

  it("should mark the current week with isCurrent=true", () => {
    const events = [
      makeEvent({ start_date_local: "2026-02-23", name: "Last week", tags: ["Base"] }),
      makeEvent({ id: 2, start_date_local: "2026-03-02", name: "This week", tags: ["Base"] }),
      makeEvent({ id: 3, start_date_local: "2026-03-09", name: "Next week", tags: ["Base"] }),
    ];
    const weeks = groupEventsByWeek(events);
    expect(weeks[0].isCurrent).toBe(false);
    expect(weeks[1].isCurrent).toBe(true);
    expect(weeks[2].isCurrent).toBe(false);
  });

  it("should mark past weeks with isPast=true", () => {
    const events = [
      makeEvent({ start_date_local: "2026-02-23", name: "Last week", tags: ["Base"] }),
      makeEvent({ id: 2, start_date_local: "2026-03-02", name: "This week", tags: ["Base"] }),
    ];
    const weeks = groupEventsByWeek(events);
    expect(weeks[0].isPast).toBe(true);
    expect(weeks[1].isPast).toBe(false);
  });

  it("should assign sequential week numbers starting from 1", () => {
    const events = [
      makeEvent({ start_date_local: "2026-03-02", name: "Wk1", tags: ["Base"] }),
      makeEvent({ id: 2, start_date_local: "2026-03-09", name: "Wk2", tags: ["Base"] }),
      makeEvent({ id: 3, start_date_local: "2026-03-16", name: "Wk3", tags: ["Base"] }),
    ];
    const weeks = groupEventsByWeek(events);
    expect(weeks[0].weekNumber).toBe(1);
    expect(weeks[1].weekNumber).toBe(2);
    expect(weeks[2].weekNumber).toBe(3);
  });

  it("should derive phase from the first event in each week", () => {
    const events = [
      makeEvent({ start_date_local: "2026-03-02", name: "Run", tags: ["Base Wk1"] }),
    ];
    const weeks = groupEventsByWeek(events);
    expect(weeks[0].phase).toBe("Base Wk1");
  });
});
