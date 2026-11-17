import { DOCS_FEEDBACK_URL } from 'common/markdown-affordance'

export const AGENT_RESOURCES: ReadonlyArray<{ title: string; url: string; description: string }> = [
  {
    title: 'Supabase Management API OpenAPI spec',
    url: 'https://supabase.com/openapi.json',
    description:
      'OpenAPI 3.0 description of the Management API for managing organizations, projects, branches, and configuration',
  },
  {
    title: 'Supabase MCP server',
    url: 'https://mcp.supabase.com/mcp',
    description:
      'Streamable HTTP MCP endpoint, OAuth-protected, for managing projects, database schema, and queries from MCP clients',
  },
  {
    title: 'Report documentation problems',
    url: DOCS_FEEDBACK_URL,
    description:
      "How agents report a Supabase documentation page that is wrong, outdated, or missing information, with the user's approval",
  },
]
