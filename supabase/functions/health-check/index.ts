import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const data = { healthy: true };
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST",
    "Access-Control-Allow-Headers":
      "authorization, x-request-id, apikey, content-type, user-agent, sec-ch-ua, sec-ch-ua-mobile, sec-ch-ua-platform, referer, accept",
  };

  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
