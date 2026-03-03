import { NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/intervals/server";
import { IntervalsAPIError } from "@/lib/intervals";
import { todayISO } from "@/lib/date-utils";
import { EventQuerySchema, CreateEventSchema } from "@/lib/schemas";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const parsed = EventQuerySchema.safeParse({
    oldest: searchParams.get("oldest") ?? undefined,
    newest: searchParams.get("newest") ?? undefined,
    category: searchParams.get("category") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const today = todayISO();
  const { oldest = today, newest = today, category } = parsed.data;

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
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CreateEventSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  try {
    const event = await getClient().createEvent(parsed.data);
    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    if (error instanceof IntervalsAPIError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
