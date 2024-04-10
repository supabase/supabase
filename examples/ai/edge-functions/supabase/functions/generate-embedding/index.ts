import { createClient } from "npm:@supabase/supabase-js@2.42.0";
import { Database, Tables } from "../_shared/database.types.ts";

type EmbeddingsRecord = Tables<"embeddings">;
interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: EmbeddingsRecord;
  schema: "public";
  old_record: null | EmbeddingsRecord;
}

const supabase = createClient<Database>(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);
// @ts-ignore TODO: import Supabase AI types.
const model = new Supabase.ai.Session("gte-small");

Deno.serve(async (req) => {
  const payload: WebhookPayload = await req.json();
  const { content, id } = payload.record;

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
  if (error) console.warn(error.message);

  return new Response("ok");
});
