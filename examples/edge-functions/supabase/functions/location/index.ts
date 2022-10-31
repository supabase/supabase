// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.131.0/http/server.ts"

function ips(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(/\s*,\s*/);
}

serve(async (req) => {
  const clientIps = ips(req) || [''];
  const res = await fetch(`https://ipinfo.io/${clientIps[0]}?token=${Deno.env.get('IPINFO_TOKEN')}`, {
      headers: { 'Content-Type': 'application/json'}});
  const { city, country } = await res.json();

  return new Response(
    JSON.stringify(`You're accessing from ${city}, ${country}`),
    { headers: { "Content-Type": "application/json" } },
  )
})
