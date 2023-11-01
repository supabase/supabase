import { createClient } from "@supabase/supabase-js";

export default {
  async fetch(request, { SUPABASE_URL, SUPABASE_ANON_KEY }) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data } = await supabase.from("articles").select("*");
    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  },
};
