import { BROADCAST_CONFIG, RATE_LIMIT_PAUSE_MS, LOAD_MESSAGES, LOAD_SETTLE_MS, LOAD_DELIVERY_SLO } from "../context.ts";
import type { SuiteDescriptor } from "../runner.ts";
import {
  sleep, randomTopic, settle, measureThroughput, stopClient, openPostgresChannel,
  executeInsert, executeUpdate, executeDelete,
} from "../helpers.ts";

export const loadPostgresChanges: SuiteDescriptor = {
  name: "load-postgres-changes",
  label: "load-postgres-changes",
  needsDb: true,
  run: async ({ authedClient, test }) => {
    await sleep(RATE_LIMIT_PAUSE_MS);
    await test("postgres changes system message latency", async () => {
      const supabase = await authedClient();
      try {
        const channel = supabase
          .channel(randomTopic(), BROADCAST_CONFIG)
          .on("postgres_changes", { event: "INSERT", schema: "public", table: "pg_changes" }, () => {});
        const { systemMs } = await openPostgresChannel(channel);
        return [{ label: "system", value: systemMs, unit: "ms" }];
      } finally {
        await stopClient(supabase);
      }
    });

    await sleep(RATE_LIMIT_PAUSE_MS);
    await test("postgres changes INSERT throughput", async () => {
      const supabase = await authedClient();
      try {
        const sendTimes = new Map<number, number>();
        const latencies: number[] = [];

        const channel = supabase
          .channel(randomTopic(), BROADCAST_CONFIG)
          .on("postgres_changes", { event: "INSERT", schema: "public", table: "pg_changes" }, (p) => {
            const t = sendTimes.get(p.new.id);
            if (t !== undefined) latencies.push(performance.now() - t);
          });

        await openPostgresChannel(channel);

        for (let i = 0; i < LOAD_MESSAGES; i++) {
          const t = performance.now();
          const id = await executeInsert(supabase, "pg_changes");
          sendTimes.set(id, t);
        }

        await settle(() => latencies.length, LOAD_MESSAGES, LOAD_SETTLE_MS);

        return measureThroughput(latencies, LOAD_MESSAGES, "INSERT events", LOAD_DELIVERY_SLO);
      } finally {
        await stopClient(supabase);
      }
    });

    await sleep(RATE_LIMIT_PAUSE_MS);
    await test("postgres changes UPDATE throughput", async () => {
      const supabase = await authedClient();
      try {
        const sendTimes = new Map<number, number>();
        const latencies: number[] = [];

        const channel = supabase
          .channel(randomTopic(), BROADCAST_CONFIG)
          .on("postgres_changes", { event: "UPDATE", schema: "public", table: "pg_changes" }, (p) => {
            const t = sendTimes.get(p.new.id);
            if (t !== undefined) latencies.push(performance.now() - t);
          });

        await openPostgresChannel(channel);

        const ids = await Promise.all(Array.from({ length: LOAD_MESSAGES }, () => executeInsert(supabase, "pg_changes")));

        await Promise.all(ids.map((id) => {
          sendTimes.set(id, performance.now());
          return executeUpdate(supabase, "pg_changes", id);
        }));

        await settle(() => latencies.length, LOAD_MESSAGES, LOAD_SETTLE_MS);

        return measureThroughput(latencies, LOAD_MESSAGES, "UPDATE events", LOAD_DELIVERY_SLO);
      } finally {
        await stopClient(supabase);
      }
    });

    await sleep(RATE_LIMIT_PAUSE_MS);
    await test("postgres changes DELETE throughput", async () => {
      const supabase = await authedClient();
      try {
        const sendTimes = new Map<number, number>();
        const latencies: number[] = [];

        const channel = supabase
          .channel(randomTopic(), BROADCAST_CONFIG)
          .on("postgres_changes", { event: "DELETE", schema: "public", table: "pg_changes" }, (p) => {
            const t = sendTimes.get(p.old.id);
            if (t !== undefined) latencies.push(performance.now() - t);
          });

        await openPostgresChannel(channel);

        const ids = await Promise.all(Array.from({ length: LOAD_MESSAGES }, () => executeInsert(supabase, "pg_changes")));

        await Promise.all(ids.map((id) => {
          sendTimes.set(id, performance.now());
          return executeDelete(supabase, "pg_changes", id);
        }));

        await settle(() => latencies.length, LOAD_MESSAGES, LOAD_SETTLE_MS);

        return measureThroughput(latencies, LOAD_MESSAGES, "DELETE events", LOAD_DELIVERY_SLO);
      } finally {
        await stopClient(supabase);
      }
    });
  },
};
