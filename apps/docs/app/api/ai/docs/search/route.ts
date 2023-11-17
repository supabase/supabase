import { createClient } from '@supabase/supabase-js'
import { codeBlock } from 'common-tags'
import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { ApplicationError, UserError } from '~/lib/api/errors'

const openai = new OpenAI()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
})

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get('query')

    if (!query) {
      throw new UserError('Missing query in request data')
    }

    // Intentionally log the query
    console.log({ query })

    const formattedQuery = query.trim()

    const moderationResponse = await openai.moderations.create({ input: formattedQuery })

    const [results] = moderationResponse.results

    if (results.flagged) {
      throw new UserError('Flagged content', {
        flagged: true,
        categories: results.categories,
      })
    }

    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: formattedQuery.replaceAll('\n', ' '),
    })

    const [{ embedding }] = embeddingResponse.data

    const { error: matchError, data: pageSections } = await supabase
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

    const { error: fetchPagesError, data: pages } = await supabase
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

    return Response.json(combinedPages)
  } catch (err: unknown) {
    if (err instanceof UserError) {
      return Response.json(
        {
          error: err.message,
          data: err.data,
        },
        { status: 400 }
      )
    } else if (err instanceof ApplicationError) {
      // Print out application errors with their additional data
      console.error(`${err.message}: ${JSON.stringify(err.data)}`)
    } else {
      // Print out unexpected errors to help with debugging
      console.error(err)
    }

    // TODO: include more debug info in non-prod environments
    return Response.json(
      {
        error: 'There was an error processing your request',
      },
      { status: 500 }
    )
  }
}
