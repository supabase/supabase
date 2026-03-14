import "https://deno.land/x/xhr@0.2.1/mod.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import OpenAI from "https://esm.sh/openai@4.20.1";

import { Database } from "../common/database-types.ts";
import { ApplicationError, UserError } from "../common/errors.ts";

/*
|--------------------------------------------------------------------------
| Environment Variables
|--------------------------------------------------------------------------
*/

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY");
if (!SUPABASE_URL) throw new Error("Missing SUPABASE_URL");
if (!SUPABASE_SERVICE_KEY) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

/*
|--------------------------------------------------------------------------
| Clients (Reuse instead of creating per request)
|--------------------------------------------------------------------------
*/

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

/*
|--------------------------------------------------------------------------
| CORS Headers
|--------------------------------------------------------------------------
*/

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/*
|--------------------------------------------------------------------------
| Utility Functions
|--------------------------------------------------------------------------
*/

async function moderateQuery(query: string) {
  const moderation = await openai.moderations.create({
    model: "omni-moderation-latest",
    input: query,
  });

  const result = moderation.results?.[0];

  if (result?.flagged) {
    throw new UserError("Query violates content policy", {
      categories: result.categories,
    });
  }
}

async function createEmbedding(query: string) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query.replace(/\n/g, " "),
  });

  return response.data[0].embedding;
}

/*
|--------------------------------------------------------------------------
| Edge Function
|--------------------------------------------------------------------------
*/

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    const { query, useAlternateSearchIndex } = await req.json();

    if (!query) {
      throw new UserError("Missing query in request");
    }

    const sanitizedQuery = query.trim();

    console.log("Incoming search query:", sanitizedQuery);

    /*
    ------------------------------------------------
    Moderate Query
    ------------------------------------------------
    */

    await moderateQuery(sanitizedQuery);

    /*
    ------------------------------------------------
    Create Embedding
    ------------------------------------------------
    */

    const embedding = await createEmbedding(sanitizedQuery);

    /*
    ------------------------------------------------
    Search Documents
    ------------------------------------------------
    */

    const searchFunction = useAlternateSearchIndex
      ? "docs_search_embeddings_nimbus"
      : "docs_search_embeddings";

    const { data: pages, error } = await supabase.rpc(searchFunction, {
      embedding,
      match_threshold: 0.78,
    });

    if (error) {
      throw new ApplicationError("Embedding search failed", error);
    }

    return new Response(JSON.stringify(pages), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    if (err instanceof UserError) {
      return new Response(
        JSON.stringify({
          error: err.message,
          data: err.data,
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (err instanceof ApplicationError) {
      console.error("Application Error:", err.message, err.data);
    } else {
      console.error("Unexpected Error:", err);
    }

    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

