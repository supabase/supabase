/**
 * Eval preflight — MCP connectivity check.
 *
 * The assistant eval harness (`getMockTools`) mocks every tool except
 * `search_docs`, which it sources from a real MCP server. If that connection is
 * broken (endpoint down, bad/expired token, contract drift, missing package),
 * evals fail deep inside a Braintrust run with an opaque per-case error.
 *
 * This preflight exercises the exact same path and fails fast with an
 * actionable message, so a broken MCP connection is caught up front when the
 * eval job runs (e.g. on push). Keep it in lockstep with how `getMockTools`
 * obtains `search_docs` — if that switches to the remote client (see AI-897),
 * switch this too.
 */
import { createInProcessSupabaseMCPClient } from '@/lib/ai/supabase-mcp'

async function runPreflight() {
  let client: Awaited<ReturnType<typeof createInProcessSupabaseMCPClient>> | undefined

  try {
    client = await createInProcessSupabaseMCPClient({
      accessToken: 'mock-access-token',
      projectRef: 'mock-project-ref',
    })

    const tools = await client.tools()

    if (!tools || !('search_docs' in tools)) {
      throw new Error(
        'Connected to the MCP server but `search_docs` was not returned. ' +
          'The tool contract may have drifted, or the server is misconfigured.'
      )
    }

    console.log('✅ Eval MCP preflight OK — connected and `search_docs` is available.')
  } finally {
    await client?.close().catch(() => {})
  }
}

runPreflight().catch((error) => {
  console.error(
    '❌ Eval MCP preflight failed — the eval harness cannot reach the MCP server, ' +
      'so evals would fail. Check NEXT_PUBLIC_MCP_URL, the access token, and the ' +
      '@supabase/mcp-server-supabase dependency.'
  )
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
