import { Command, Option } from "commander";

const DEFAULT_RATE_LIMIT_WAIT_MS = 2000;

const program = new Command()
  .name("realtime-check")
  .description("End-to-end Realtime test suite against any Supabase project")
  .option("--project <ref>", "Supabase project ref (required for staging/prod)")
  .option("--publishable-key <key>", "Project publishable (anon) key")
  .option("--secret-key <key>", "Project secret (service role) key")
  .option("--db-password <password>", "Database password (required for staging/prod)")
  .option("--env <env>", "Environment: local | staging | development | prod | production (default: prod)", "prod")
  .option("--domain <domain>", "Email domain for the test user", "example.com")
  .option("--port <port>", "Override URL port (useful for local)")
  .option("--url <url>", "Override project URL (e.g. http://127.0.0.1:54321)")
  .option("--db-url <url>", "Override database URL (e.g. postgresql://postgres:postgres@127.0.0.1:54322/postgres)")
  .option("--json", "Output results as JSON to stdout")
  .option("--otel <endpoint>", "OTLP HTTP endpoint for tracing (e.g. http://localhost:4318)")
  .option("--otel-token <token>", "Bearer token for authenticated OTLP endpoints")
  .option("--test <categories>", "Comma-separated list of test categories to run: functional,load,connection,load-postgres-changes,load-presence,load-broadcast,load-broadcast-from-db,load-broadcast-replay,broadcast,broadcast-replay,presence,authorization,postgres-changes,postgres-changes-filters,broadcast-changes,broadcast-binary")
  .option("--debug", "Enable Realtime client debug mode (sets log level to info and enables console logging)")
  .addOption(new Option("--wait-time <wait>", "Time to wait between tests to avoid rate limits in milliseconds").default(DEFAULT_RATE_LIMIT_WAIT_MS, `${DEFAULT_RATE_LIMIT_WAIT_MS / 1000} seconds`))
  .option("--parallel", "Run suites concurrently instead of sequentially")
  .parse();

const opts = program.opts();
export const ANON_KEY: string = opts.publishableKey;
export const SERVICE_KEY: string = opts.secretKey;
export const dbPassword: string = opts.dbPassword ?? "";
const { project, domain: EMAIL_DOMAIN, port, json: JSON_OUTPUT, test: TEST_FILTER, otel: OTEL_ARG, otelToken: OTEL_API_TOKEN, url: URL_ARG, dbUrl: DB_URL_ARG, debug: DEBUG, waitTime: WAIT_TIME_ARG, parallel: PARALLEL } = opts;
export { EMAIL_DOMAIN, JSON_OUTPUT, OTEL_API_TOKEN, DB_URL_ARG, PARALLEL };
export const env: string = opts.env === "production" ? "prod" : opts.env === "development" ? "staging" : opts.env;

export const TEST_CATEGORIES = TEST_FILTER
  ? TEST_FILTER.split(",").map((s: string) => s.trim().toLowerCase())
  : null;

if (env !== "local" && !project && !(URL_ARG && DB_URL_ARG)) {
  console.error("--project is required (or provide both --url and --db-url)");
  process.exit(1);
}
if (!ANON_KEY) {
  console.error("--publishable-key is required");
  process.exit(1);
}

export const PROJECT_URL = URL_ARG ?? (() => {
  if (env === "local") return `http://localhost:${port ?? 54321}`;
  if (env === "staging") return `https://${project}.supabase.red`;
  return `https://${project}.supabase.co`;
})();

export const DB_URL = DB_URL_ARG ?? (() => {
  const pw = encodeURIComponent(dbPassword ?? "postgres");
  if (env === "local") return `postgresql://postgres:${pw}@localhost:${port ?? 54322}/postgres`;
  if (env === "staging") return `postgresql://postgres:${pw}@db.${project}.supabase.red:5432/postgres`;
  return `postgresql://postgres:${pw}@db.${project}.supabase.co:5432/postgres`;
})();

export const DB_SSL = env !== "local" ? { rejectUnauthorized: false } : false;

const realtimeLogger = DEBUG
  ? (kind: string, msg: string, data?: any) => {
      if (data !== undefined) console.error(`[realtime] ${kind}: ${msg}`, data);
      else console.error(`[realtime] ${kind}: ${msg}`);
    }
  : undefined;

export const REALTIME_OPTS = { ...(DEBUG ? { logger: realtimeLogger, logLevel: "info" } : {}) };
export const BROADCAST_CONFIG = { config: { broadcast: { self: true } } };
// `wait: true` holds the server's SUBSCRIBED ack until it confirms the postgres_changes
// subscription is actually active, instead of the default fire-and-forget ack that can race
// the tenant's replication poller/slot coming up after a cold start.
export const POSTGRES_CHANGES_CONFIG = {
  config: { broadcast: { self: true }, postgres_changes_options: { wait: true } },
};
export const EVENT_TIMEOUT_MS = 8000;
export const RATE_LIMIT_PAUSE_MS = WAIT_TIME_ARG;
export const BROADCAST_API_HEADERS = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${ANON_KEY}`,
  "apikey": ANON_KEY,
};
export const LOAD_MESSAGES = 20;
export const LOAD_SETTLE_MS = 5000;
export const LOAD_DELIVERY_SLO = 99;

export const OTEL_ENDPOINT = OTEL_ARG;
