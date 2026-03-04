import { IntervalsClient } from "./client";
import { getSession } from "@/lib/auth/session";

export async function getClient(): Promise<IntervalsClient> {
  const session = await getSession();
  if (session.accessToken) {
    return IntervalsClient.fromBearerToken(session.accessToken, session.athleteId);
  }

  throw new Error("Not authenticated");
}
