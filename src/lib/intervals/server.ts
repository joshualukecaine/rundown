import { IntervalsClient } from "./client";

let client: IntervalsClient | null = null;

export function getClient(): IntervalsClient {
  if (!client) {
    client = IntervalsClient.fromEnv();
  }
  return client;
}
