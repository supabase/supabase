import assert from "assert";
import { createClient } from "@supabase/supabase-js";
import { PROJECT_URL, ANON_KEY, REALTIME_OPTS, BROADCAST_CONFIG, BROADCAST_API_HEADERS } from "../context.ts";
import type { SuiteDescriptor } from "../runner.ts";
import { sleep, randomTopic, waitFor, stopClient, openChannel } from "../helpers.ts";

export const broadcast: SuiteDescriptor = {
  name: "broadcast",
  label: "broadcast extension",
  needsDb: false,
  run: async ({ test }) => {
    await test("user is able to receive self broadcast", async () => {
      const supabase = createClient(PROJECT_URL, ANON_KEY, { realtime: REALTIME_OPTS });
      try {
        let result: any = null;
        const event = crypto.randomUUID();
        const topic = randomTopic();
        const expectedPayload = { message: crypto.randomUUID() };

        const channel = supabase
          .channel(topic, BROADCAST_CONFIG)
          .on("broadcast", { event }, ({ payload }) => (result = payload));

        const subscribeMs = await openChannel(channel);
        await channel.send({ type: "broadcast", event, payload: expectedPayload });
        const { latencyMs: eventMs } = await waitFor(() => result, "broadcast event");

        assert.deepStrictEqual(result, expectedPayload);
        return [{ label: "subscribe", value: subscribeMs, unit: "ms" }, { label: "event", value: eventMs, unit: "ms" }];
      } finally {
        await stopClient(supabase);
      }
    });

    await test("user is able to use the endpoint to broadcast", async () => {
      const supabase = createClient(PROJECT_URL, ANON_KEY, { realtime: REALTIME_OPTS });
      try {
        let result: any = null;
        const event = crypto.randomUUID();
        const topic = randomTopic();
        const expectedPayload = { message: crypto.randomUUID() };

        const channel = supabase
          .channel(topic, BROADCAST_CONFIG)
          .on("broadcast", { event }, ({ payload }) => (result = payload));

        const subscribeMs = await openChannel(channel);
        // Small settle window so server-side subscription routing is ready before the HTTP broadcast arrives.
        await sleep(100);

        const res = await fetch(`${PROJECT_URL}/realtime/v1/api/broadcast`, {
          method: "POST",
          headers: BROADCAST_API_HEADERS,
          body: JSON.stringify({ messages: [{ topic, event, payload: expectedPayload }] }),
        });
        if (!res.ok) throw new Error(`Broadcast API returned ${res.status}`);

        const { latencyMs: eventMs } = await waitFor(() => result, "broadcast event");
        assert.deepStrictEqual(result, expectedPayload);
        return [{ label: "subscribe", value: subscribeMs, unit: "ms" }, { label: "event", value: eventMs, unit: "ms" }];
      } finally {
        await stopClient(supabase);
      }
    });
  },
};
