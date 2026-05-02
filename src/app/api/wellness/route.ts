import { NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/intervals/server";
import { IntervalsAPIError } from "@/lib/intervals";
import { todayISO, addDays } from "@/lib/date-utils";
import { WellnessQuerySchema } from "@/lib/schemas";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const parsed = WellnessQuerySchema.safeParse({
    oldest: searchParams.get("oldest") ?? undefined,
    newest: searchParams.get("newest") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const today = todayISO();
  const newest = parsed.data.newest ?? today;
  const oldest = parsed.data.oldest ?? addDays(-28, newest);

  try {
    const client = await getClient();
    const wellness = await client.getWellness(oldest, newest);
    return NextResponse.json(wellness);
  } catch (error) {
    if (error instanceof IntervalsAPIError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
