import "https://deno.land/x/xhr@0.1.0/mod.ts";

import axios from "https://esm.sh/axios@1.4.0";

Deno.serve(async () => {
  console.log("Hello from Functions!");
  const { data } = await axios.get("https://supabase.com");
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
});
