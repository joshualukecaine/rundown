import "dotenv/config";
import { pushPlan } from "./commands/push-plan.js";
import { listEvents } from "./commands/list-events.js";
import { clearEvents } from "./commands/clear-events.js";
import { listActivities } from "./commands/list-activities.js";

const [command, ...args] = process.argv.slice(2);

function parseFlags(args: string[]): Record<string, string | boolean> {
  const flags: Record<string, string | boolean> = {};
  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith("--")) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(arg);
    }
  }

  flags._positional = positional.join(" ");
  return flags;
}

async function main() {
  const flags = parseFlags(args);

  try {
    switch (command) {
      case "push-plan": {
        const file = flags._positional as string;
        if (!file) {
          console.error("Usage: cli push-plan <file.json> [--dry-run]");
          process.exit(1);
        }
        await pushPlan(file, { dryRun: !!flags["dry-run"] });
        break;
      }

      case "list": {
        await listEvents({
          from: flags.from as string | undefined,
          to: flags.to as string | undefined,
          raw: !!flags.raw,
        });
        break;
      }

      case "clear": {
        const from = flags.from as string;
        const to = flags.to as string;
        if (!from || !to) {
          console.error("Usage: cli clear --from YYYY-MM-DD --to YYYY-MM-DD [--dry-run]");
          process.exit(1);
        }
        await clearEvents({ from, to, dryRun: !!flags["dry-run"] });
        break;
      }

      case "activities": {
        await listActivities({
          from: flags.from as string | undefined,
          to: flags.to as string | undefined,
          weeks: flags.weeks ? parseInt(flags.weeks as string, 10) : undefined,
          sport: flags.sport as string | undefined,
          summary: !!flags.summary,
          raw: !!flags.raw,
        });
        break;
      }

      default:
        console.log(`Training CLI — Intervals.icu integration

Commands:
  push-plan <file.json>                Push training plan to Intervals.icu
    --dry-run                          Preview without sending

  list                                 List planned events
    --from YYYY-MM-DD                  Start date (default: today)
    --to YYYY-MM-DD                    End date (default: +30 days)
    --raw                              Output raw JSON

  clear                                Delete planned events in date range
    --from YYYY-MM-DD                  Start date (required)
    --to YYYY-MM-DD                    End date (required)
    --dry-run                          Preview without deleting

  activities                           List completed activities
    --from YYYY-MM-DD                  Start date (default: 12 weeks ago)
    --to YYYY-MM-DD                    End date (default: today)
    --weeks N                          Last N weeks (shorthand for --from)
    --sport TYPE                       Sport type (default: Run)
    --summary                          Weekly totals only
    --raw                              Output raw JSON
`);
        if (command) {
          console.error(`Unknown command: ${command}`);
          process.exit(1);
        }
    }
  } catch (err) {
    if (err instanceof Error) {
      console.error(`\nError: ${err.message}`);
      if ("status" in err) console.error(`Status: ${(err as any).status}`);
      if ("body" in err && (err as any).body) console.error(`Response: ${(err as any).body}`);
    } else {
      console.error(err);
    }
    process.exit(1);
  }
}

main();
