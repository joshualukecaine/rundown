import { describe, it, expect, vi, afterEach } from "vitest";
import { IntervalsAPIError } from "@/lib/intervals";

vi.mock("@/lib/intervals/server", () => ({
  getClient: vi.fn(),
}));

import { getClient } from "@/lib/intervals/server";
import { GET } from "./route";

const mockGetClient = vi.mocked(getClient);

afterEach(() => vi.clearAllMocks());

describe("GET /api/athlete", () => {
  it("returns athlete data", async () => {
    const athlete = { id: "i123", name: "Test Runner", timezone: "US/Eastern" };
    mockGetClient.mockResolvedValue({
      getAthlete: vi.fn().mockResolvedValue(athlete),
    } as never);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(athlete);
  });

  it("returns error JSON on IntervalsAPIError", async () => {
    mockGetClient.mockResolvedValue({
      getAthlete: vi.fn().mockRejectedValue(new IntervalsAPIError("Unauthorized", 401)),
    } as never);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });
});
