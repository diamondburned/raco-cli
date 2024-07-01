#!/usr/bin/env -S deno run -A

import * as flags from "https://deno.land/std@0.42.0/flags/mod.ts";
import * as raco from "./raco.ts";

const defaultArea = "hanoi";
let verbose = false;

const usage = `
Usage:
	raco-events [options] <genres>...
Flags:
	-a, --area <area>        Area name (default: ${defaultArea})
	-j, --json               Output as JSON
	-h, --help               Show this help message
	-v, --verbose            Enable verbose logging
`.trim();

async function main() {
  const args = flags.parse(Deno.args, {
    boolean: ["json", "help", "verbose"],
    string: ["country", "area"],
    alias: {
      "country": "c",
      "area": "a",
      "json": "j",
      "help": "h",
      "verbose": "v",
    },
    stopEarly: true,
    "--": true,
  });

  verbose = args.verbose;
  if (!verbose) {
    console.debug = () => {};
  }

  if (args.help) {
    console.log(usage);
    return;
  }

  const genres = args["_"].map((g) => g.toString().toLowerCase());
  if (genres.length === 0) {
    console.error("%cError: %cNo genre specified", "color: red", "");
    console.log(usage);
    Deno.exit(1);
  }

  const area = await raco.area(args.area || defaultArea);
  const data = await raco.events(area.id, genres);
  const events = data.events;

  if (args.json) {
    console.log(JSON.stringify(events, null, 2));
    return;
  }

  if (events.length === 0) {
    console.log("No events found");
    Deno.exit(1);
  }

  for (const event of events) {
    const eventDate = event.date.toLocaleDateString(undefined, { dateStyle: "medium" });
    console.log(
      `%c🗓️  ${eventDate}  ̸📍 ${event.venue.name}` +
        (event.attending ? ` ̸ 👤 ${event.attending}` : ""),
      "font-weight: bold; color: grey",
    );
    console.log(
      `   %c${terminalLink(event.name, event.url)}`,
      "font-weight: bold",
    );
    if (event.artists.length > 0) {
      console.log(
        `   ${event.artists.map((a) => terminalLink(a.name, a.url)).join(", ")}`,
      );
    }
    console.log();
  }
}

function terminalLink(title: string, url: string): string {
  return `\x1b]8;;${url}\x1b\\${title}\x1b]8;;\x1b\\`;
}

await main();
