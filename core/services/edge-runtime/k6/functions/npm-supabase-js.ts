import { createClient } from "npm:@supabase/supabase-js@2.40.0";
console.log(createClient);
Deno.serve((_req) => new Response("Hello, world"));
