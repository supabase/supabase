#!/usr/bin/env bun
import kleur from "kleur";
import { TEST_CATEGORIES } from "./src/context.ts";
import type { SuiteDescriptor } from "./src/runner.ts";
import { initOtel, patchFetch } from "./src/runner.ts";
import { runSuites } from "./src/orchestrator.ts";
import { broadcastBinary } from "./src/suites/broadcast-binary.ts";
import { authorization } from "./src/suites/authorization.ts";
import { loadBroadcastFromDb } from "./src/suites/load-broadcast-from-db.ts";
import { loadBroadcastReplay } from "./src/suites/load-broadcast-replay.ts";
import { connection } from "./src/suites/connection.ts";
import { loadPresence } from "./src/suites/load-presence.ts";
import { broadcast } from "./src/suites/broadcast.ts";
import { presence } from "./src/suites/presence.ts";
import { loadBroadcast } from "./src/suites/load-broadcast.ts";
import { broadcastChanges } from "./src/suites/broadcast-changes.ts";
import { loadPostgresChanges } from "./src/suites/load-postgres-changes.ts";
import { postgresChanges } from "./src/suites/postgres-changes.ts";
import { broadcastReplay } from "./src/suites/broadcast-replay.ts";
import { postgresChangesFilters } from "./src/suites/postgres-changes-filters.ts";

const descriptors: SuiteDescriptor[] = [
  connection,
  loadPostgresChanges,
  loadPresence,
  loadBroadcast,
  loadBroadcastFromDb,
  loadBroadcastReplay,
  broadcast,
  broadcastReplay,
  presence,
  authorization,
  postgresChanges,
  postgresChangesFilters,
  broadcastChanges,
  broadcastBinary,
];

async function main() {
  initOtel();
  patchFetch();
  await runSuites(descriptors, TEST_CATEGORIES);
}

main().catch((e) => {
  console.error(kleur.red("Fatal error:"), e.message);
  if (e?.stack) console.error(kleur.dim(e.stack));
  process.exit(1);
});
