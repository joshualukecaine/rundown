import { NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/intervals/server";
import { IntervalsAPIError } from "@/lib/intervals";
import { computeZonePace } from "@/lib/zone-pace";
import type { Interval } from "@/lib/intervals";

const MAX_ACTIVITIES = 10;
const LOOKBACK_DAYS = 90;

export async function GET(request: NextRequest) {
  try {
    const sportType = request.nextUrl.searchParams.get("sportType") ?? "Run";
    const client = await getClient();

    const now = new Date();
    const oldest = new Date(now);
    oldest.setDate(oldest.getDate() - LOOKBACK_DAYS);

    const newest = now.toISOString().slice(0, 10);
    const oldestStr = oldest.toISOString().slice(0, 10);

    const activities = await client.listActivities(oldestStr, newest, sportType);
    const recent = activities.slice(-MAX_ACTIVITIES);

    const results = await Promise.allSettled(
      recent.map((a) => client.getActivityIntervals(a.id)),
    );

    const allIntervals: Interval[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") {
        allIntervals.push(...result.value.icu_intervals);
      }
    }

    const zonePace = computeZonePace(allIntervals);

    return NextResponse.json({
      zonePace,
      activityCount: recent.length,
    });
  } catch (error) {
    if (error instanceof IntervalsAPIError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
