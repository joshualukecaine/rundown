import type { Wellness } from "@/lib/intervals";
import {
  averageNonNull,
  scoreReadiness,
  formatReadiness,
  computeReadiness,
  metricSummary,
  formatSleepDuration,
  sleepQualityLabel,
} from "./wellness-utils";

function makeWellness(overrides: Partial<Wellness> = {}): Wellness {
  return {
    id: "2026-05-01",
    restingHR: null,
    hrv: null,
    hrvSDNN: null,
    sleepSecs: null,
    sleepScore: null,
    sleepQuality: null,
    avgSleepingHR: null,
    steps: null,
    weight: null,
    spO2: null,
    ctl: null,
    atl: null,
    ...overrides,
  } as Wellness;
}

describe("averageNonNull", () => {
  it("returns null for empty array", () => {
    expect(averageNonNull([])).toBeNull();
  });

  it("returns null for all-null array", () => {
    expect(averageNonNull([null, null, null])).toBeNull();
  });

  it("averages non-null values only", () => {
    expect(averageNonNull([10, null, 20, null, 30])).toBe(20);
  });

  it("returns exact value for single element", () => {
    expect(averageNonNull([42])).toBe(42);
  });
});

describe("scoreReadiness", () => {
  it("returns 0 when today is undefined", () => {
    expect(scoreReadiness(undefined, [])).toBe(0);
  });

  it("returns 50 (neutral) when no metrics are available", () => {
    expect(scoreReadiness(makeWellness(), [])).toBe(50);
  });

  it("scores higher when HRV is above baseline", () => {
    const recent = [makeWellness({ hrv: 40 }), makeWellness({ hrv: 40 }), makeWellness({ hrv: 40 })];
    const today = makeWellness({ hrv: 50 });
    const score = scoreReadiness(today, recent);
    expect(score).toBeGreaterThan(50);
  });

  it("scores lower when HRV is below baseline", () => {
    const recent = [makeWellness({ hrv: 50 }), makeWellness({ hrv: 50 })];
    const today = makeWellness({ hrv: 35 });
    expect(scoreReadiness(today, recent)).toBeLessThan(50);
  });

  it("scores higher when RHR is below baseline (lower is better)", () => {
    const recent = [makeWellness({ restingHR: 60 }), makeWellness({ restingHR: 60 })];
    const today = makeWellness({ restingHR: 52 });
    expect(scoreReadiness(today, recent)).toBeGreaterThan(50);
  });

  it("scores lower when RHR is above baseline", () => {
    const recent = [makeWellness({ restingHR: 55 }), makeWellness({ restingHR: 55 })];
    const today = makeWellness({ restingHR: 65 });
    expect(scoreReadiness(today, recent)).toBeLessThan(50);
  });

  it("adds sleep bonus for high sleep score", () => {
    const today = makeWellness({ sleepScore: 90 });
    expect(scoreReadiness(today, [])).toBeGreaterThan(50);
  });

  it("penalises low sleep score", () => {
    const today = makeWellness({ sleepScore: 30 });
    expect(scoreReadiness(today, [])).toBeLessThan(50);
  });

  it("clamps score to 0-100 range", () => {
    // Extreme positive: all metrics excellent
    const recent = [makeWellness({ hrv: 20, restingHR: 70 })];
    const today = makeWellness({ hrv: 80, restingHR: 40, sleepScore: 100 });
    const score = scoreReadiness(today, recent);
    expect(score).toBeLessThanOrEqual(100);
    expect(score).toBeGreaterThanOrEqual(0);
  });
});

describe("formatReadiness", () => {
  it("returns 'No data' when today is undefined", () => {
    const result = formatReadiness(0, undefined, []);
    expect(result.label).toBe("No data");
    expect(result.color).toBe("warning");
  });

  it("returns 'Recovered' for score >= 70", () => {
    const result = formatReadiness(75, makeWellness(), []);
    expect(result.label).toBe("Recovered");
    expect(result.color).toBe("success");
  });

  it("returns 'Moderate' for score 40-69", () => {
    const result = formatReadiness(55, makeWellness(), []);
    expect(result.label).toBe("Moderate");
    expect(result.color).toBe("warning");
  });

  it("returns 'Fatigued' for score < 40", () => {
    const result = formatReadiness(25, makeWellness(), []);
    expect(result.label).toBe("Fatigued");
    expect(result.color).toBe("danger");
    expect(result.summary).toContain("Consider going easier");
  });

  it("includes HRV delta in summary when available", () => {
    const recent = [makeWellness({ hrv: 40 })];
    const today = makeWellness({ hrv: 45 });
    const result = formatReadiness(70, today, recent);
    expect(result.summary).toContain("HRV +5 vs baseline");
  });

  it("includes sleep score in summary", () => {
    const today = makeWellness({ sleepScore: 82 });
    const result = formatReadiness(70, today, []);
    expect(result.summary).toContain("sleep 82");
  });

  it("includes RHR delta in summary when available", () => {
    const recent = [makeWellness({ restingHR: 55 })];
    const today = makeWellness({ restingHR: 58 });
    const result = formatReadiness(45, today, recent);
    expect(result.summary).toContain("RHR 58 (+3)");
  });
});

