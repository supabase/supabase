import { createClient } from "@supabase/supabase-js";

export default {
  async fetch(request, { IECHOR_URL, IECHOR_ANON_KEY }) {
    const supabase = createClient(IECHOR_URL, IECHOR_ANON_KEY);

    const { data } = await supabase.from("articles").select("*");
    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  },
};
