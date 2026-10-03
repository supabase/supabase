import assert from "assert";
import { createClient, postgresChangesFilter, type SupabaseClient } from "@supabase/supabase-js";
import kleur from "kleur";
import { trace, context, SpanStatusCode, SpanKind } from "@opentelemetry/api";
import { EVENT_TIMEOUT_MS, PROJECT_URL, ANON_KEY, REALTIME_OPTS } from "./context.ts";
import type { Metric } from "./runner.ts";
import { tracer, log } from "./runner.ts";

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
export const randomTopic = () => "topic:" + crypto.randomUUID();
export const settle = async (getCount: () => number, expected: number, timeoutMs: number) => {
  const deadline = performance.now() + timeoutMs;
  while (getCount() < expected && performance.now() < deadline) await sleep(50);
};

export function measureThroughput(latencies: number[], total: number, label: string, slo: number): Metric[] {
  const delivered = latencies.length;
  const deliveryRate = (delivered / total) * 100;
  const sorted = latencies.slice().sort((a, b) => a - b);
  if (delivered < total) log(`    ${kleur.yellow(`lost ${total - delivered}/${total} ${label}`)}`);
  assert(deliveryRate >= slo, `Delivery rate ${deliveryRate.toFixed(1)}% below ${slo}% SLO`);
  return [
    { label: "delivered", value: deliveryRate, unit: "%" },
    { label: "p50", value: sorted[Math.ceil(sorted.length * 0.5) - 1] ?? 0, unit: "ms" },
    { label: "p95", value: sorted[Math.ceil(sorted.length * 0.95) - 1] ?? 0, unit: "ms" },
    { label: "p99", value: sorted[Math.ceil(sorted.length * 0.99) - 1] ?? 0, unit: "ms" },
  ];
}

export async function waitFor<T>(getter: () => T | null, label: string): Promise<{ value: T; latencyMs: number }> {
  const span = tracer.startSpan(`wait: ${label}`, { kind: SpanKind.INTERNAL });
  const start = performance.now();
  const deadline = start + EVENT_TIMEOUT_MS;
  let value: T | null;
  return context.with(trace.setSpan(context.active(), span), async () => {
    while ((value = getter()) === null && performance.now() < deadline) await sleep(50);
    const latencyMs = performance.now() - start;
    if (value === null) {
      const msg = `Timed out waiting for ${label} (${latencyMs.toFixed(0)}ms)`;
      span.setStatus({ code: SpanStatusCode.ERROR, message: msg });
      span.end();
      throw new Error(msg);
    }
    span.setAttribute("latency_ms", latencyMs);
    span.setStatus({ code: SpanStatusCode.OK });
    span.end();
    return { value, latencyMs };
  });
}

export async function stopClient(supabase: SupabaseClient) {
  await Promise.all([supabase.removeAllChannels(), supabase.auth.stopAutoRefresh()]);
}

export type TestSession = { access_token: string; refresh_token: string };
export type AuthedClientFactory = () => Promise<SupabaseClient>;

// Builds the one function each suite needs to get a signed-in client: it hides both the
// client construction (URL/key/realtime opts) and the session-restore mechanics behind a
// single call, so suites don't need to know how auth works at all. The session itself is
// obtained once during setup (see fixtures.ts) and reused here via setSession().
export function makeAuthedClientFactory(session: TestSession): AuthedClientFactory {
  return async () => {
    const supabase = createClient(PROJECT_URL, ANON_KEY, { realtime: REALTIME_OPTS });
    const span = tracer.startSpan("restore session", { kind: SpanKind.INTERNAL });
    return context.with(trace.setSpan(context.active(), span), async () => {
      const { error } = await supabase.auth.setSession(session);
      if (error) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        span.end();
        throw new Error(`Error restoring session: ${error.message}`);
      }
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
      return supabase;
    });
  };
}

