import {
  IntervalsAPIError,
  IntervalsAuthError,
  IntervalsNotFoundError,
  IntervalsRateLimitError,
} from "./errors";

describe("IntervalsAPIError", () => {
  it("should set message, status, name, and body", () => {
    const err = new IntervalsAPIError("something failed", 500, "raw body");
    expect(err.message).toBe("something failed");
    expect(err.status).toBe(500);
    expect(err.body).toBe("raw body");
    expect(err.name).toBe("IntervalsAPIError");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(IntervalsAPIError);
  });

  it("should work without body", () => {
    const err = new IntervalsAPIError("msg", 500);
    expect(err.body).toBeUndefined();
  });
});

describe("IntervalsAuthError", () => {
  it("should have status 401, correct name, and inherit from IntervalsAPIError", () => {
    const err = new IntervalsAuthError();
    expect(err.status).toBe(401);
    expect(err.name).toBe("IntervalsAuthError");
    expect(err.message).toContain("Authentication failed");
    expect(err).toBeInstanceOf(IntervalsAPIError);
    expect(err).toBeInstanceOf(Error);
  });

  it("should accept optional body", () => {
    const err = new IntervalsAuthError("raw error");
    expect(err.body).toBe("raw error");
  });
});

describe("IntervalsNotFoundError", () => {
  it("should have status 404 and embed resource path in message", () => {
    const err = new IntervalsNotFoundError("/athlete/123/events/456");
    expect(err.status).toBe(404);
    expect(err.name).toBe("IntervalsNotFoundError");
    expect(err.message).toContain("/athlete/123/events/456");
    expect(err).toBeInstanceOf(IntervalsAPIError);
  });

  it("should accept optional body", () => {
    const err = new IntervalsNotFoundError("/athlete/123", "not found");
    expect(err.body).toBe("not found");
  });
});

describe("IntervalsRateLimitError", () => {
  it("should have status 429, store retryAfter, and embed it in message", () => {
    const err = new IntervalsRateLimitError(60);
    expect(err.status).toBe(429);
    expect(err.retryAfter).toBe(60);
    expect(err.name).toBe("IntervalsRateLimitError");
    expect(err.message).toContain("60");
    expect(err).toBeInstanceOf(IntervalsAPIError);
  });

  it("should work without retryAfter", () => {
    const err = new IntervalsRateLimitError();
    expect(err.retryAfter).toBeUndefined();
    expect(err.message).toContain("Rate limited");
  });
});
