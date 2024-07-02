// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0"
import { readAll } from "https://deno.land/std/io/read_all.ts";
import * as base64 from "https://denopkg.com/chiefbiiko/base64/mod.ts";



Deno.serve(async (req) => {
  const payload = await req.text()
  const base64_secret = Deno.env.get('AUTH_CUSTOM_ACCESS_TOKEN_SECRET')
  const headers = Object.fromEntries(req.headers)
  const wh = new Webhook(base64_secret);
  try {
    const { user_id, claims, authentication_method } = wh.verify(payload, headers);
    claims["my_custom_claim"] = "my_custom_claim"
    return new Response(JSON.stringify({
    claims
    }), { status: 200, headers: { "Content-Type": "application/json"} });

  } catch (error) {
        return new Response(JSON.stringify({
            error: `Failed to process the request: ${error}`
        }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

})
