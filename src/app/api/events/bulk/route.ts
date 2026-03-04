import { NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/intervals/server";
import { IntervalsAPIError } from "@/lib/intervals";
import { BulkCreateSchema } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = BulkCreateSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { searchParams } = request.nextUrl;
  const upsert = searchParams.get("upsert") === "true";

  try {
    const client = await getClient();
    const events = await client.createEventsBulk(parsed.data, { upsert });
    return NextResponse.json(events, { status: 201 });
  } catch (error) {
    if (error instanceof IntervalsAPIError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
