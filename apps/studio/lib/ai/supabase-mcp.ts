import { createMCPClient } from '@ai-sdk/mcp'

/**
 * Default MCP server URL used when `NEXT_PUBLIC_MCP_URL` is not configured (local
 * development). Mirrors `DEFAULT_MCP_URL_PLATFORM` in `ui-patterns/McpUrlBuilder`
 * so the assistant resolves the same endpoint as the Connect sheet. It's
 * duplicated here (rather than imported) to keep
 * `ui-patterns/McpUrlBuilder/constants` — which pulls in `next/image` and image
 * assets — out of this server-side bundle.
 */
const DEFAULT_MCP_URL = 'http://localhost:8080/mcp'

/**
 * Identifies assistant traffic to the remote MCP server. Sent both as the MCP
 * client name (logged as `client_name`) and via the `x-source-name` header
 * (logged as `source_name`) by the mgmt-api McpLogger, so assistant requests are
 * attributable in the MCP server's logs.
 */
const SOURCE_NAME = 'supabase-studio'

/**
 * Builds the remote MCP endpoint URL for the dashboard assistant.
 *
 * Points at the remote MCP server configured via `NEXT_PUBLIC_MCP_URL` (e.g.
 * https://mcp.supabase.com/mcp), falling back to a local default for development.
 * The query parameters (`project_ref`, `read_only`) mirror `getMcpUrl` in
 * `ui-patterns/McpUrlBuilder/utils/getMcpUrl` so the assistant and the Connect sheet stay in
 * sync. The assistant only performs read operations, so `read_only` is always
 * set.
 *
 * Note: the assistant only talks to the remote MCP server on the hosted platform
 * (see `getTools` / `getMcpTools`), so no self-hosted branch is needed here.
 */
function getRemoteMcpUrl(projectRef: string) {
  // `||` (not `??`) so an empty-string env var falls back instead of producing
  // an invalid `new URL('')`.
  const url = new URL(process.env.NEXT_PUBLIC_MCP_URL || DEFAULT_MCP_URL)
  if (projectRef) {
    url.searchParams.set('project_ref', projectRef)
  }
  url.searchParams.set('read_only', 'true')

  return url.toString()
}

/**
 * Creates an MCP client connected to the remote Supabase MCP server over HTTP.
 *
 * Previously the assistant instantiated the MCP server in-process and connected
 * to it via an in-memory transport. It now connects to the remote MCP server so
 * the dashboard assistant shares the same MCP surface as external clients.
 *
 * The dashboard session `accessToken` is forwarded as a bearer token. The remote
 * MCP server is responsible for validating it and scoping access to the project.
 */
export async function createSupabaseMCPClient({
  accessToken,
  projectRef,
}: {
  accessToken: string
  projectRef: string
}) {
  // Identifies the deployed build in the MCP server's `source_version` log field.
  const sourceVersion = process.env.VERCEL_GIT_COMMIT_SHA

  const client = await createMCPClient({
    name: SOURCE_NAME,
    transport: {
      type: 'http',
      url: getRemoteMcpUrl(projectRef),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        // Identify assistant traffic in the remote MCP server's logs
        'x-source-name': SOURCE_NAME,
        ...(sourceVersion ? { 'x-source-version': sourceVersion } : {}),
      },
    },
  })

  return client
}

/**
 * Legacy in-process MCP client — the pre-migration behavior, kept as a fallback
 * behind the `USE_REMOTE_MCP` gate (see `tools/mcp-tools.ts`).
 *
 * Instantiates `@supabase/mcp-server-supabase` in-process and connects to it over
 * an in-memory transport. The heavy server package is imported dynamically so it
 * is code-split into its own chunk and stays out of the (default, post-migration)
 * remote path's bundle.
 *
 * TODO(AI-897): remove in process mcp — delete this once every environment has
 * been flipped to the remote MCP server and has been stable. Tracked alongside
 * the `USE_REMOTE_MCP` rollout.
 */
export async function createInProcessSupabaseMCPClient({
  accessToken,
  projectRef,
}: {
  accessToken: string
  projectRef: string
}) {
  // Dynamic imports keep the in-process server + its transport out of the remote
  // path's bundle (loaded only when this fallback is actually taken).
  // `.js` is required for esbuild ESM resolution.
  const { InMemoryTransport } = await import('@modelcontextprotocol/sdk/inMemory.js')
  const { createSupabaseMcpServer } = await import('@supabase/mcp-server-supabase')
  const { createSupabaseApiPlatform } = await import('@supabase/mcp-server-supabase/platform/api')
  const { API_URL } = await import('@/lib/constants')

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()

  // Instantiate the MCP server and connect to its transport
  const apiUrl = API_URL?.replace('/platform', '')
  const server = createSupabaseMcpServer({
    platform: createSupabaseApiPlatform({
      accessToken,
      apiUrl,
    }),
    contentApiUrl: process.env.NEXT_PUBLIC_CONTENT_API_URL,
    projectId: projectRef,
    readOnly: true,
  })
  await server.connect(serverTransport)

  const client = await createMCPClient({
    name: SOURCE_NAME,
    transport: clientTransport,
  })

  return client
}
