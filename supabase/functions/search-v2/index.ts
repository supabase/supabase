import { serve } from 'https://deno.land/std@0.170.0/http/server.ts'
import 'https://deno.land/x/xhr@0.2.1/mod.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.8.0'
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.1.0'
import { Database } from '../common/database-types.ts'
import { ApplicationError, UserError } from '../common/errors.ts'

const openAiKey = Deno.env.get('OPENAI_API_KEY')
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  try {
    // Handle CORS
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    if (!openAiKey) {
      throw new ApplicationError('Missing environment variable OPENAI_API_KEY')
    }

    if (!supabaseUrl) {
      throw new ApplicationError('Missing environment variable SUPABASE_URL')
    }

    if (!supabaseServiceKey) {
      throw new ApplicationError('Missing environment variable SUPABASE_SERVICE_ROLE_KEY')
    }

    const requestData = await req.json()

    if (!requestData) {
      throw new UserError('Missing request data')
    }

    const { query } = requestData

    if (!query) {
      throw new UserError('Missing query in request data')
    }

    // Intentionally log the query
    console.log({ query })

    const sanitizedQuery = query.trim()

    const supabaseClient = createClient<Database>(supabaseUrl, supabaseServiceKey)

    const configuration = new Configuration({ apiKey: openAiKey })
    const openai = new OpenAIApi(configuration)

    // Moderate the content to comply with OpenAI T&C
    const moderationResponse = await openai.createModeration({ input: sanitizedQuery })

    const [results] = moderationResponse.data.results

    if (results.flagged) {
      throw new UserError('Flagged content', {
        flagged: true,
        categories: results.categories,
      })
    }

    const embeddingResponse = await openai.createEmbedding({
      model: 'text-embedding-ada-002',
      input: sanitizedQuery.replaceAll('\n', ' '),
    })

    if (embeddingResponse.status !== 200) {
      throw new ApplicationError('Failed to create embedding for question', embeddingResponse)
    }

    const [{ embedding }] = embeddingResponse.data.data
    const { error: matchError, data: pageSections } = await supabaseClient
      .rpc('match_page_sections_v2', {
        embedding,
        match_threshold: 0.78,
        min_content_length: 50,
      })
      .select('slug, heading, page_id')
      .limit(10)

    if (matchError || !pageSections) {
      throw new ApplicationError('Failed to match page sections', matchError ?? undefined)
    }

    const uniquePageIds = pageSections
      .map<number>(({ page_id }) => page_id)
      .filter((value, index, array) => array.indexOf(value) === index)

    const { error: fetchPagesError, data: pages } = await supabaseClient
      .from('page')
      .select('id, type, path, meta')
      .in('id', uniquePageIds)

    if (fetchPagesError || !pages) {
      throw new ApplicationError(`Failed to fetch pages`, fetchPagesError)
    }

    const combinedPages = pages
      .map((page) => {
        const sections = pageSections
          .map((pageSection, index) => ({ ...pageSection, rank: index }))
          .filter(({ page_id }) => page_id === page.id)

        // Rank this page based on its highest-ranked page section
        const rank = sections.reduce((min, { rank }) => Math.min(min, rank), Infinity)

        return {
          ...page,
          sections,
          rank,
        }
      })
      .sort((a, b) => a.rank - b.rank)

    return new Response(JSON.stringify(combinedPages), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })
  } catch (err: unknown) {
    if (err instanceof UserError) {
      return new Response(
        JSON.stringify({
          error: err.message,
          data: err.data,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    } else if (err instanceof ApplicationError) {
      // Print out application errors with their additional data
      console.error(`${err.message}: ${JSON.stringify(err.data)}`)
    } else {
      // Print out unexpected errors as is to help with debugging
      console.error(err)
    }

    // TODO: include more response info in debug environments
    return new Response(
      JSON.stringify({
        error: 'There was an error processing your request',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
