import { FunctionsClient } from "@supabase/functions-js";
import "@supabase/functions-js/edge-runtime.d.ts";

console.log(FunctionsClient);
addEventListener("beforeunload", (ev: CustomEvent<BeforeunloadReason>) => {
  console.log(ev);
});

console.log("meow");
Deno.serve((_req) => new Response("Hello, world"));
