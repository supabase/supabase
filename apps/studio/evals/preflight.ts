/**
 * Eval preflight — search_docs connectivity check.
 *
 * The assistant eval harness (`getMockTools`) mocks every tool except
 * `search_docs`, which is a self-contained tool that calls the public Supabase
 * docs GraphQL API directly (no MCP server, no access token). If that call is
 * broken (endpoint down, contract drift, missing tool), evals fail deep inside
 * a Braintrust run with an opaque per-case error.
 *
 * This preflight exercises the exact same tool and fails fast with an
 * actionable message, so a broken docs API connection is caught up front when
 * the eval job runs (e.g. on push). Keep it in lockstep with how `getMockTools`
 * obtains `search_docs` — both use `createSearchDocsTool` from
 * `lib/ai/tools/search-docs-tool`.
 */
import { createSearchDocsTool } from '@/lib/ai/tools/search-docs-tool'

async function runPreflight() {
  const searchDocs = createSearchDocsTool()

  if (!searchDocs?.execute) {
    throw new Error(
      '`search_docs` is missing from the eval harness. The tool contract may have ' +
        'drifted, or `createSearchDocsTool` was removed from lib/ai/tools/search-docs-tool.'
    )
  }

  const output = (await searchDocs.execute(
    {
      graphql_query:
        '{ searchDocs(query: "row level security", limit: 1) { nodes { title href } } }',
    },
    { toolCallId: 'preflight', messages: [], context: {} }
  )) as { content: Array<{ type?: 'text'; text: string }> }

  // Validate the MCP text-content shape the scorers parse
  // (mcpTextContentSpanOutputSchema / docsFaithfulnessScorer).
  const content = output?.content
  const text = content?.[0]?.text
  if (!Array.isArray(content) || typeof text !== 'string' || !text) {
    throw new Error(
      '`search_docs` returned an unexpected shape. Expected MCP text content ' +
        '({ content: [{ type: "text", text: string }] }) but got: ' +
        JSON.stringify(output ?? null)
    )
  }

  console.log('✅ Eval preflight OK — `search_docs` reaches the public docs GraphQL API.')
}

runPreflight().catch((error) => {
  console.error(
    '❌ Eval preflight failed — `search_docs` cannot reach the public docs GraphQL API, ' +
      'so evals would fail. Check NEXT_PUBLIC_CONTENT_API_URL (if set) and the default ' +
      'endpoint https://supabase.com/docs/api/graphql.'
  )
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
