import { IntervalsClient } from "../../src/lib/intervals/index.js";

export async function clearEvents(options: { from: string; to: string; dryRun?: boolean }) {
  const client = IntervalsClient.fromEnv();

  console.log(`Fetching events: ${options.from} → ${options.to}\n`);
  const events = await client.listEvents(options.from, options.to, "WORKOUT");

  if (events.length === 0) {
    console.log("No events found in that range.");
    return;
  }

  console.log(`Found ${events.length} events to delete:\n`);
  for (const e of events) {
    console.log(`  ${e.start_date_local}  ${e.name}  (id: ${e.id})`);
  }

  if (options.dryRun) {
    console.log("\n--- DRY RUN (nothing deleted) ---");
    return;
  }

  console.log("\nDeleting...");
  let deleted = 0;
  for (const e of events) {
    await client.deleteEvent(e.id);
    deleted++;
    process.stdout.write(`  Deleted ${deleted}/${events.length}\r`);
  }

  console.log(`\nDone — deleted ${deleted} events.`);
}
