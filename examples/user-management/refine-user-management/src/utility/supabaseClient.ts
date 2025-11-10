import { createClient } from "@refinedev/supabase";


const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseClient = createClient(supabaseUrl, supabasePublishableKey, {
  db: {
    schema: "public",
  },
  auth: {
    persistSession: true,
  },
});
