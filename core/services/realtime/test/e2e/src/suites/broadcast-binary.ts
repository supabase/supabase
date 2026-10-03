import assert from "assert";
import { SQL } from "bun";
import { DB_URL, DB_SSL, RATE_LIMIT_PAUSE_MS } from "../context.ts";
import type { SuiteDescriptor } from "../runner.ts";
import { sleep, randomTopic, waitFor, stopClient, openReplicationChannel, REPLICATION_READY_CONFIG } from "../helpers.ts";

export const broadcastBinary: SuiteDescriptor = {
  name: "broadcast-binary",
  label: "broadcast binary",
  needsDb: true,
  run: async ({ authedClient, test }) => {
    await sleep(RATE_LIMIT_PAUSE_MS);
    await test("send_binary delivers a binary broadcast", async () => {
      const supabase = await authedClient();
      const sql = new SQL(DB_URL, { tls: DB_SSL || undefined });
      try {
        const event = crypto.randomUUID();
        const topic = randomTopic();
        const binary = new Uint8Array([0xde, 0xad, 0xbe, 0xef, 0x00, 0xff]);

        let result: any = null;
        const channel = supabase
          .channel(topic, REPLICATION_READY_CONFIG)
          .on("broadcast", { event }, (msg) => (result = msg.payload));

        const { subscribeMs } = await openReplicationChannel(channel);

        await sql`SELECT realtime.send_binary(${binary}::bytea, ${event}::text, ${topic}::text, true)`;

        const { latencyMs: eventMs } = await waitFor(() => result, "binary broadcast event");

        const received = result instanceof Uint8Array ? result : new Uint8Array(result);
        assert.strictEqual(received.length, binary.length, "binary payload length mismatch");
        assert.ok(binary.every((b, i) => received[i] === b), "binary payload bytes mismatch");
        return [{ label: "subscribe", value: subscribeMs, unit: "ms" }, { label: "event", value: eventMs, unit: "ms" }];
      } finally {
        await sql.close().catch(() => {});
        await stopClient(supabase);
      }
    });
  },
};
