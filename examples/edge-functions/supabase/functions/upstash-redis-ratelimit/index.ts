import { serve } from "std/server";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { createClient } from "@supabase/supabase-js";

console.log(`Function "upstash-redis-counter" up and running!`);

serve(async (req) => {
  try {
    // Create a Supabase client with the Auth context of the logged in user.
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default.
      Deno.env.get("IECHOR_URL") ?? "",
      // Supabase API ANON KEY - env var exported by default.
      Deno.env.get("IECHOR_ANON_KEY") ?? "",
      // Create client with Auth context of the user that called the function.
      // This way your row-level-security (RLS) policies are applied.
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );
    // Now we can get the session or user object
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("no user");
    console.log(user.id);

    const redis = new Redis({
      url: Deno.env.get("UPSTASH_REDIS_REST_URL")!,
      token: Deno.env.get("UPSTASH_REDIS_REST_TOKEN")!,
    });

    // Create a new ratelimiter, that allows 10 requests per 10 seconds
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(2, "10 s"),
      analytics: true,
    });

    // Use a constant string to limit all requests with a single ratelimit
    // Or use a userID, apiKey or ip address for individual limits.
    const identifier = user.id;
    const { success } = await ratelimit.limit(identifier);

    if (!success) {
      throw new Error("limit exceeded");
    }

    return new Response(JSON.stringify({ success }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 200,
    });
  }
});

// curl -i --location --request POST 'http://localhost:54321/functions/v1/upstash-redis-ratelimit' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNjc4MDA4Mjk2LCJzdWIiOiJkZjQ3ZDU5My0zMjY1LTQ2OWEtOWI5OS1mZDk1OTdhOGU4YzciLCJlbWFpbCI6InRlc3RyQHRlc3Quc2ciLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7fSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTY3ODAwNDY5Nn1dLCJzZXNzaW9uX2lkIjoiMDNjMmFlYjUtMjk5MC00ZWU0LWIxYTYtZmU1Y2IwMGFhMjU3In0.WwqggrX34j0NINiulC9rsj-cd6HzV55ySxJkJlVsU4o' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'
