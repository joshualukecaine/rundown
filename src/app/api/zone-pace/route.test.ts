import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { IntervalsAPIError } from "@/lib/intervals";

vi.mock("@/lib/intervals/server", () => ({
  getClient: vi.fn(),
}));

import { getClient } from "@/lib/intervals/server";
import { GET } from "./route";

const mockGetClient = vi.mocked(getClient);

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost:3000/api/zone-pace");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url);
}

function mockClient(overrides: Record<string, unknown> = {}) {
  return {
    listActivities: vi.fn().mockResolvedValue([]),
    getActivityIntervals: vi.fn().mockResolvedValue({ icu_intervals: [] }),
    ...overrides,
  };
}

afterEach(() => vi.clearAllMocks());

describe("GET /api/zone-pace", () => {
  it("returns zonePace and activityCount for valid request", async () => {
    const client = mockClient({
      listActivities: vi.fn().mockResolvedValue([
        { id: 1 },
        { id: 2 },
      ]),
      getActivityIntervals: vi.fn().mockResolvedValue({
        icu_intervals: [
          { zone: 2, average_speed: 3.0, moving_time: 600, distance: 1800, average_heartrate: 140 },
        ],
      }),
    });
    mockGetClient.mockResolvedValue(client as never);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.activityCount).toBe(2);
    expect(body.zonePace).toHaveProperty("2");
  });

  it("defaults sportType to 'Run' when not provided", async () => {
    const client = mockClient();
    mockGetClient.mockResolvedValue(client as never);

    await GET(makeRequest());

    expect(client.listActivities).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      "Run",
    );
  });

  it("passes sportType param to listActivities", async () => {
    const client = mockClient();
    mockGetClient.mockResolvedValue(client as never);

    await GET(makeRequest({ sportType: "Ride" }));

    expect(client.listActivities).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      "Ride",
    );
  });

  it("handles empty activities array", async () => {
    const client = mockClient({ listActivities: vi.fn().mockResolvedValue([]) });
    mockGetClient.mockResolvedValue(client as never);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.activityCount).toBe(0);
    expect(body.zonePace).toEqual({});
  });

  it("handles all interval fetches failing via Promise.allSettled", async () => {
    const client = mockClient({
      listActivities: vi.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]),
      getActivityIntervals: vi.fn().mockRejectedValue(new Error("network")),
    });
    mockGetClient.mockResolvedValue(client as never);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.activityCount).toBe(2);
    expect(body.zonePace).toEqual({});
  });

  it("handles partial interval fetch failures", async () => {
    const client = mockClient({
      listActivities: vi.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]),
      getActivityIntervals: vi.fn()
        .mockResolvedValueOnce({
          icu_intervals: [
            { zone: 3, average_speed: 3.5, moving_time: 300, distance: 1050, average_heartrate: 150 },
          ],
        })
        .mockRejectedValueOnce(new Error("timeout")),
    });
    mockGetClient.mockResolvedValue(client as never);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.activityCount).toBe(2);
    expect(body.zonePace).toHaveProperty("3");
  });

  it("returns error JSON with status on IntervalsAPIError", async () => {
    mockGetClient.mockRejectedValue(new IntervalsAPIError("Forbidden", 403));

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });
});
