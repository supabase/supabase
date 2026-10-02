import { serve } from "https://deno.land/std@0.131.0/http/server.ts";

serve(async (req: Request) => {
  return new Response(
    JSON.stringify(<div>Hello</div>),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
