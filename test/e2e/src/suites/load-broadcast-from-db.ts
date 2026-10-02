import { RATE_LIMIT_PAUSE_MS, LOAD_MESSAGES, LOAD_SETTLE_MS, LOAD_DELIVERY_SLO } from "../context.ts";
import type { SuiteDescriptor } from "../runner.ts";
import { sleep, randomTopic, settle, measureThroughput, stopClient, openChannel } from "../helpers.ts";

export const loadBroadcastFromDb: SuiteDescriptor = {
  name: "load-broadcast-from-db",
  label: "load-broadcast-from-db",
  needsDb: true,
  run: async ({ authedClient, test }) => {
    await sleep(RATE_LIMIT_PAUSE_MS);
    await test("broadcast from database throughput", async () => {
      const supabase = await authedClient();
      try {
        const testTopic = randomTopic();
        const sendTimes = new Map<string, number>();
        const latencies: number[] = [];

        const channel = supabase
          .channel(testTopic, { config: { private: true } })
          .on("broadcast", { event: "INSERT" }, (res) => {
            const t = sendTimes.get(res.payload.record.id);
            if (t !== undefined) latencies.push(performance.now() - t);
          });

        await openChannel(channel);

        await Promise.all(Array.from({ length: LOAD_MESSAGES }, async () => {
          const id = crypto.randomUUID();
          sendTimes.set(id, performance.now());
          await supabase.from("broadcast_changes").insert({ id, value: crypto.randomUUID(), topic: testTopic });
        }));

        await settle(() => latencies.length, LOAD_MESSAGES, LOAD_SETTLE_MS);

        await supabase.from("broadcast_changes").delete().in("id", [...sendTimes.keys()]);

        return measureThroughput(latencies, LOAD_MESSAGES, "broadcast-from-db events", LOAD_DELIVERY_SLO);
      } finally {
        await stopClient(supabase);
      }
    });
  },
};