async function waitForSubscribed(channel: ReturnType<SupabaseClient["channel"]>): Promise<number> {
  const span = tracer.startSpan("wait: subscribe", { kind: SpanKind.INTERNAL });
  const start = performance.now();
  const deadline = start + EVENT_TIMEOUT_MS;
  return context.with(trace.setSpan(context.active(), span), async () => {
    while (channel.state === "joining" && performance.now() < deadline) await sleep(50);
    const latencyMs = performance.now() - start;
    if (channel.state !== "joined") {
      const msg = `Channel failed to subscribe (topic: ${channel.topic}, state: ${channel.state}, elapsed: ${latencyMs.toFixed(0)}ms)`;
      span.setStatus({ code: SpanStatusCode.ERROR, message: msg });
      span.end();
      throw new Error(msg);
    }
    span.setAttribute("latency_ms", latencyMs);
    span.setStatus({ code: SpanStatusCode.OK });
    span.end();
    return latencyMs;
  });
}

// Subscribes a channel and waits until it is fully joined.
// All data operations must happen after this returns to avoid delivery races.
export async function openChannel(channel: ReturnType<SupabaseClient["channel"]>): Promise<number> {
  channel.subscribe();
  return waitForSubscribed(channel);
}

// Subscribes a postgres_changes channel and waits for both the join and the
// system:ok confirmation that the server-side WAL subscription is active.
export async function openPostgresChannel(channel: ReturnType<SupabaseClient["channel"]>): Promise<{ subscribeMs: number; systemMs: number }> {
  const start = performance.now();
  let systemOk = false;
  channel.on("system", "*", ({ status }: { status: string }) => { if (status === "ok") systemOk = true; });
  const subscribeMs = await openChannel(channel);
  const { latencyMs: systemMs } = await waitFor(() => systemOk ? true : null, "system ok");
  return { subscribeMs, systemMs: performance.now() - start };
}

// Channel config that opts in to the "Replication connection established" system
// message, used by broadcast-from-database tests to avoid sleeping while the
// tenant replication connection comes up.
export const REPLICATION_READY_CONFIG = { config: { private: true, broadcast: { replication_ready: true } } } as any;

// Subscribes a private broadcast-from-database channel and waits for both the join
// and the server's replication-ready system message, so inserts that rely on the
// replication connection are not raced.
export async function openReplicationChannel(channel: ReturnType<SupabaseClient["channel"]>): Promise<{ subscribeMs: number; replicationMs: number }> {
  const start = performance.now();
  let replicationReady = false;
  channel.on("system", "*", ({ extension, status }: { extension?: string; status?: string }) => {
    if (extension === "system" && status === "ok") replicationReady = true;
  });
  const subscribeMs = await openChannel(channel);
  await waitFor(() => replicationReady ? true : null, "replication ready");
  return { subscribeMs, replicationMs: performance.now() - start };
}

// Opt-in isolation for pg_changes tests whose filter matches most rows in the table
// (e.g. neq against a value nobody else inserts, or is-null against a column nobody
// else sets) — under --parallel those filters otherwise pick up every other
// concurrently-running test's inserts too, which can push wait time past the event
// timeout. Pass the test's own tag to both `row()` (on every insert) and `scope()`
// (ANDed into the filter under test) so the channel only ever sees its own rows.
// Tests whose filter is already narrow (scoped to a random tag) don't need this.
export function isolated(tag: string) {
  return {
    scope: () => postgresChangesFilter().eq("run_id", tag),
    row: (row: Record<string, unknown> = {}) => ({ ...row, run_id: tag }),
  };
}

type TableName = "pg_changes" | "dummy" | "authorization" | "broadcast_changes" | "wallet" | "replay_check";

export async function executeInsert(supabase: SupabaseClient, table: TableName, value?: string): Promise<number> {
  const { data, error } = await supabase.from(table).insert([{ value: value ?? crypto.randomUUID() }]).select("id");
  if (error) throw new Error(`Error inserting into ${table}: ${error.message}`);
  return (data as { id: number }[])[0].id;
}

export async function executeUpdate(supabase: SupabaseClient, table: TableName, id: number) {
  const { error } = await supabase.from(table).update({ value: crypto.randomUUID() }).eq("id", id);
  if (error) throw new Error(`Error updating ${table}: ${error.message}`);
}

export async function executeDelete(supabase: SupabaseClient, table: TableName, id: number) {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw new Error(`Error deleting from ${table}: ${error.message}`);
}
