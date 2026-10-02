import { createClient } from "npm:@supabase/supabase-js@2.42.0";
Deno.serve((_req) => new Response(`${typeof createClient}`));
