import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js";
import { createClient } from "npm:@supabase/supabase-js@2.42.0";
import { Database, Tables } from "../_shared/database.types.ts";

const supabase = createClient<Database>(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);
// @ts-ignore TODO: import Supabase AI types.
const model = new Supabase.ai.Session("gte-small");

const sql = postgres(Deno.env.get("SUPABASE_DB_URL") ?? "", {});
await sql.listen(
  "generate-embedding",
  async (x) => await generateEmbedding(JSON.parse(x)),
);

// Backfill content without embedding
const { data, error } = await supabase.from("embeddings").select().is(
  "embedding",
  null,
);
if (error) console.warn(error);
for (const row of data ?? []) {
  await generateEmbedding(row);
}

async function generateEmbedding({ content, id }: Tables<"embeddings">) {
  console.log(`Generating embedding for id: ${id}`);

  // Generate embedding
  const embedding = await model.run(content, {
    mean_pool: true,
    normalize: true,
  });

  // Store in DB
  const { error } = await supabase.from("embeddings").update({ embedding }).eq(
    "id",
    id,
  );
  if (error) console.warn(error);
}

Deno.serve(async (req) => {
  const { search } = await req.json();
  if (!search) return new Response("Please provide a search param!");
  // Generate embedding for search term.
  const embedding = await model.run(search, {
    mean_pool: true,
    normalize: true,
  });

  // Query embeddings.
  const { data: result, error } = await supabase
    .rpc("query_embeddings", {
      embedding,
      match_threshold: 0.8,
    })
    .select("content")
    .limit(3);
  if (error) {
    return Response.json(error);
  }

  return Response.json({ search, result });
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Run `supabase functions serve`
  3. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/search' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"search":"vehicles"}'

*/
