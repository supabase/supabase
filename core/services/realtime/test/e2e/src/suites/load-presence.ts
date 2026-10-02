import { createClient } from "@supabase/supabase-js";
import { PROJECT_URL, ANON_KEY, REALTIME_OPTS, RATE_LIMIT_PAUSE_MS, LOAD_SETTLE_MS, LOAD_DELIVERY_SLO } from "../context.ts";
import type { SuiteDescriptor } from "../runner.ts";
import { sleep, randomTopic, settle, measureThroughput, stopClient, openChannel } from "../helpers.ts";

export const loadPresence: SuiteDescriptor = {
  name: "load-presence",
  label: "load-presence",
  needsDb: false,
  run: async ({ test }) => {
    await sleep(RATE_LIMIT_PAUSE_MS);
    await test("presence join throughput", async () => {
      const CLIENTS = 10;
      const observer = createClient(PROJECT_URL, ANON_KEY, { realtime: REALTIME_OPTS });
      const senders: ReturnType<typeof createClient>[] = [];
      try {
        const topic = randomTopic();
        const trackTimes = new Map<string, number>();
        const latencies: number[] = [];

        const observerChannel = observer
          .channel(topic, { config: { broadcast: { self: true }, presence: { key: "observer" } } })
          .on("presence", { event: "join" }, (e) => {
            if (e.key === "observer") return;
            const t = trackTimes.get(e.key);
            if (t !== undefined) latencies.push(performance.now() - t);
          });
        await openChannel(observerChannel);

        const clients = Array.from({ length: CLIENTS }, (_, i) => ({
          client: createClient(PROJECT_URL, ANON_KEY, { realtime: REALTIME_OPTS }),
          key: `client-${i}`,
        }));
        senders.push(...clients.map((c) => c.client));

        const channels = await Promise.all(clients.map(async ({ client, key }) => {
          const ch = client.channel(topic, { config: { presence: { key } } });
          await openChannel(ch);
          return { ch, key };
        }));

        await Promise.all(channels.map(({ ch, key }) => {
          trackTimes.set(key, performance.now());
          return ch.track({ key });
        }));

        await settle(() => latencies.length, CLIENTS, LOAD_SETTLE_MS);

        return measureThroughput(latencies, CLIENTS, "presence joins", LOAD_DELIVERY_SLO);
      } finally {
        await Promise.all(senders.map((c) => stopClient(c)));
        await stopClient(observer);
      }
    });
  },
};
