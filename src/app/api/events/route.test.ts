import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { IntervalsAPIError } from "@/lib/intervals";

vi.mock("@/lib/intervals/server", () => ({
  getClient: vi.fn(),
}));

vi.mock("@/lib/date-utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/date-utils")>();
  return { ...actual, todayISO: () => "2026-03-08" };
});

import { getClient } from "@/lib/intervals/server";
import { GET, POST } from "./route";

const mockGetClient = vi.mocked(getClient);

function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost:3000/api/events");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url);
}

function makePostRequest(body: unknown) {
  return new NextRequest(new URL("http://localhost:3000/api/events"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function mockClient(overrides: Record<string, unknown> = {}) {
  return {
    listEvents: vi.fn().mockResolvedValue([]),
    createEvent: vi.fn().mockResolvedValue({ id: 1 }),
    ...overrides,
  };
}

const validEvent = {
  start_date_local: "2026-03-10",
  category: "WORKOUT",
  name: "Easy Run",
};

afterEach(() => vi.clearAllMocks());

describe("GET /api/events", () => {
  it("returns events for valid date range params", async () => {
    const events = [{ id: 1, name: "Run" }];
    const client = mockClient({ listEvents: vi.fn().mockResolvedValue(events) });
    mockGetClient.mockResolvedValue(client as never);

    const res = await GET(makeGetRequest({ oldest: "2026-03-01", newest: "2026-03-08" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(events);
    expect(client.listEvents).toHaveBeenCalledWith("2026-03-01", "2026-03-08", undefined);
  });

  it("defaults oldest/newest to today when not provided", async () => {
    const client = mockClient();
    mockGetClient.mockResolvedValue(client as never);

    await GET(makeGetRequest());

    expect(client.listEvents).toHaveBeenCalledWith("2026-03-08", "2026-03-08", undefined);
  });

  it("returns 400 with Zod issues for invalid date format", async () => {
    const res = await GET(makeGetRequest({ oldest: "not-a-date" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBeInstanceOf(Array);
  });

  it("passes category param to client.listEvents", async () => {
    const client = mockClient();
    mockGetClient.mockResolvedValue(client as never);

    await GET(makeGetRequest({ oldest: "2026-03-01", newest: "2026-03-08", category: "WORKOUT" }));

    expect(client.listEvents).toHaveBeenCalledWith("2026-03-01", "2026-03-08", "WORKOUT");
  });

  it("returns error JSON on IntervalsAPIError", async () => {
    mockGetClient.mockResolvedValue(
      mockClient({
        listEvents: vi.fn().mockRejectedValue(new IntervalsAPIError("Not Found", 404)),
      }) as never,
    );

    const res = await GET(makeGetRequest({ oldest: "2026-03-01", newest: "2026-03-08" }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Not Found");
  });
});

describe("POST /api/events", () => {
  it("creates event and returns 201 for valid body", async () => {
    const created = { id: 1, ...validEvent };
    const client = mockClient({ createEvent: vi.fn().mockResolvedValue(created) });
    mockGetClient.mockResolvedValue(client as never);

    const res = await POST(makePostRequest(validEvent));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body).toEqual(created);
  });

  it("returns 400 for invalid JSON body", async () => {
    const req = new NextRequest(new URL("http://localhost:3000/api/events"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json{",
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid JSON body");
  });

  it("returns 400 with Zod issues for missing required fields", async () => {
    const res = await POST(makePostRequest({ name: "Run" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBeInstanceOf(Array);
  });

  it("returns 400 for invalid category enum value", async () => {
    const res = await POST(makePostRequest({ ...validEvent, category: "INVALID" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBeInstanceOf(Array);
  });

  it("returns error JSON on IntervalsAPIError", async () => {
    mockGetClient.mockResolvedValue(
      mockClient({
        createEvent: vi.fn().mockRejectedValue(new IntervalsAPIError("Server Error", 500)),
      }) as never,
    );

    const res = await POST(makePostRequest(validEvent));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Server Error");
  });
});
