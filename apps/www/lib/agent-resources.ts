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
    title: 'Supabase MCP server setup',
    url: 'https://supabase.com/docs/guides/ai-tools/mcp',
    description:
      'Connect an MCP client to the hosted server, authenticate, scope it to a project, and enable read-only mode. Includes the search_docs tool for querying these docs',
  },
  {
    title: 'Supabase Agent Skills',
    url: 'https://supabase.com/docs/guides/ai-tools/ai-skills',
    description: 'Official skills that give agents knowledge for working with Supabase',
  },
  {
    title: 'Supabase plugins for AI tools',
    url: 'https://supabase.com/docs/guides/ai-tools/plugins',
    description: 'Install the Supabase plugin for supported AI coding tools',
  },
  {
    title: 'Supabase local development and CLI',
    url: 'https://supabase.com/docs/guides/local-development',
    description:
      'Run the full Supabase stack locally with the CLI to try schema changes and migrations',
  },
]
