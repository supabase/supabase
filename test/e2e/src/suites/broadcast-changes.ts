import assert from "assert";
import { RATE_LIMIT_PAUSE_MS } from "../context.ts";
import type { SuiteDescriptor } from "../runner.ts";
import { sleep, randomTopic, waitFor, stopClient, openReplicationChannel, REPLICATION_READY_CONFIG } from "../helpers.ts";

export const broadcastChanges: SuiteDescriptor = {
  name: "broadcast-changes",
  label: "broadcast changes",
  needsDb: true,
  run: async ({ authedClient, test }) => {
    await sleep(RATE_LIMIT_PAUSE_MS);
    await test("authenticated user receives INSERT broadcast change", async () => {
      const supabase = await authedClient();
      try {
        const testTopic = randomTopic();
        const id = crypto.randomUUID();
        const value = crypto.randomUUID();
        let result: any = null;

        const channel = supabase
          .channel(testTopic, REPLICATION_READY_CONFIG)
          .on("broadcast", { event: "INSERT" }, (res) => (result = res));

        const { subscribeMs } = await openReplicationChannel(channel);
        await supabase.from("broadcast_changes").insert({ value, id, topic: testTopic });
        const { latencyMs: eventMs } = await waitFor(() => result, "INSERT event");

        assert.strictEqual(result.payload.record.id, id);
        assert.strictEqual(result.payload.record.value, value);
        assert.strictEqual(result.payload.old_record, null);
        assert.strictEqual(result.payload.operation, "INSERT");
        assert.strictEqual(result.payload.schema, "public");
        assert.strictEqual(result.payload.table, "broadcast_changes");
        return [{ label: "subscribe", value: subscribeMs, unit: "ms" }, { label: "event", value: eventMs, unit: "ms" }];
      } finally {
        await stopClient(supabase);
      }
    });

    await sleep(RATE_LIMIT_PAUSE_MS);
    await test("authenticated user receives UPDATE broadcast change", async () => {
      const supabase = await authedClient();
      try {
        const testTopic = randomTopic();
        const id = crypto.randomUUID();
        const originalValue = crypto.randomUUID();
        const updatedValue = crypto.randomUUID();
        let result: any = null;

        const channel = supabase
          .channel(testTopic, REPLICATION_READY_CONFIG)
          .on("broadcast", { event: "UPDATE" }, (res) => (result = res));

        const { subscribeMs } = await openReplicationChannel(channel);
        await supabase.from("broadcast_changes").insert({ value: originalValue, id, topic: testTopic });
        await supabase.from("broadcast_changes").update({ value: updatedValue }).eq("id", id);
        const { latencyMs: eventMs } = await waitFor(() => result, "UPDATE event");

        assert.strictEqual(result.payload.record.id, id);
        assert.strictEqual(result.payload.record.value, updatedValue);
        assert.strictEqual(result.payload.old_record.id, id);
        assert.strictEqual(result.payload.old_record.value, originalValue);
        assert.strictEqual(result.payload.operation, "UPDATE");
        assert.strictEqual(result.payload.schema, "public");
        assert.strictEqual(result.payload.table, "broadcast_changes");
        return [{ label: "subscribe", value: subscribeMs, unit: "ms" }, { label: "event", value: eventMs, unit: "ms" }];
      } finally {
        await stopClient(supabase);
      }
    });

    await sleep(RATE_LIMIT_PAUSE_MS);
    await test("authenticated user receives DELETE broadcast change", async () => {
      const supabase = await authedClient();
      try {
        const testTopic = randomTopic();
        const id = crypto.randomUUID();
        const value = crypto.randomUUID();
        let result: any = null;

        const channel = supabase
          .channel(testTopic, REPLICATION_READY_CONFIG)
          .on("broadcast", { event: "DELETE" }, (res) => (result = res));

        const { subscribeMs } = await openReplicationChannel(channel);
        await supabase.from("broadcast_changes").insert({ value, id, topic: testTopic });
        await supabase.from("broadcast_changes").delete().eq("id", id);
        const { latencyMs: eventMs } = await waitFor(() => result, "DELETE event");

        assert.strictEqual(result.payload.record, null);
        assert.strictEqual(result.payload.old_record.id, id);
        assert.strictEqual(result.payload.old_record.value, value);
        assert.strictEqual(result.payload.operation, "DELETE");
        assert.strictEqual(result.payload.schema, "public");
        assert.strictEqual(result.payload.table, "broadcast_changes");
        return [{ label: "subscribe", value: subscribeMs, unit: "ms" }, { label: "event", value: eventMs, unit: "ms" }];
      } finally {
        await stopClient(supabase);
      }
    });
  },
};
