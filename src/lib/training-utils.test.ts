import type { Event } from "@/lib/intervals";
import {
  formatDistance,
  distanceKm,
  getDescriptionSummary,
  getEventDistance,
  getEventDuration,
  getPhase,
  getBasePhase,
  getPhaseColorClass,
  getPhaseBgClass,
  getActivityLabel,
  parseWorkoutDescription,
  expandWorkoutSteps,
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

describe("getEventDuration", () => {
  it("should return moving_time in minutes when present", () => {
    const event = makeEvent({ start_date_local: "2026-03-03", name: "Run: 23m", moving_time: 1380 });
    expect(getEventDuration(event)).toBe(23);
  });

  it("should parse minutes from event name when moving_time is absent", () => {
    const event = makeEvent({ start_date_local: "2026-03-03", name: "Run: 23m" });
    expect(getEventDuration(event)).toBe(23);
  });

  it("should parse minutes from Long Run name", () => {
    const event = makeEvent({ start_date_local: "2026-03-03", name: "Long Run: 44m" });
    expect(getEventDuration(event)).toBe(44);
  });

  it("should return 0 when no duration available", () => {
    const event = makeEvent({ start_date_local: "2026-03-03", name: "Rest day" });
    expect(getEventDuration(event)).toBe(0);
  });

  it("should prefer moving_time over name parsing", () => {
    const event = makeEvent({ start_date_local: "2026-03-03", name: "Run: 23m", moving_time: 900 });
    expect(getEventDuration(event)).toBe(15);
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

  it("should calculate totalDuration from all events in the week", () => {
    const events = [
      makeEvent({ start_date_local: "2026-03-02", name: "Run: 23m", moving_time: 1380, tags: ["Base"] }),
      makeEvent({ id: 2, start_date_local: "2026-03-04", name: "Long Run: 44m", moving_time: 2640, tags: ["Base"] }),
    ];
    const weeks = groupEventsByWeek(events);
    expect(weeks[0].totalDuration).toBe(67);
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

describe("getActivityLabel", () => {
  it.each([
    ["Run", "Run"],
    ["TrailRun", "Run"],
    ["VirtualRun", "Run"],
    ["Ride", "Ride"],
    ["VirtualRide", "Ride"],
    ["Swim", "Swim"],
    ["WeightTraining", "Weights"],
    ["Hike", "Hike"],
    ["Walk", "Walk"],
  ] as const)('should map sport type "%s" to "%s"', (type, expected) => {
    const event = makeEvent({ start_date_local: "2026-03-03", name: "Session", type });
    expect(getActivityLabel(event)).toBe(expected);
  });

  it("should return Session for unknown sport type", () => {
    const event = makeEvent({ start_date_local: "2026-03-03", name: "Session", type: "Rowing" });
    expect(getActivityLabel(event)).toBe("Session");
  });

  it("should return Session when type is undefined", () => {
    const event = makeEvent({ start_date_local: "2026-03-03", name: "Session" });
    expect(getActivityLabel(event)).toBe("Session");
  });
});

describe("parseWorkoutDescription", () => {
  it("should return empty array for undefined", () => {
    expect(parseWorkoutDescription(undefined)).toEqual([]);
  });

  it("should return empty array for empty string", () => {
    expect(parseWorkoutDescription("")).toEqual([]);
  });

  it("should return empty array for single-line description (summary only)", () => {
    expect(parseWorkoutDescription("Easy run")).toEqual([]);
  });

  it("should parse a section with steps", () => {
    const desc = [
      "Easy run with warm up",
      "Warm Up",
      "- 5m Z1 HR (96-121bpm)",
    ].join("\n");

    const sections = parseWorkoutDescription(desc);
    expect(sections).toHaveLength(1);
    expect(sections[0].name).toBe("Warm Up");
    expect(sections[0].repeat).toBe(1);
    expect(sections[0].steps).toHaveLength(1);
    expect(sections[0].steps[0].duration).toBe(5);
    expect(sections[0].steps[0].zone).toBe("Z1");
    expect(sections[0].steps[0].zoneNumber).toBe(1);
  });

  it("should parse multiple sections", () => {
    const desc = [
      "Run/walk intervals",
      "Warm Up",
      "- 2m Z1 HR",
      "Intervals 3x",
      "- Run 3m Z2 HR",
      "- Walk 1m Z1 HR",
      "Cool Down",
      "- 2m Z1 HR",
    ].join("\n");

    const sections = parseWorkoutDescription(desc);
    expect(sections).toHaveLength(3);
    expect(sections[0].name).toBe("Warm Up");
    expect(sections[1].name).toBe("Intervals 3x");
    expect(sections[1].repeat).toBe(3);
    expect(sections[1].steps).toHaveLength(2);
    expect(sections[2].name).toBe("Cool Down");
  });

  it("should extract repeat count from section name", () => {
    const desc = [
      "Summary line",
      "Walk/Run 7x",
      "- Run 3m Z2 HR",
    ].join("\n");

    const sections = parseWorkoutDescription(desc);
    expect(sections[0].repeat).toBe(7);
  });

  it("should default repeat to 1 when no count", () => {
    const desc = [
      "Summary line",
      "Warm Up",
      "- 5m Z1 HR",
    ].join("\n");

    const sections = parseWorkoutDescription(desc);
    expect(sections[0].repeat).toBe(1);
  });

  it("should extract step labels like Run and Walk", () => {
    const desc = [
      "Summary line",
      "Intervals 2x",
      "- Run 3m Z2 HR",
      "- Walk 1m Z1 HR",
    ].join("\n");

    const sections = parseWorkoutDescription(desc);
    expect(sections[0].steps[0].label).toBe("Run");
    expect(sections[0].steps[1].label).toBe("Walk");
  });

  it("should leave label undefined when step has no label prefix", () => {
    const desc = [
      "Summary line",
      "Warm Up",
      "- 2m Z1 HR",
    ].join("\n");

    const sections = parseWorkoutDescription(desc);
    expect(sections[0].steps[0].label).toBeUndefined();
  });

  it("should strip intensity= parameter from raw text", () => {
    const desc = [
      "Summary line",
      "Warm Up",
      "- 2m Z1 HR intensity=warmup",
    ].join("\n");

    const sections = parseWorkoutDescription(desc);
    expect(sections[0].steps[0].raw).not.toContain("intensity=");
    expect(sections[0].steps[0].raw).toContain("2m Z1 HR");
  });

  it("should preserve HR range in raw text", () => {
    const desc = [
      "Summary line",
      "Warm Up",
      "- 5m Z1 HR (96-121bpm)",
    ].join("\n");

    const sections = parseWorkoutDescription(desc);
    expect(sections[0].steps[0].raw).toContain("(96-121bpm)");
  });

  it("should ignore step lines before any section header", () => {
    const desc = [
      "Summary line",
      "- 5m Z1 HR",
      "Warm Up",
      "- 2m Z1 HR",
    ].join("\n");

    const sections = parseWorkoutDescription(desc);
    expect(sections).toHaveLength(1);
    expect(sections[0].name).toBe("Warm Up");
    expect(sections[0].steps).toHaveLength(1);
  });
});

describe("expandWorkoutSteps", () => {
  it("should return empty array for empty sections", () => {
    expect(expandWorkoutSteps([])).toEqual([]);
  });

  it("should return steps with section name for repeat=1", () => {
    const sections = [{
      name: "Warm Up",
      repeat: 1,
      steps: [{ duration: 5, zone: "Z1", zoneNumber: 1, raw: "5m Z1 HR" }],
    }];

    const result = expandWorkoutSteps(sections);
    expect(result).toHaveLength(1);
    expect(result[0].section).toBe("Warm Up");
    expect(result[0].duration).toBe(5);
  });

  it("should repeat steps according to repeat count", () => {
    const sections = [{
      name: "Intervals 3x",
      repeat: 3,
      steps: [
        { duration: 3, zone: "Z2", zoneNumber: 2, raw: "Run 3m Z2 HR" },
        { duration: 1, zone: "Z1", zoneNumber: 1, raw: "Walk 1m Z1 HR" },
      ],
    }];

    const result = expandWorkoutSteps(sections);
    expect(result).toHaveLength(6);
    expect(result.every((s) => s.section === "Intervals 3x")).toBe(true);
    expect(result[0].zoneNumber).toBe(2);
    expect(result[1].zoneNumber).toBe(1);
    expect(result[2].zoneNumber).toBe(2);
  });

  it("should flatten multiple sections in order", () => {
    const sections = [
      {
        name: "Warm Up",
        repeat: 1,
        steps: [{ duration: 5, zone: "Z1", zoneNumber: 1, raw: "5m Z1 HR" }],
      },
      {
        name: "Main Set 2x",
        repeat: 2,
        steps: [{ duration: 3, zone: "Z2", zoneNumber: 2, raw: "3m Z2 HR" }],
      },
      {
        name: "Cool Down",
        repeat: 1,
        steps: [{ duration: 3, zone: "Z1", zoneNumber: 1, raw: "3m Z1 HR" }],
      },
    ];

    const result = expandWorkoutSteps(sections);
    expect(result).toHaveLength(4);
    expect(result[0].section).toBe("Warm Up");
    expect(result[1].section).toBe("Main Set 2x");
    expect(result[2].section).toBe("Main Set 2x");
    expect(result[3].section).toBe("Cool Down");
  });
});
