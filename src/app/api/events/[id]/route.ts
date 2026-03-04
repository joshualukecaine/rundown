import { NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/intervals/server";
import { IntervalsAPIError } from "@/lib/intervals";
import { UpdateEventSchema } from "@/lib/schemas";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const eventId = Number(id);
  if (!Number.isInteger(eventId) || eventId <= 0) {
    return NextResponse.json({ error: "Invalid event id" }, { status: 400 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = UpdateEventSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  try {
    const client = await getClient();
    const event = await client.updateEvent(eventId, parsed.data);
    return NextResponse.json(event);
  } catch (error) {
    if (error instanceof IntervalsAPIError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const eventId = Number(id);
  if (!Number.isInteger(eventId) || eventId <= 0) {
    return NextResponse.json({ error: "Invalid event id" }, { status: 400 });
  }

  try {
    const client = await getClient();
    await client.deleteEvent(eventId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof IntervalsAPIError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
