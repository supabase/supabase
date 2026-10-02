import { createClient } from "@supabase/supabase-js";
import { PROJECT_URL, ANON_KEY, REALTIME_OPTS, BROADCAST_CONFIG } from "../context.ts";
import type { SuiteDescriptor } from "../runner.ts";
import { randomTopic, settle, measureThroughput, stopClient, openChannel } from "../helpers.ts";

export const connection: SuiteDescriptor = {
  name: "connection",
  label: "connection",
  needsDb: false,
  run: async ({ test }) => {
    await test("first connect latency", async () => {
      const supabase = createClient(PROJECT_URL, ANON_KEY, { realtime: REALTIME_OPTS });
      try {
        const channel = supabase.channel(randomTopic());
        const connectMs = await openChannel(channel);
        return [{ label: "connect", value: connectMs, unit: "ms" }];
      } finally {
        await stopClient(supabase);
      }
    });

    await test("broadcast message throughput", async () => {
      const MESSAGES = 50;
      const SETTLE_MS = 3000;
      const DELIVERY_SLO = 99;
      const supabase = createClient(PROJECT_URL, ANON_KEY, { realtime: REALTIME_OPTS });
      try {
        const topic = randomTopic();
        const event = "load";
        const sendTimes = new Map<number, number>();
        const latencies: number[] = [];

        const channel = supabase
          .channel(topic, BROADCAST_CONFIG)
          .on("broadcast", { event }, ({ payload }) => {
            const t = sendTimes.get(payload.seq);
            if (t !== undefined) latencies.push(performance.now() - t);
          });

        await openChannel(channel);

        for (let i = 0; i < MESSAGES; i++) {
          sendTimes.set(i, performance.now());
          await channel.send({ type: "broadcast", event, payload: { seq: i } });
        }

        await settle(() => latencies.length, MESSAGES, SETTLE_MS);

        return measureThroughput(latencies, MESSAGES, "messages", DELIVERY_SLO);
      } finally {
        await stopClient(supabase);
      }
    });
  },
};
