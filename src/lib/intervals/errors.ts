export class IntervalsAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: string,
  ) {
    super(message);
    this.name = "IntervalsAPIError";
  }
}

export class IntervalsAuthError extends IntervalsAPIError {
  constructor(body?: string) {
    super("Authentication failed — check INTERVALS_API_KEY", 401, body);
    this.name = "IntervalsAuthError";
  }
}

export class IntervalsNotFoundError extends IntervalsAPIError {
  constructor(resource: string, body?: string) {
    super(`Not found: ${resource}`, 404, body);
    this.name = "IntervalsNotFoundError";
  }
}

export class IntervalsRateLimitError extends IntervalsAPIError {
  constructor(
    public retryAfter?: number,
    body?: string,
  ) {
    super(
      `Rate limited${retryAfter ? ` — retry after ${retryAfter}s` : ""}`,
      429,
      body,
    );
    this.name = "IntervalsRateLimitError";
  }
}
