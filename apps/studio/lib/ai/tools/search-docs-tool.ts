import { tool, type Tool } from 'ai'
import gqlmin from 'gqlmin'
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

const STATIC_DESCRIPTION =
  'Search the Supabase documentation using GraphQL. Must be a valid GraphQL query. ' +
  'You should default to calling this even if you think you already know the answer, ' +
  'since the documentation is always being updated.'

/**
 * Fetches and minifies the Content API's own GraphQL schema (via the `{
 * schema }` query it exposes), mirroring
 * `@supabase/mcp-server-supabase`'s `loadSchema` so the eval tool's
 * description is as close as practical to what production Assistant sees.
 */
async function loadContentApiSchema(): Promise<string> {
  const data = (await queryContentApiGraphQL('{ schema }')) as { schema?: unknown }
  if (typeof data.schema !== 'string' || !data.schema) {
    throw new Error('Supabase Content API `{ schema }` query returned no schema string')
  }
  return gqlmin(data.schema)
}

/**
 * Builds the tool description with the live GraphQL schema embedded, so the
 * model has the same schema context production's `search_docs` gives it (see
 * `@supabase/mcp-server-supabase`'s `docs-tools.ts`).
 *
 * Schema loading is required: running an eval without the schema makes the
 * model's GraphQL queries untrustworthy and can hide a real docs-search
 * regression behind fallback results.
 */
async function buildDescription(): Promise<string> {
  const schema = await loadContentApiSchema()
  return `${STATIC_DESCRIPTION}\n\nBelow is the GraphQL schema for this tool:\n\n${schema}`
}

/**
 * Self-contained `search_docs` tool for the eval harness: calls the public
 * docs GraphQL API directly, so no MCP client or access token is needed.
 * Emits the MCP text-content shape the scorers parse
 * (mcpTextContentSpanOutputSchema / docsFaithfulnessScorer):
 * `{ content: [{ type: 'text', text: JSON.stringify({ result }) }] }`.
 *
 * `description` is resolved before construction (the `ai` package's `tool()`
 * only accepts a plain string, not an async function like the MCP SDK's
 * `docs-tools.ts` uses), so this factory is async.
 */
export type SearchDocsTool = Tool<
  z.infer<typeof searchDocsInputSchema>,
  { content: Array<{ type: 'text'; text: string }> }
>

export async function createSearchDocsTool(): Promise<SearchDocsTool> {
  const description = await buildDescription()
  return tool({
    description,
    inputSchema: searchDocsInputSchema,
    execute: async ({ graphql_query }: { graphql_query: string }) => {
      const result = await queryContentApiGraphQL(graphql_query)
      return { content: [{ type: 'text' as const, text: JSON.stringify({ result }) }] }
    },
  })
}
