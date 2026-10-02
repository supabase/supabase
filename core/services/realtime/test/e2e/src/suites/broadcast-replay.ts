import assert from "assert";
import { SQL } from "bun";
import { DB_URL, DB_SSL } from "../context.ts";
import type { SuiteDescriptor } from "../runner.ts";
import { sleep, randomTopic, waitFor, stopClient, openChannel } from "../helpers.ts";

export const broadcastReplay: SuiteDescriptor = {
  name: "broadcast-replay",
  label: "broadcast replay",
  needsDb: true,
  run: async ({ authedClient, test }) => {
    await test("replayed messages are delivered on join", async () => {
      const supabase = await authedClient();
      try {
        const event = crypto.randomUUID();
        const topic = randomTopic();
        const payload = { message: crypto.randomUUID() };

        const since = Date.now() - 1000;
        await supabase.from("replay_check").insert({ id: crypto.randomUUID(), topic, event, payload });

        await sleep(500);

        let result: any = null;
        const receiver = supabase.channel(topic, {
          config: { private: true, broadcast: { replay: { since, limit: 1 } } },
        }).on("broadcast", { event }, (msg) => (result = msg.payload));
        const subscribeMs = await openChannel(receiver);

        const { latencyMs: replayMs } = await waitFor(() => result, "replayed broadcast event");

        assert.strictEqual(result.message, payload.message);
        return [{ label: "subscribe", value: subscribeMs, unit: "ms" }, { label: "replay", value: replayMs, unit: "ms" }];
      } finally {
        await stopClient(supabase);
      }
    });

    await test("replayed binary messages are delivered on join", async () => {
      const supabase = await authedClient();
      const sql = new SQL(DB_URL, { tls: DB_SSL || undefined });
      try {
        const event = crypto.randomUUID();
        const topic = randomTopic();
        const binary = new Uint8Array([0xde, 0xad, 0xbe, 0xef, 0x00, 0xff]);
        let result: any = null;
        let receivedMeta: any = null;

        const since = Date.now() - 1000;
        await sql`INSERT INTO public.replay_check (id, topic, event, binary_payload)
                  VALUES (${crypto.randomUUID()}, ${topic}, ${event}, ${binary}::bytea)`;

        await sleep(500);

        const receiver = supabase.channel(topic, {
          config: { private: true, broadcast: { replay: { since, limit: 1 } } },
        }).on("broadcast", { event }, (msg) => {
          result = msg.payload;
          receivedMeta = msg.meta;
        });
        const subscribeMs = await openChannel(receiver);

        const { latencyMs: replayMs } = await waitFor(() => result, "replayed binary broadcast event");

        const received = result instanceof Uint8Array ? result : new Uint8Array(result);
        assert.strictEqual(received.length, binary.length, "binary payload length mismatch");
        assert.ok(binary.every((b, i) => received[i] === b), "binary payload bytes mismatch");
        assert.strictEqual(receivedMeta?.replayed, true, "expected meta.replayed on replayed binary message");
        return [{ label: "subscribe", value: subscribeMs, unit: "ms" }, { label: "replay", value: replayMs, unit: "ms" }];
      } finally {
        await sql.close().catch(() => {});
        await stopClient(supabase);
      }
    });

    await test("replayed messages carry meta.replayed flag", async () => {
      const supabase = await authedClient();
      try {
        const event = crypto.randomUUID();
        const topic = randomTopic();

        const since = Date.now() - 1000;
        await supabase.from("replay_check").insert({ id: crypto.randomUUID(), topic, event, payload: { value: 1 } });

        await sleep(500);

        let receivedMeta: any = null;
        const receiver = supabase.channel(topic, {
          config: { private: true, broadcast: { replay: { since, limit: 1 } } },
        }).on("broadcast", { event }, (msg) => (receivedMeta = msg.meta));
        await openChannel(receiver);

        await waitFor(() => receivedMeta, "replayed broadcast meta");

        assert.strictEqual(receivedMeta?.replayed, true);
        return [];
      } finally {
        await stopClient(supabase);
      }
    });

    await test("messages before since are not replayed", async () => {
      const supabase = await authedClient();
      try {
        const event = crypto.randomUUID();
        const topic = randomTopic();

        await supabase.from("replay_check").insert({ id: crypto.randomUUID(), topic, event, payload: { value: "old" } });

        // Sleep to ensure the DB insert timestamp is clearly before `since`,
        // guarding against clock skew between JS client and DB server.
        await sleep(1000);
        const since = Date.now();

        let result: any = null;
        const receiver = supabase.channel(topic, {
          config: { private: true, broadcast: { replay: { since, limit: 25 } } },
        }).on("broadcast", { event }, (msg) => (result = msg.payload));
        await openChannel(receiver);

        await sleep(500);

        assert.strictEqual(result, null);
        return [];
      } finally {
        await stopClient(supabase);
      }
    });
  },
};
