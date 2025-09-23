const ALLOWED_ORIGINS = ["http://localhost:8000"];
const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGINS.join(","),
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, range, if-match",
  "Access-Control-Expose-Headers": "range, accept-ranges, etag",
  "Access-Control-Max-Age": "300",
};

Deno.serve((req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Check origin
  const origin = req.headers.get("Origin");

  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return new Response("Not Allowed", { status: 405 });
  }

  const reqUrl = new URL(req.url);
  const url = `${
    Deno.env.get("SUPABASE_URL")
  }/storage/v1/object/authenticated${reqUrl.pathname}`;

  const { method, headers } = req;
  // Add Auth header
  const modHeaders = new Headers(headers);
  modHeaders.append(
    "authorization",
    `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!}`,
  );
  return fetch(url, { method, headers: modHeaders });
});
