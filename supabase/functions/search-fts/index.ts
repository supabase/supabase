import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.8.0'
import { Database } from '../common/database-types.ts'
import { ApplicationError, UserError } from '../common/errors.ts'

const isDev = Deno.env.get('DENO_ENV') === 'development'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

function getCorsHeaders(req) {
  const receivedOrigin = req.headers.get('Origin')
  const resolvedOrigin = /^https:\/\/[^.\/]+-supabase.vercel.app$/.test(receivedOrigin)
    ? receivedOrigin // Allow preview sites on Vercel to access function
    : 'https://supabase.com'

  return {
    'Access-Control-Allow-Origin': isDev ? '*' : resolvedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

Deno.serve(async (req) => {
  try {
    // Handle CORS
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: getCorsHeaders(req) })
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

    const { data: searchData, error: searchError } = await supabaseClient.rpc('docs_search_fts', {
      query: sanitizedQuery,
    })

    if (searchError) {
      throw new ApplicationError('Failed to find search results', searchError)
    }

    return new Response(JSON.stringify(searchData), {
      headers: {
        ...getCorsHeaders(req),
        'Content-Type': 'application/json',
      },
    })
  } catch (err) {
    console.error(err)

    if (err instanceof UserError) {
      return new Response(
        JSON.stringify({
          error: err.message,
          data: err.data,
        }),
        {
          status: 400,
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
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
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      }
    )
  }
})
