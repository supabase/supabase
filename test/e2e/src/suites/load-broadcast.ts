import { createClient } from "@supabase/supabase-js";
import { PROJECT_URL, ANON_KEY, REALTIME_OPTS, BROADCAST_CONFIG, BROADCAST_API_HEADERS, RATE_LIMIT_PAUSE_MS, LOAD_MESSAGES, LOAD_SETTLE_MS, LOAD_DELIVERY_SLO } from "../context.ts";
import type { SuiteDescriptor } from "../runner.ts";
import { sleep, randomTopic, settle, measureThroughput, stopClient, openChannel } from "../helpers.ts";

export const loadBroadcast: SuiteDescriptor = {
  name: "load-broadcast",
  label: "load-broadcast",
  needsDb: false,
  run: async ({ test }) => {
    await sleep(RATE_LIMIT_PAUSE_MS);
    await test("broadcast self throughput", async () => {
      const supabase = createClient(PROJECT_URL, ANON_KEY, { realtime: REALTIME_OPTS });
      try {
        const event = "load";
        const topic = randomTopic();
        const sendTimes = new Map<number, number>();
        const latencies: number[] = [];

        const channel = supabase
          .channel(topic, BROADCAST_CONFIG)
          .on("broadcast", { event }, ({ payload }) => {
            const t = sendTimes.get(payload.seq);
            if (t !== undefined) latencies.push(performance.now() - t);
          });

        await openChannel(channel);

        for (let i = 0; i < LOAD_MESSAGES; i++) {
          sendTimes.set(i, performance.now());
          await channel.send({ type: "broadcast", event, payload: { seq: i } });
        }

        await settle(() => latencies.length, LOAD_MESSAGES, LOAD_SETTLE_MS);

        return measureThroughput(latencies, LOAD_MESSAGES, "broadcast events", LOAD_DELIVERY_SLO);
      } finally {
        await stopClient(supabase);
      }
    });

    await sleep(RATE_LIMIT_PAUSE_MS);
    await test("broadcast API endpoint throughput", async () => {
      const supabase = createClient(PROJECT_URL, ANON_KEY, { realtime: REALTIME_OPTS });
      try {
        const event = "load";
        const topic = randomTopic();
        const sendTimes = new Map<number, number>();
        const latencies: number[] = [];

        const channel = supabase
          .channel(topic, BROADCAST_CONFIG)
          .on("broadcast", { event }, ({ payload }) => {
            const t = sendTimes.get(payload.seq);
            if (t !== undefined) latencies.push(performance.now() - t);
          });

        await openChannel(channel);

        await Promise.all(Array.from({ length: LOAD_MESSAGES }, async (_, i) => {
          sendTimes.set(i, performance.now());
          const res = await fetch(`${PROJECT_URL}/realtime/v1/api/broadcast`, {
            method: "POST",
            headers: BROADCAST_API_HEADERS,
            body: JSON.stringify({ messages: [{ topic, event, payload: { seq: i } }] }),
          });
          if (!res.ok) throw new Error(`Broadcast API returned ${res.status}`);
        }));

        await settle(() => latencies.length, LOAD_MESSAGES, LOAD_SETTLE_MS);

        return measureThroughput(latencies, LOAD_MESSAGES, "broadcast API events", LOAD_DELIVERY_SLO);
      } finally {
        await stopClient(supabase);
      }
    });
  },
};
