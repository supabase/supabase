import { SERVICE_KEY, dbPassword, DB_URL_ARG, env, PARALLEL } from "./context.ts";
import type { SuiteDescriptor, SuiteCtx } from "./runner.ts";
import { log, printSummary, flushOtel, results, createSuiteTest } from "./runner.ts";
import { setup, cleanup } from "./fixtures.ts";
import { makeAuthedClientFactory, type TestSession } from "./helpers.ts";

function isLoadSuite(d: SuiteDescriptor) {
  return d.name.startsWith("load");
}

// postgres-changes and postgres-changes-filters both hammer the pg_changes table with
// their own --parallel internal concurrency. Each is solid on its own (and against
// suites that don't touch pg_changes), but run together they saturate the realtime
// server's postgres_changes fanout for that table enough to make even narrow, correctly
// scoped filters miss the event timeout. Keep them out of each other's way — sequential
// relative to each other — while still running fully concurrently with every other suite.
function sharesPgChanges(d: SuiteDescriptor) {
  return d.name === "postgres-changes" || d.name === "postgres-changes-filters";
}

async function runSuite(d: SuiteDescriptor, testUser: { email: string; password: string }, authedClient: SuiteCtx["authedClient"]) {
  const { test, drain } = createSuiteTest(d.label, isLoadSuite(d) ? false : d.runCasesInParallel);
  await d.run({ testUser, authedClient, test });
  await drain();
}

// Lives outside runner.ts to avoid an import cycle: fixtures.ts (setup/cleanup) already
// imports `log` from runner.ts, so runner.ts can't import fixtures.ts back.
export async function runSuites(descriptors: SuiteDescriptor[], testCategories: string[] | null) {
  const LOAD_SUITES = descriptors.map((d) => d.name).filter((n) => n.startsWith("load"));
  const FUNCTIONAL_SUITES = descriptors.map((d) => d.name).filter((n) => !n.startsWith("load"));

  const activeCategories = testCategories
    ? testCategories.flatMap((c: string) => {
        if (c === "functional") return FUNCTIONAL_SUITES;
        if (c === "load") return LOAD_SUITES;
        return [c];
      })
    : null;

  if (activeCategories) {
    const unknown = activeCategories.filter((c: string) => !descriptors.some((d) => d.name === c));
    if (unknown.length > 0) {
      const valid = ["functional", "load", ...descriptors.map((d) => d.name)].join(", ");
      log(`Unknown test categories: ${unknown.join(", ")}\nValid categories: ${valid}`);
      process.exit(1);
    }
  }

  const suitesToRun = activeCategories
    ? descriptors.filter((d) => activeCategories.includes(d.name))
    : descriptors;

  const needsDb = suitesToRun.some((d) => d.needsDb);

  if (needsDb && !SERVICE_KEY) {
    console.error("--secret-key is required");
    process.exit(1);
  }

  if (needsDb && env !== "local" && !dbPassword && !DB_URL_ARG) {
    console.error("--db-password is required for staging and prod environments");
    process.exit(1);
  }

  let userId: string | null = null;
  let testUser: { email: string; password: string } = { email: "", password: "" };
  let session: TestSession = { access_token: "", refresh_token: "" };

  if (needsDb) {
    const setupResult = await setup();
    userId = setupResult.userId;
    testUser = setupResult.testUser;
    session = setupResult.session;
  }

  const authedClient = makeAuthedClientFactory(session);

  const start = performance.now();
  try {
    if (PARALLEL) {
      const loadSuites = suitesToRun.filter(isLoadSuite);
      const otherSuites = suitesToRun.filter((d) => !isLoadSuite(d));
      const pgChangesSuites = otherSuites.filter(sharesPgChanges);
      const concurrentSuites = otherSuites.filter((d) => !sharesPgChanges(d));
      await Promise.all([
        ...concurrentSuites.map((d) => runSuite(d, testUser, authedClient)),
        (async () => { for (const d of pgChangesSuites) await runSuite(d, testUser, authedClient); })(),
      ]);
      for (const d of loadSuites) await runSuite(d, testUser, authedClient);
    } else {
      for (const d of suitesToRun) await runSuite(d, testUser, authedClient);
    }
  } finally {
    if (userId) await cleanup(userId);
  }

  printSummary(performance.now() - start);
  await flushOtel();

  if (results.some((r) => !r.passed)) process.exit(1);
}
