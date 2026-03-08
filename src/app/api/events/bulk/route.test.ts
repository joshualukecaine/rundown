import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { IntervalsAPIError } from "@/lib/intervals";

vi.mock("@/lib/intervals/server", () => ({
  getClient: vi.fn(),
}));

import { getClient } from "@/lib/intervals/server";
import { POST } from "./route";

const mockGetClient = vi.mocked(getClient);

function makeRequest(body: unknown, params: Record<string, string> = {}) {
  const url = new URL("http://localhost:3000/api/events/bulk");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function mockClient(overrides: Record<string, unknown> = {}) {
  return {
    createEventsBulk: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

const validEvent = {
  start_date_local: "2026-03-10",
  category: "WORKOUT",
  name: "Easy Run",
};

afterEach(() => vi.clearAllMocks());

describe("POST /api/events/bulk", () => {
  it("creates events and returns 201", async () => {
    const created = [{ id: 1, ...validEvent }];
    const client = mockClient({ createEventsBulk: vi.fn().mockResolvedValue(created) });
    mockGetClient.mockResolvedValue(client as never);

    const res = await POST(makeRequest([validEvent]));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body).toEqual(created);
  });

  it("passes upsert=true query param to client", async () => {
    const client = mockClient();
    mockGetClient.mockResolvedValue(client as never);

    await POST(makeRequest([validEvent], { upsert: "true" }));

    expect(client.createEventsBulk).toHaveBeenCalledWith(
      expect.any(Array),
      { upsert: true },
    );
  });

  it("defaults upsert to false when not provided", async () => {
    const client = mockClient();
    mockGetClient.mockResolvedValue(client as never);

    await POST(makeRequest([validEvent]));

    expect(client.createEventsBulk).toHaveBeenCalledWith(
      expect.any(Array),
      { upsert: false },
    );
  });

  it("returns 400 for invalid JSON body", async () => {
    const req = new NextRequest(new URL("http://localhost:3000/api/events/bulk"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json{",
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid JSON body");
  });

  it("returns 400 for empty array", async () => {
    const res = await POST(makeRequest([]));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBeInstanceOf(Array);
  });

  it("returns 400 with Zod issues for invalid event data", async () => {
    const res = await POST(makeRequest([{ name: "missing fields" }]));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBeInstanceOf(Array);
  });

  it("returns error JSON on IntervalsAPIError", async () => {
    mockGetClient.mockResolvedValue(
      mockClient({
        createEventsBulk: vi.fn().mockRejectedValue(new IntervalsAPIError("Rate Limited", 429)),
      }) as never,
    );

    const res = await POST(makeRequest([validEvent]));
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error).toBe("Rate Limited");
  });
});
