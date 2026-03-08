import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { IntervalsAPIError } from "@/lib/intervals";

vi.mock("@/lib/intervals/server", () => ({
  getClient: vi.fn(),
}));

import { getClient } from "@/lib/intervals/server";
import { PUT, DELETE } from "./route";

const mockGetClient = vi.mocked(getClient);

function makeParams(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

function makePutRequest(body: unknown) {
  return new NextRequest(new URL("http://localhost:3000/api/events/1"), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeDeleteRequest() {
  return new NextRequest(new URL("http://localhost:3000/api/events/1"), {
    method: "DELETE",
  });
}

function mockClient(overrides: Record<string, unknown> = {}) {
  return {
    updateEvent: vi.fn().mockResolvedValue({ id: 1, name: "Updated" }),
    deleteEvent: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

afterEach(() => vi.clearAllMocks());

describe("PUT /api/events/[id]", () => {
  it("updates event and returns updated data", async () => {
    const updated = { id: 1, name: "Updated Run" };
    const client = mockClient({ updateEvent: vi.fn().mockResolvedValue(updated) });
    mockGetClient.mockResolvedValue(client as never);

    const res = await PUT(makePutRequest({ name: "Updated Run" }), makeParams("1"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(updated);
    expect(client.updateEvent).toHaveBeenCalledWith(1, { name: "Updated Run" });
  });

  it("returns 400 for non-numeric id", async () => {
    const res = await PUT(makePutRequest({ name: "Test" }), makeParams("abc"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid event id");
  });

  it("returns 400 for negative id", async () => {
    const res = await PUT(makePutRequest({ name: "Test" }), makeParams("-1"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid event id");
  });

  it("returns 400 for invalid JSON body", async () => {
    const req = new NextRequest(new URL("http://localhost:3000/api/events/1"), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: "not json{",
    });

    const res = await PUT(req, makeParams("1"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid JSON body");
  });

  it("returns 400 with Zod issues for invalid fields", async () => {
    const res = await PUT(makePutRequest({ category: "INVALID" }), makeParams("1"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBeInstanceOf(Array);
  });

  it("returns error JSON on IntervalsAPIError", async () => {
    mockGetClient.mockResolvedValue(
      mockClient({
        updateEvent: vi.fn().mockRejectedValue(new IntervalsAPIError("Not Found", 404)),
      }) as never,
    );

    const res = await PUT(makePutRequest({ name: "Test" }), makeParams("1"));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Not Found");
  });
});

describe("DELETE /api/events/[id]", () => {
  it("deletes event and returns 204 empty body", async () => {
    const client = mockClient();
    mockGetClient.mockResolvedValue(client as never);

    const res = await DELETE(makeDeleteRequest(), makeParams("1"));

    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
    expect(client.deleteEvent).toHaveBeenCalledWith(1);
  });

  it("returns 400 for non-numeric id", async () => {
    const res = await DELETE(makeDeleteRequest(), makeParams("abc"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid event id");
  });

  it("returns error JSON on IntervalsAPIError", async () => {
    mockGetClient.mockResolvedValue(
      mockClient({
        deleteEvent: vi.fn().mockRejectedValue(new IntervalsAPIError("Server Error", 500)),
      }) as never,
    );

    const res = await DELETE(makeDeleteRequest(), makeParams("1"));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Server Error");
  });
});
