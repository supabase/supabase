import { CodeBlock } from '~/features/ui/CodeBlock/CodeBlock'
import { getCustomContent } from '~/lib/custom-content/getCustomContent'

/**
 * Renders the example CI MCP server configuration with the remote MCP server
 * URL pulled from `custom-content.json` (`mcp:servers`). Fenced code blocks in
 * MDX render verbatim, so a dynamic value has to be injected via a component.
 */
export function McpCiConfigBlock() {
  const { mcpServers } = getCustomContent(['mcp:servers'])

  const config = {
    mcpServers: {
      supabase: {
        type: 'http',
        url: `${mcpServers?.remote}?project_ref=\${SUPABASE_PROJECT_REF}`,
        headers: {
          Authorization: 'Bearer ${SUPABASE_ACCESS_TOKEN}',
        },
      },
    },
  }

  return <CodeBlock lang="json" contents={JSON.stringify(config, null, 2)} />
}
