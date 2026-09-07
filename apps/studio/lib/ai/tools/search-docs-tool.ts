import { tool } from 'ai'
import { z } from 'zod'

const searchDocsInputSchema = z.object({
  graphql_query: z.string().describe('A valid GraphQL query against the Supabase docs API.'),
})

const CONTENT_API_URL =
  process.env.NEXT_PUBLIC_CONTENT_API_URL ?? 'https://supabase.com/docs/api/graphql'

/**
 * Sends a GraphQL query to the public Supabase docs API.
 *
 * Mirrors the @supabase/mcp-server-supabase content API client: GET
 * `<url>?query=<encoded>` with `Accept: application/json`, returning the
 * GraphQL envelope's `data` field.
 */
async function queryContentApiGraphQL(graphqlQuery: string): Promise<unknown> {
  const url = new URL(CONTENT_API_URL)
  url.searchParams.set('query', graphqlQuery)

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'User-Agent': 'supabase-studio-evals',
    },
    // A stalled connection or response body would otherwise hang getMockTools
    // and preflight indefinitely.
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) {
    throw new Error(`Failed to fetch Supabase Content API: HTTP status ${response.status}`)
  }

  const body = (await response.json()) as {
    data?: unknown
    errors?: Array<{ message: string; locations?: Array<{ line: number; column: number }> }>
  }
  if (body.errors?.length) {
    throw new Error(
      `Supabase Content API GraphQL error: ${body.errors
        .map((error) => {
          const location = error.locations?.[0]
          return `${error.message} (line ${location?.line ?? 'unknown'}, column ${location?.column ?? 'unknown'})`
        })
        .join(', ')}`
    )
  }
  if (!body.data) {
    throw new Error('Supabase Content API returned no data')
  }

  return body.data
}

/**
 * Self-contained `search_docs` tool for the eval harness: calls the public
 * docs GraphQL API directly, so no MCP client or access token is needed.
 * Emits the MCP text-content shape the scorers parse
 * (mcpTextContentSpanOutputSchema / docsFaithfulnessScorer):
 * `{ content: [{ type: 'text', text: JSON.stringify({ result }) }] }`.
 */
export function createSearchDocsTool() {
  return tool({
    description:
      'Search the Supabase documentation using GraphQL. Must be a valid GraphQL query. ' +
      'You should default to calling this even if you think you already know the answer, ' +
      'since the documentation is always being updated.',
    inputSchema: searchDocsInputSchema,
    execute: async ({ graphql_query }: { graphql_query: string }) => {
      const result = await queryContentApiGraphQL(graphql_query)
      return { content: [{ type: 'text' as const, text: JSON.stringify({ result }) }] }
    },
  })
}
