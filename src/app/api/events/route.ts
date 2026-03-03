import { NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/intervals/server";
import { IntervalsAPIError } from "@/lib/intervals";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const today = new Date().toISOString().slice(0, 10);
  const oldest = searchParams.get("oldest") ?? today;
  const newest = searchParams.get("newest") ?? today;
  const category = searchParams.get("category") ?? undefined;

  try {
    const events = await getClient().listEvents(oldest, newest, category);
    return NextResponse.json(events);
  } catch (error) {
    if (error instanceof IntervalsAPIError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const event = await getClient().createEvent(body);
    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    if (error instanceof IntervalsAPIError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
