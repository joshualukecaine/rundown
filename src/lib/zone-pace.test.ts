import type { Interval } from "@/lib/intervals";
import { computeZonePace, estimateWorkoutDistance } from "./zone-pace";

function makeInterval(overrides: Partial<Interval> = {}): Interval {
  return {
    zone: 2,
    average_speed: 3.0,
    moving_time: 600,
    distance: 1800,
    average_heartrate: 140,
    ...overrides,
  };
}

describe("computeZonePace", () => {
  it("should return empty object for empty array", () => {
    expect(computeZonePace([])).toEqual({});
  });

  it("should return the speed for a single interval", () => {
    const intervals = [makeInterval({ zone: 2, average_speed: 3.0, moving_time: 600 })];
    const result = computeZonePace(intervals);
    expect(result).toEqual({ 2: 3.0 });
  });

  it("should compute weighted average for multiple intervals in the same zone", () => {
    const intervals = [
      makeInterval({ zone: 2, average_speed: 3.0, moving_time: 600 }),
      makeInterval({ zone: 2, average_speed: 4.0, moving_time: 400 }),
    ];
    const result = computeZonePace(intervals);
    // weighted: (3.0*600 + 4.0*400) / (600+400) = (1800+1600)/1000 = 3.4
    expect(result[2]).toBeCloseTo(3.4);
  });

  it("should produce separate entries per zone", () => {
    const intervals = [
      makeInterval({ zone: 1, average_speed: 2.0, moving_time: 300 }),
      makeInterval({ zone: 3, average_speed: 4.5, moving_time: 300 }),
    ];
    const result = computeZonePace(intervals);
    expect(result).toEqual({ 1: 2.0, 3: 4.5 });
  });

  it("should skip intervals with average_speed <= 0", () => {
    const intervals = [
      makeInterval({ zone: 2, average_speed: 0, moving_time: 600 }),
      makeInterval({ zone: 2, average_speed: -1, moving_time: 600 }),
      makeInterval({ zone: 2, average_speed: 3.0, moving_time: 600 }),
    ];
    const result = computeZonePace(intervals);
    expect(result).toEqual({ 2: 3.0 });
  });

  it("should skip intervals with moving_time <= 0", () => {
    const intervals = [
      makeInterval({ zone: 2, average_speed: 3.0, moving_time: 0 }),
      makeInterval({ zone: 2, average_speed: 3.0, moving_time: -100 }),
      makeInterval({ zone: 2, average_speed: 4.0, moving_time: 500 }),
    ];
    const result = computeZonePace(intervals);
    expect(result).toEqual({ 2: 4.0 });
  });

  it("should skip intervals with zone < 1 or zone > 5", () => {
    const intervals = [
      makeInterval({ zone: 0, average_speed: 2.0, moving_time: 300 }),
      makeInterval({ zone: 6, average_speed: 5.0, moving_time: 300 }),
      makeInterval({ zone: 3, average_speed: 3.5, moving_time: 300 }),
    ];
    const result = computeZonePace(intervals);
    expect(result).toEqual({ 3: 3.5 });
  });

  it("should process only valid intervals from a mixed set", () => {
    const intervals = [
      makeInterval({ zone: 1, average_speed: 2.0, moving_time: 300 }),
      makeInterval({ zone: 0, average_speed: 2.0, moving_time: 300 }),   // invalid zone
      makeInterval({ zone: 2, average_speed: 0, moving_time: 300 }),     // invalid speed
      makeInterval({ zone: 3, average_speed: 4.0, moving_time: -10 }),   // invalid time
      makeInterval({ zone: 4, average_speed: 5.0, moving_time: 200 }),
    ];
    const result = computeZonePace(intervals);
    expect(Object.keys(result).sort()).toEqual(["1", "4"]);
    expect(result[1]).toBe(2.0);
    expect(result[4]).toBe(5.0);
  });
});

describe("estimateWorkoutDistance", () => {
  it("should return 0 for empty steps", () => {
    expect(estimateWorkoutDistance([], { 2: 3.0 })).toBe(0);
  });

  it("should calculate distance as speed * duration * 60", () => {
    // 3.0 m/s * 10 min * 60 = 1800m
    const steps = [{ duration: 10, zoneNumber: 2 }];
    expect(estimateWorkoutDistance(steps, { 2: 3.0 })).toBe(1800);
  });

  it("should sum distances across multiple steps with different zones", () => {
    const steps = [
      { duration: 5, zoneNumber: 1 },
      { duration: 10, zoneNumber: 2 },
    ];
    const zonePace = { 1: 2.0, 2: 3.0 };
    // Z1: 2.0 * 5 * 60 = 600, Z2: 3.0 * 10 * 60 = 1800 → 2400
    expect(estimateWorkoutDistance(steps, zonePace)).toBe(2400);
  });

  it("should use average of all speeds as fallback for missing zones", () => {
    const steps = [{ duration: 10, zoneNumber: 5 }];
    const zonePace = { 1: 2.0, 2: 4.0 };
    // fallback = (2.0 + 4.0) / 2 = 3.0 → 3.0 * 10 * 60 = 1800
    expect(estimateWorkoutDistance(steps, zonePace)).toBe(1800);
  });

  it("should return 0 when zonePace map is empty", () => {
    const steps = [{ duration: 10, zoneNumber: 2 }];
    // fallback = 0 when no speeds → 0 * 10 * 60 = 0
    expect(estimateWorkoutDistance(steps, {})).toBe(0);
  });

  it("should mix exact and fallback speeds for present and missing zones", () => {
    const steps = [
      { duration: 10, zoneNumber: 2 },  // exact: 3.0
      { duration: 10, zoneNumber: 5 },  // fallback: avg of {2: 3.0} = 3.0
    ];
    const zonePace = { 2: 3.0 };
    // Z2: 3.0 * 10 * 60 = 1800, Z5: 3.0 * 10 * 60 = 1800 → 3600
    expect(estimateWorkoutDistance(steps, zonePace)).toBe(3600);
  });
});
