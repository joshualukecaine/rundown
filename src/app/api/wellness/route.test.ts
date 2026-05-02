import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { IntervalsAPIError } from "@/lib/intervals";

vi.mock("@/lib/intervals/server", () => ({
  getClient: vi.fn(),
}));

vi.mock("@/lib/date-utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/date-utils")>();
  return { ...actual, todayISO: () => "2026-05-02" };
});

import { getClient } from "@/lib/intervals/server";
import { GET } from "./route";

const mockGetClient = vi.mocked(getClient);

function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost:3000/api/wellness");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url);
}

function mockClient(overrides: Record<string, unknown> = {}) {
  return {
    getWellness: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

afterEach(() => vi.clearAllMocks());

describe("GET /api/wellness", () => {
  it("returns wellness data for valid date range", async () => {
    const data = [{ id: "2026-05-01", hrv: 42 }];
    const client = mockClient({ getWellness: vi.fn().mockResolvedValue(data) });
    mockGetClient.mockResolvedValue(client as never);

    const res = await GET(makeGetRequest({ oldest: "2026-04-01", newest: "2026-05-02" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(data);
    expect(client.getWellness).toHaveBeenCalledWith("2026-04-01", "2026-05-02");
  });

  it("defaults to 28-day range from today when no params", async () => {
    const client = mockClient();
    mockGetClient.mockResolvedValue(client as never);

    await GET(makeGetRequest());

    expect(client.getWellness).toHaveBeenCalledWith("2026-04-04", "2026-05-02");
  });

  it("defaults oldest to 28 days before newest when only newest provided", async () => {
    const client = mockClient();
    mockGetClient.mockResolvedValue(client as never);

    await GET(makeGetRequest({ newest: "2026-04-15" }));

    expect(client.getWellness).toHaveBeenCalledWith("2026-03-18", "2026-04-15");
  });

  it("returns 400 for invalid date format", async () => {
    const res = await GET(makeGetRequest({ oldest: "not-a-date" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBeInstanceOf(Array);
  });

  it("returns error JSON on IntervalsAPIError", async () => {
    mockGetClient.mockResolvedValue(
      mockClient({
        getWellness: vi.fn().mockRejectedValue(new IntervalsAPIError("Server Error", 500)),
      }) as never,
    );

    const res = await GET(makeGetRequest({ oldest: "2026-04-01", newest: "2026-05-02" }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Server Error");
  });

  it("rethrows non-IntervalsAPIError errors", async () => {
    mockGetClient.mockResolvedValue(
      mockClient({
        getWellness: vi.fn().mockRejectedValue(new Error("Network failure")),
      }) as never,
    );

    await expect(GET(makeGetRequest())).rejects.toThrow("Network failure");
  });
});
