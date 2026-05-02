import {
  IntervalsAPIError,
  IntervalsAuthError,
  IntervalsNotFoundError,
  IntervalsRateLimitError,
} from "./errors";
import type { Activity, Athlete, CreateEventInput, Event, IntervalsDTO, Wellness } from "./types";

const BASE_URL = "https://intervals.icu/api/v1";
const DEFAULT_TIMEOUT = 30_000;

/** Ensure date strings include time component (API requires datetime, not just date) */
function normalizeEventDates<T extends { start_date_local: string }>(event: T): T {
  const d = event.start_date_local;
  if (d.length === 10) {
    return { ...event, start_date_local: `${d}T00:00:00` };
  }
  return event;
}

export class IntervalsClient {
  private authHeader: string;
  private athleteId: string;

  constructor(apiKey: string, athleteId: string) {
    this.authHeader =
      "Basic " + Buffer.from(`API_KEY:${apiKey}`).toString("base64");
    this.athleteId = athleteId;
  }

  static fromBearerToken(token: string, athleteId: string): IntervalsClient {
    const client = Object.create(IntervalsClient.prototype) as IntervalsClient;
    client.authHeader = `Bearer ${token}`;
    client.athleteId = athleteId;
    return client;
  }

  static fromEnv(): IntervalsClient {
    const apiKey = process.env.INTERVALS_API_KEY;
    const athleteId = process.env.INTERVALS_ATHLETE_ID;
    if (!apiKey) throw new Error("INTERVALS_API_KEY not set");
    if (!athleteId) throw new Error("INTERVALS_ATHLETE_ID not set");
    return new IntervalsClient(apiKey, athleteId);
  }

  // --- Events (planned workouts) ---

  async listEvents(
    oldest: string,
    newest: string,
    category?: string,
  ): Promise<Event[]> {
    const params = new URLSearchParams({ oldest, newest });
    if (category) params.set("category", category);
    return this.request<Event[]>(
      "GET",
      `/athlete/${this.athleteId}/events?${params}`,
    );
  }

  async createEvent(event: CreateEventInput): Promise<Event> {
    return this.request<Event>(
      "POST",
      `/athlete/${this.athleteId}/events?upsertOnUid=false`,
      normalizeEventDates(event),
    );
  }

  async createEventsBulk(
    events: CreateEventInput[],
    options: { upsert?: boolean; upsertOnUid?: boolean } = {},
  ): Promise<Event[]> {
    const params = new URLSearchParams({
      upsert: String(options.upsert ?? false),
      upsertOnUid: String(options.upsertOnUid ?? false),
      updatePlanApplied: "false",
    });
    return this.request<Event[]>(
      "POST",
      `/athlete/${this.athleteId}/events/bulk?${params}`,
      events.map(normalizeEventDates),
    );
  }

  async updateEvent(
    eventId: number,
    event: Partial<CreateEventInput>,
  ): Promise<Event> {
    return this.request<Event>(
      "PUT",
      `/athlete/${this.athleteId}/events/${eventId}`,
      event,
    );
  }

  async deleteEvent(eventId: number): Promise<void> {
    await this.request<void>(
      "DELETE",
      `/athlete/${this.athleteId}/events/${eventId}`,
    );
  }

  // --- Activities (completed workouts) ---

  async listActivities(
    oldest: string,
    newest: string,
    type?: string,
  ): Promise<Activity[]> {
    const params = new URLSearchParams({ oldest, newest });
    if (type) params.set("type", type);
    return this.request<Activity[]>(
      "GET",
      `/athlete/${this.athleteId}/activities?${params}`,
    );
  }

  async getActivityIntervals(activityId: number): Promise<IntervalsDTO> {
    return this.request<IntervalsDTO>(
      "GET",
      `/activity/${activityId}/intervals`,
    );
  }

  // --- Wellness (Garmin sync) ---

  async getWellness(oldest: string, newest: string): Promise<Wellness[]> {
    const params = new URLSearchParams({ oldest, newest });
    return this.request<Wellness[]>(
      "GET",
      `/athlete/${this.athleteId}/wellness?${params}`,
    );
  }

  // --- Athlete ---

  async getAthlete(): Promise<Athlete> {
    return this.request<Athlete>("GET", `/athlete/${this.athleteId}`);
  }

  // --- HTTP ---

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${BASE_URL}${path}`;
    const headers: Record<string, string> = {
      Authorization: this.authHeader,
      Accept: "application/json",
    };
    if (body) headers["Content-Type"] = "application/json";

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      switch (response.status) {
        case 401:
          throw new IntervalsAuthError(text);
        case 404:
          throw new IntervalsNotFoundError(path, text);
        case 429: {
          const retry = response.headers.get("Retry-After");
          throw new IntervalsRateLimitError(
            retry ? parseInt(retry, 10) : undefined,
            text,
          );
        }
        default:
          throw new IntervalsAPIError(
            `${method} ${path} failed: ${response.status}`,
            response.status,
            text,
          );
      }
    }

    if (response.status === 204 || method === "DELETE") return undefined as T;
    return response.json() as Promise<T>;
  }
}
