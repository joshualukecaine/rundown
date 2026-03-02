import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { IntervalsClient, type CreateEventInput } from "../../src/lib/intervals/index.js";

export async function pushPlan(filePath: string, options: { dryRun?: boolean }) {
  const fullPath = resolve(filePath);

  console.log(`Reading plan from: ${fullPath}`);
  const raw = readFileSync(fullPath, "utf-8");
  const events: CreateEventInput[] = JSON.parse(raw);

  console.log(`Found ${events.length} events to push`);

  if (options.dryRun) {
    console.log("\n--- DRY RUN (not sending to API) ---\n");
    for (const e of events) {
      console.log(`  ${e.start_date_local}  ${e.name}  ${e.distance ? (e.distance / 1000).toFixed(1) + "km" : ""}`);
    }
    console.log(`\nTotal: ${events.length} events`);
    return;
  }

  const client = IntervalsClient.fromEnv();
  console.log("Pushing to Intervals.icu (bulk upsert on external_id)...\n");
  const result = await client.createEventsBulk(events, { upsert: true });

  console.log(`Successfully pushed ${result.length} events:\n`);
  for (const e of result) {
    console.log(`  ${e.start_date_local}  ${e.name}  (id: ${e.id})`);
  }
}
