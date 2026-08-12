// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts"
import { withSupabase } from "@supabase/server"

// This endpoint uses auth 'none': no credentials required, every request is
// accepted. Use 'user', 'publishable', or 'secret' to require credentials.
// The ctx argument then carries ready-made Supabase clients and user claims.
export default {
  fetch: withSupabase({ auth: "none" }, async () => {
    return new Response(
      `"Hello from Edge Functions!"`,
      { headers: { "Content-Type": "application/json" } },
    )
  }),
}

// To invoke:
// curl 'http://localhost:<KONG_HTTP_PORT>/functions/v1/hello' \
//   --header 'Authorization: Bearer <anon/service_role API key>'
