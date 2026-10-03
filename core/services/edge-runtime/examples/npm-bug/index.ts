import { createClient } from "npm:@supabase/supabase-js@2.40.0";

console.log("x");
globalThis.hello = "world";
console.log(createClient);
