import { IntervalsClient } from "./client";
import {
  IntervalsAPIError,
  IntervalsAuthError,
  IntervalsNotFoundError,
  IntervalsRateLimitError,
} from "./errors";

function mockFetch(status: number, body: unknown, headers: Record<string, string> = {}) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (key: string) => headers[key.toLowerCase()] ?? null,
    },
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(typeof body === "string" ? body : JSON.stringify(body)),
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("IntervalsClient.fromEnv", () => {
  it("should throw when INTERVALS_API_KEY is not set", () => {
    const original = process.env.INTERVALS_API_KEY;
    delete process.env.INTERVALS_API_KEY;
    expect(() => IntervalsClient.fromEnv()).toThrow("INTERVALS_API_KEY not set");
    process.env.INTERVALS_API_KEY = original;
  });

  it("should throw when INTERVALS_ATHLETE_ID is not set", () => {
    process.env.INTERVALS_API_KEY = "test-key";
    const original = process.env.INTERVALS_ATHLETE_ID;
    delete process.env.INTERVALS_ATHLETE_ID;
    expect(() => IntervalsClient.fromEnv()).toThrow("INTERVALS_ATHLETE_ID not set");
    process.env.INTERVALS_ATHLETE_ID = original;
  });
});

describe("IntervalsClient.listEvents", () => {
  it("should call the correct URL with oldest, newest, and category params", async () => {
    const fetchMock = mockFetch(200, []);
    vi.stubGlobal("fetch", fetchMock);

    const client = new IntervalsClient("key123", "athlete456");
    await client.listEvents("2026-03-01", "2026-03-31", "WORKOUT");

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("/athlete/athlete456/events");
    expect(url).toContain("oldest=2026-03-01");
    expect(url).toContain("newest=2026-03-31");
    expect(url).toContain("category=WORKOUT");
  });

  it("should omit category param when not provided", async () => {
    const fetchMock = mockFetch(200, []);
    vi.stubGlobal("fetch", fetchMock);

    const client = new IntervalsClient("key123", "athlete456");
    await client.listEvents("2026-03-01", "2026-03-31");

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).not.toContain("category=");
  });

  it("should return the parsed JSON response", async () => {
    const fakeEvents = [{ id: 1, name: "Run" }];
    vi.stubGlobal("fetch", mockFetch(200, fakeEvents));

    const client = new IntervalsClient("key123", "athlete456");
    const result = await client.listEvents("2026-03-01", "2026-03-31");
    expect(result).toEqual(fakeEvents);
  });
});

describe("IntervalsClient.createEvent", () => {
  it("should normalise a date-only start_date_local to include T00:00:00", async () => {
    const fetchMock = mockFetch(200, { id: 1 });
    vi.stubGlobal("fetch", fetchMock);

    const client = new IntervalsClient("key123", "athlete456");
    await client.createEvent({ start_date_local: "2026-03-03", category: "WORKOUT", name: "Run" });

    const [, options] = fetchMock.mock.calls[0] as [string, { body: string }];
    const sent = JSON.parse(options.body);
    expect(sent.start_date_local).toBe("2026-03-03T00:00:00");
  });

  it("should not modify start_date_local that already has a time component", async () => {
    const fetchMock = mockFetch(200, { id: 1 });
    vi.stubGlobal("fetch", fetchMock);

    const client = new IntervalsClient("key123", "athlete456");
    await client.createEvent({ start_date_local: "2026-03-03T08:00:00", category: "WORKOUT", name: "Run" });

    const [, options] = fetchMock.mock.calls[0] as [string, { body: string }];
    const sent = JSON.parse(options.body);
    expect(sent.start_date_local).toBe("2026-03-03T08:00:00");
  });
});

describe("IntervalsClient.deleteEvent", () => {
  it("should return undefined on 204 No Content", async () => {
    vi.stubGlobal("fetch", mockFetch(204, null));
    const client = new IntervalsClient("key123", "athlete456");
    const result = await client.deleteEvent(999);
    expect(result).toBeUndefined();
  });
});

