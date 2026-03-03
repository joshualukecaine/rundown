import { NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/intervals/server";
import { IntervalsAPIError } from "@/lib/intervals";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const upsert = searchParams.get("upsert") === "true";
    const body = await request.json();
    const events = await getClient().createEventsBulk(body, { upsert });
    return NextResponse.json(events, { status: 201 });
  } catch (error) {
    if (error instanceof IntervalsAPIError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
