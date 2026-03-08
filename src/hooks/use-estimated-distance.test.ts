import { describe, it, expect, vi, afterEach } from "vitest";
import type { Event } from "@/lib/intervals";

vi.mock("./use-zone-pace", () => ({
  useZonePace: vi.fn(),
}));

import { useZonePace } from "./use-zone-pace";
import { useEstimatedDistance } from "./use-estimated-distance";

const mockUseZonePace = vi.mocked(useZonePace);

function zonePaceReturn(overrides: Record<string, unknown> = {}) {
  return {
    data: undefined,
    isLoading: false,
    ...overrides,
  } as ReturnType<typeof useZonePace>;
}

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 1,
    start_date_local: "2026-03-10",
    category: "WORKOUT",
    name: "Easy Run",
    athlete_id: "i123",
    ...overrides,
  };
}

afterEach(() => vi.clearAllMocks());

describe("useEstimatedDistance", () => {
  it("returns { distance: 0, isEstimated: false, isLoading: false } for null event", () => {
    mockUseZonePace.mockReturnValue(zonePaceReturn());

    const result = useEstimatedDistance(null);

    expect(result).toEqual({ distance: 0, isEstimated: false, isLoading: false });
  });

  it("returns API distance when event.distance > 0", () => {
    mockUseZonePace.mockReturnValue(zonePaceReturn());

    const result = useEstimatedDistance(makeEvent({ distance: 5000 }));

    expect(result).toEqual({ distance: 5000, isEstimated: false, isLoading: false });
  });

  it("returns zone-pace estimate when no API distance but has steps + zonePace data", () => {
    mockUseZonePace.mockReturnValue(
      zonePaceReturn({
        data: { zonePace: { 2: 3.0 }, activityCount: 5 },
      }),
    );

    // parseWorkoutDescription expects: summary line, section header, then step lines
    const event = makeEvent({
      distance: 0,
      description: "Easy run\nWarm Up\n- 10m Z2",
    });

    const result = useEstimatedDistance(event);

    expect(result.distance).toBeGreaterThan(0);
    expect(result.isEstimated).toBe(true);
    expect(result.isLoading).toBe(false);
  });

  it("shows isEstimated: true on zone-pace result", () => {
    mockUseZonePace.mockReturnValue(
      zonePaceReturn({
        data: { zonePace: { 2: 3.0 }, activityCount: 5 },
      }),
    );

    const event = makeEvent({
      distance: 0,
      description: "Easy run\nWarm Up\n- 10m Z2",
    });

    const result = useEstimatedDistance(event);

    expect(result.isEstimated).toBe(true);
  });

  it("returns isLoading: true when zone pace is loading and event has steps", () => {
    mockUseZonePace.mockReturnValue(
      zonePaceReturn({ isLoading: true }),
    );

    const event = makeEvent({
      distance: 0,
      description: "Easy run\nWarm Up\n- 10m Z2",
    });

    const result = useEstimatedDistance(event);

    expect(result.isLoading).toBe(true);
    expect(result.distance).toBe(0);
  });

  it("falls back to name-parsed distance when no zone data", () => {
    mockUseZonePace.mockReturnValue(zonePaceReturn());

    const event = makeEvent({
      distance: 0,
      name: "Easy Run: 8km",
    });

    const result = useEstimatedDistance(event);

    expect(result.distance).toBe(8000);
    expect(result.isEstimated).toBe(false);
  });

  it("returns 0 when no distance source available", () => {
    mockUseZonePace.mockReturnValue(zonePaceReturn());

    const event = makeEvent({
      distance: 0,
      name: "Easy Run",
      description: undefined,
    });

    const result = useEstimatedDistance(event);

    expect(result).toEqual({ distance: 0, isEstimated: false, isLoading: false });
  });

  it("API distance takes precedence over zone-pace estimate", () => {
    mockUseZonePace.mockReturnValue(
      zonePaceReturn({
        data: { zonePace: { 2: 3.0 }, activityCount: 5 },
      }),
    );

    const event = makeEvent({
      distance: 5000,
      description: "Easy run\nWarm Up\n- 10m Z2",
    });

    const result = useEstimatedDistance(event);

    expect(result.distance).toBe(5000);
    expect(result.isEstimated).toBe(false);
  });
});