describe("IntervalsClient.getWellness", () => {
  it("should call the correct URL with oldest and newest params", async () => {
    const fetchMock = mockFetch(200, []);
    vi.stubGlobal("fetch", fetchMock);

    const client = new IntervalsClient("key123", "athlete456");
    await client.getWellness("2026-04-01", "2026-05-02");

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("/athlete/athlete456/wellness");
    expect(url).toContain("oldest=2026-04-01");
    expect(url).toContain("newest=2026-05-02");
  });

  it("should return the parsed JSON response", async () => {
    const fakeWellness = [{ id: "2026-05-01", hrv: 42 }];
    vi.stubGlobal("fetch", mockFetch(200, fakeWellness));

    const client = new IntervalsClient("key123", "athlete456");
    const result = await client.getWellness("2026-04-01", "2026-05-02");
    expect(result).toEqual(fakeWellness);
  });
});

describe("IntervalsClient.fromBearerToken", () => {
  it("should send Bearer auth header instead of Basic", async () => {
    const fetchMock = mockFetch(200, []);
    vi.stubGlobal("fetch", fetchMock);

    const client = IntervalsClient.fromBearerToken("oauth-token-123", "i0");
    await client.listEvents("2026-03-01", "2026-03-31");

    const [, options] = fetchMock.mock.calls[0] as [string, { headers: Record<string, string> }];
    expect(options.headers["Authorization"]).toBe("Bearer oauth-token-123");
  });

  it("should use the provided athlete ID in request URLs", async () => {
    const fetchMock = mockFetch(200, []);
    vi.stubGlobal("fetch", fetchMock);

    const client = IntervalsClient.fromBearerToken("token", "i219999");
    await client.listEvents("2026-03-01", "2026-03-31");

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("/athlete/i219999/events");
  });
});

describe("IntervalsClient Authorization header", () => {
  it("should send Basic auth with API_KEY prefix and base64-encoded key", async () => {
    const fetchMock = mockFetch(200, []);
    vi.stubGlobal("fetch", fetchMock);

    const client = new IntervalsClient("mykey", "athlete456");
    await client.listEvents("2026-03-01", "2026-03-31");

    const [, options] = fetchMock.mock.calls[0] as [string, { headers: Record<string, string> }];
    const expected = "Basic " + Buffer.from("API_KEY:mykey").toString("base64");
    expect(options.headers["Authorization"]).toBe(expected);
  });
});

describe("IntervalsClient error handling", () => {
  it("should throw IntervalsAuthError on 401", async () => {
    vi.stubGlobal("fetch", mockFetch(401, "Unauthorized"));
    const client = new IntervalsClient("bad-key", "athlete456");
    await expect(client.listEvents("2026-03-01", "2026-03-31")).rejects.toThrow(IntervalsAuthError);
  });

  it("should throw IntervalsNotFoundError on 404", async () => {
    vi.stubGlobal("fetch", mockFetch(404, "Not Found"));
    const client = new IntervalsClient("key123", "athlete456");
    await expect(client.getAthlete()).rejects.toThrow(IntervalsNotFoundError);
  });

  it("should throw IntervalsRateLimitError on 429", async () => {
    vi.stubGlobal("fetch", mockFetch(429, "Rate limited", { "retry-after": "30" }));
    const client = new IntervalsClient("key123", "athlete456");
    await expect(client.listEvents("2026-03-01", "2026-03-31")).rejects.toThrow(
      IntervalsRateLimitError,
    );
  });

  it("should parse retryAfter from Retry-After header on 429", async () => {
    vi.stubGlobal("fetch", mockFetch(429, "Rate limited", { "retry-after": "60" }));
    const client = new IntervalsClient("key123", "athlete456");
    try {
      await client.listEvents("2026-03-01", "2026-03-31");
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(IntervalsRateLimitError);
      expect((err as IntervalsRateLimitError).retryAfter).toBe(60);
    }
  });

  it("should throw IntervalsAPIError with the response status on other errors", async () => {
    vi.stubGlobal("fetch", mockFetch(500, "Internal Server Error"));
    const client = new IntervalsClient("key123", "athlete456");
    try {
      await client.listEvents("2026-03-01", "2026-03-31");
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(IntervalsAPIError);
      expect((err as IntervalsAPIError).status).toBe(500);
    }
  });
});
