import assert from "assert";
import { RATE_LIMIT_PAUSE_MS } from "../context.ts";
import type { SuiteDescriptor } from "../runner.ts";
import { sleep, randomTopic, waitFor, stopClient, openChannel } from "../helpers.ts";

export const authorization: SuiteDescriptor = {
  name: "authorization",
  label: "authorization check",
  needsDb: true,
  runCasesInParallel: true,
  run: async ({ authedClient, test }) => {
    await test("user using private channel cannot connect without permissions", async () => {
      const supabase = await authedClient();
      try {
        const topic = "restricted:" + crypto.randomUUID();
        const channel = supabase.channel(topic, { config: { private: true } }).subscribe();

        const { value: finalState, latencyMs: rejectMs } = await waitFor(
          () => channel.state !== "joining" ? channel.state : null,
          "channel rejection"
        );

        assert.notStrictEqual(finalState, "joined", `Expected channel to be rejected but state is: ${finalState}`);
        return [{ label: "rejection", value: rejectMs, unit: "ms" }];
      } finally {
        await stopClient(supabase);
      }
    });

    await sleep(RATE_LIMIT_PAUSE_MS);
    await test("user using private channel can connect with enough permissions", async () => {
      const supabase = await authedClient();
      try {
        const channel = supabase.channel(randomTopic(), { config: { private: true } });
        const subscribeMs = await openChannel(channel);
        return [{ label: "subscribe", value: subscribeMs, unit: "ms" }];
      } finally {
        await stopClient(supabase);
      }
    });
  },
};
