import { createClient } from "npm:@supabase/supabase-js@2.42.0";
console.log(typeof createClient);
Deno.serve((_req) => new Response("Hello, world"));
