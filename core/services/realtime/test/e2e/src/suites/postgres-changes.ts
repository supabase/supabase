import assert from "assert";
import { POSTGRES_CHANGES_CONFIG, RATE_LIMIT_PAUSE_MS } from "../context.ts";
import type { SuiteDescriptor } from "../runner.ts";
import {
  sleep, randomTopic, waitFor, stopClient, openPostgresChannel,
  executeInsert, executeUpdate, executeDelete,
} from "../helpers.ts";

export const postgresChanges: SuiteDescriptor = {
  name: "postgres-changes",
  label: "postgres changes extension",
  needsDb: true,
  runCasesInParallel: true,
  run: async ({ authedClient, test }) => {
    await sleep(RATE_LIMIT_PAUSE_MS);
    await test("user receives INSERT events with filter", async () => {
      const supabase = await authedClient();
      try {

        let result: unknown = null;
        const uniqueValue = crypto.randomUUID();

        const channel = supabase
          .channel(randomTopic(), POSTGRES_CHANGES_CONFIG)
          .on("postgres_changes",
            { event: "INSERT", schema: "public", table: "pg_changes", filter: `value=eq.${uniqueValue}` },
            (payload) => (result = payload));

        const { subscribeMs } = await openPostgresChannel(channel);
        await executeInsert(supabase, "pg_changes", uniqueValue);
        await executeInsert(supabase, "dummy");
        const { latencyMs: eventMs } = await waitFor(() => result, "INSERT event");

        assert.strictEqual(result.eventType, "INSERT");
        assert.strictEqual(result.new.value, uniqueValue);
        return [{ label: "subscribe", value: subscribeMs, unit: "ms" }, { label: "event", value: eventMs, unit: "ms" }];
      } finally {
        await stopClient(supabase);
      }
    });

    await sleep(RATE_LIMIT_PAUSE_MS);
    await test("user receives UPDATE events with filter", async () => {
      const supabase = await authedClient();
      try {

        let result: unknown = null;
        const mainId = await executeInsert(supabase, "pg_changes");
        const fakeId = await executeInsert(supabase, "pg_changes");
        const dummyId = await executeInsert(supabase, "dummy");

        const channel = supabase
          .channel(randomTopic(), POSTGRES_CHANGES_CONFIG)
          .on("postgres_changes",
            { event: "UPDATE", schema: "public", table: "pg_changes", filter: `id=eq.${mainId}` },
            (payload) => (result = payload));

        const { subscribeMs } = await openPostgresChannel(channel);
        await Promise.all([
          executeUpdate(supabase, "pg_changes", mainId),
          executeUpdate(supabase, "pg_changes", fakeId),
          executeUpdate(supabase, "dummy", dummyId),
        ]);
        const { latencyMs: eventMs } = await waitFor(() => result, "UPDATE event");

        assert.strictEqual(result.eventType, "UPDATE");
        assert.strictEqual(result.new.id, mainId);
        return [{ label: "subscribe", value: subscribeMs, unit: "ms" }, { label: "event", value: eventMs, unit: "ms" }];
      } finally {
        await stopClient(supabase);
      }
    });

    await sleep(RATE_LIMIT_PAUSE_MS);
    await test("user receives DELETE events with filter", async () => {
      const supabase = await authedClient();
      try {

        let result: unknown = null;
        const mainId = await executeInsert(supabase, "pg_changes");
        const fakeId = await executeInsert(supabase, "pg_changes");
        const dummyId = await executeInsert(supabase, "dummy");

        const channel = supabase
          .channel(randomTopic(), POSTGRES_CHANGES_CONFIG)
          .on("postgres_changes",
            { event: "DELETE", schema: "public", table: "pg_changes", filter: `id=eq.${mainId}` },
            (payload) => (result = payload));

        const { subscribeMs } = await openPostgresChannel(channel);
        await Promise.all([
          executeDelete(supabase, "pg_changes", mainId),
          executeDelete(supabase, "pg_changes", fakeId),
          executeDelete(supabase, "dummy", dummyId),
        ]);
        const { latencyMs: eventMs } = await waitFor(() => result, "DELETE event");

        assert.strictEqual(result.eventType, "DELETE");
        assert.strictEqual(result.old.id, mainId);
        return [{ label: "subscribe", value: subscribeMs, unit: "ms" }, { label: "event", value: eventMs, unit: "ms" }];
      } finally {
        await stopClient(supabase);
      }
    });

    await sleep(RATE_LIMIT_PAUSE_MS);
    await test("user receives INSERT, UPDATE and DELETE concurrently", async () => {
      const supabase = await authedClient();
      try {
        let insertResult: unknown = null, updateResult: unknown = null, deleteResult: unknown = null;

        const insertValue = crypto.randomUUID();
        const updateId = await executeInsert(supabase, "pg_changes");
        const deleteId = await executeInsert(supabase, "pg_changes");

        const channel = supabase
          .channel(randomTopic(), POSTGRES_CHANGES_CONFIG)
          .on("postgres_changes", { event: "INSERT", schema: "public", table: "pg_changes", filter: `value=eq.${insertValue}` }, (p) => (insertResult = p))
          .on("postgres_changes", { event: "UPDATE", schema: "public", table: "pg_changes", filter: `id=eq.${updateId}` }, (p) => (updateResult = p))
          .on("postgres_changes", { event: "DELETE", schema: "public", table: "pg_changes", filter: `id=eq.${deleteId}` }, (p) => (deleteResult = p));

        const { subscribeMs } = await openPostgresChannel(channel);

        await Promise.all([
          executeInsert(supabase, "pg_changes", insertValue),
          executeUpdate(supabase, "pg_changes", updateId),
          executeDelete(supabase, "pg_changes", deleteId),
        ]);

        const [{ latencyMs: insertMs }, { latencyMs: updateMs }, { latencyMs: deleteMs }] = await Promise.all([
          waitFor(() => insertResult, "INSERT event"),
          waitFor(() => updateResult, "UPDATE event"),
          waitFor(() => deleteResult, "DELETE event"),
        ]);

        assert.strictEqual(insertResult.eventType, "INSERT");
        assert.strictEqual(updateResult.eventType, "UPDATE");
        assert.strictEqual(deleteResult.eventType, "DELETE");
        return [
          { label: "subscribe", value: subscribeMs, unit: "ms" },
          { label: "INSERT", value: insertMs, unit: "ms" },
          { label: "UPDATE", value: updateMs, unit: "ms" },
          { label: "DELETE", value: deleteMs, unit: "ms" },
        ];
      } finally {
        await stopClient(supabase);
      }
    });

    await sleep(RATE_LIMIT_PAUSE_MS);
    await test("select — omitting select returns full payload (backward compatible)", async () => {
      const supabase = await authedClient();
      try {
        let result: any = null;
        const uniqueValue = crypto.randomUUID();
        const details = crypto.randomUUID();

        const channel = supabase
          .channel(randomTopic(), POSTGRES_CHANGES_CONFIG)
          .on("postgres_changes",
            { event: "INSERT", schema: "public", table: "pg_changes", filter: `value=eq.${uniqueValue}` },
            (payload) => (result = payload));

        const { subscribeMs } = await openPostgresChannel(channel);
        await supabase.from("pg_changes").insert({ value: uniqueValue, details });
        const { latencyMs: eventMs } = await waitFor(() => result, "INSERT event");

        assert.strictEqual(result.eventType, "INSERT");
        assert.ok(result.new.id !== undefined, "id must be present");
        assert.strictEqual(result.new.value, uniqueValue, "value must be present when no select is used");
        assert.strictEqual(result.new.details, details, "details must be present when no select is used");
        return [{ label: "subscribe", value: subscribeMs, unit: "ms" }, { label: "event", value: eventMs, unit: "ms" }];
      } finally {
        await stopClient(supabase);
      }
    });
  },
};
