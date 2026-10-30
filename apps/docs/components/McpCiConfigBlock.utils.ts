/**
 * Builds the example CI MCP server configuration. Pure and dependency-free so
 * it can be shared between the React `<McpCiConfigBlock>` component (Next.js
 * bundle) and the build-time markdown-schema handler without pulling in
 * `CodeBlock`'s heavier dependencies (Shiki, Twoslash) into the build script.
 */
export function buildMcpCiConfig(remoteUrl = 'https://mcp.supabase.com/mcp') {
  return {
    mcpServers: {
      supabase: {
        type: 'http',
        url: `${remoteUrl}?project_ref=\${SUPABASE_PROJECT_REF}`,
        headers: {
          Authorization: 'Bearer ${SUPABASE_ACCESS_TOKEN}',
        },
      },
    },
  }
}