describe("computeReadiness", () => {
  it("combines scoreReadiness and formatReadiness", () => {
    const recent = [makeWellness({ hrv: 40, restingHR: 55, sleepScore: 70 })];
    const today = makeWellness({ hrv: 48, restingHR: 52, sleepScore: 85 });
    const result = computeReadiness(today, recent);
    expect(result.score).toBeGreaterThan(0);
    expect(["Recovered", "Moderate", "Fatigued"]).toContain(result.label);
  });

  it("returns no-data result for undefined today", () => {
    expect(computeReadiness(undefined, []).label).toBe("No data");
  });
});

describe("metricSummary", () => {
  it("returns null current when data is empty", () => {
    const result = metricSummary([], (w) => w.hrv);
    expect(result.current).toBeNull();
    expect(result.baseline).toBeNull();
    expect(result.delta).toBeNull();
    expect(result.sparkline).toEqual([]);
  });

  it("computes current as last value", () => {
    const data = [makeWellness({ hrv: 40 }), makeWellness({ hrv: 45 }), makeWellness({ hrv: 50 })];
    const result = metricSummary(data, (w) => w.hrv);
    expect(result.current).toBe(50);
  });

  it("computes baseline as 7-day average", () => {
    const data = Array.from({ length: 7 }, (_, i) => makeWellness({ hrv: 40 + i }));
    const result = metricSummary(data, (w) => w.hrv);
    expect(result.baseline).toBe(43); // avg of 40..46
  });

  it("computes delta as current - baseline", () => {
    const data = [
      makeWellness({ hrv: 40 }),
      makeWellness({ hrv: 42 }),
      makeWellness({ hrv: 44 }),
      makeWellness({ hrv: 50 }),
    ];
    const result = metricSummary(data, (w) => w.hrv);
    expect(result.delta).not.toBeNull();
  });

  it("returns sparkline of last 7 values with nulls as 0", () => {
    const data = [
      makeWellness({ hrv: null }),
      makeWellness({ hrv: 42 }),
      makeWellness({ hrv: 44 }),
    ];
    const result = metricSummary(data, (w) => w.hrv);
    expect(result.sparkline).toEqual([0, 42, 44]);
  });

  it("handles all-null data gracefully", () => {
    const data = [makeWellness(), makeWellness(), makeWellness()];
    const result = metricSummary(data, (w) => w.hrv);
    expect(result.current).toBeNull();
    expect(result.baseline).toBeNull();
    expect(result.delta).toBeNull();
  });
});

describe("formatSleepDuration", () => {
  it("returns dash for null", () => {
    expect(formatSleepDuration(null)).toBe("—");
  });

  it("returns dash for 0", () => {
    expect(formatSleepDuration(0)).toBe("—");
  });

  it("formats hours and minutes", () => {
    expect(formatSleepDuration(7 * 3600 + 12 * 60)).toBe("7h 12m");
  });

  it("pads single-digit minutes", () => {
    expect(formatSleepDuration(8 * 3600 + 5 * 60)).toBe("8h 05m");
  });

  it("handles exact hours", () => {
    expect(formatSleepDuration(6 * 3600)).toBe("6h 00m");
  });
});

describe("sleepQualityLabel", () => {
  it("returns Excellent for 1", () => {
    expect(sleepQualityLabel(1)).toBe("Excellent");
  });

  it("returns Good for 2", () => {
    expect(sleepQualityLabel(2)).toBe("Good");
  });

  it("returns Fair for 3", () => {
    expect(sleepQualityLabel(3)).toBe("Fair");
  });

  it("returns Poor for 4", () => {
    expect(sleepQualityLabel(4)).toBe("Poor");
  });

  it("returns dash for null", () => {
    expect(sleepQualityLabel(null)).toBe("—");
  });

  it("returns dash for unknown values", () => {
    expect(sleepQualityLabel(5)).toBe("—");
    expect(sleepQualityLabel(0)).toBe("—");
  });
});
