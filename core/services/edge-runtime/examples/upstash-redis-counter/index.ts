// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { connect, parseURL } from "https://deno.land/x/redis/mod.ts";

console.log(`Function "upstash-redis-counter" up and running!`);

Deno.serve(async () => {
  try {
    const redis = await connect(parseURL(Deno.env.get("REDIS_STORE_URL")));

    const deno_region = Deno.env.get("DENO_REGION");
    if (deno_region) {
      // Increment region counter
      await redis.hincrby("supa-edge-counter", deno_region, 1);
    } else {
      // Increment localhost counter
      await redis.hincrby("supa-edge-counter", "localhost", 1);
    }

    // Get all values
    const counterHash: Record<string, number> | null = await redis.hgetall(
      "supa-edge-counter",
    );
    const counters = Object.entries(counterHash!)
      .sort(([, a], [, b]) => b - a) // sort desc
      .reduce(
        (r, [k, v]) => ({
          total: r.total + v,
          regions: { ...r.regions, [k]: v },
        }),
        {
          total: 0,
          regions: {},
        },
      );

    return new Response(JSON.stringify({ counters }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 200,
    });
  }
});

// To invoke, navigate to 'http://localhost:54321/functions/v1/upstash-redis-counter'.
