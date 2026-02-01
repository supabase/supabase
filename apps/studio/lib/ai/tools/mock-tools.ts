import { tool, type ToolSet } from 'ai'
import { getRenderingTools } from '../tools/rendering-tools'
import { z } from 'zod'
import { getMcpTools } from 'lib/ai/tools/mcp-tools'
import assert from 'node:assert'

const listTablesInputSchema = z.object({
  schemas: z.array(z.string()).describe('The schema names to list.'),
})

const getAdvisorsInputSchema = z.object({
  type: z.enum(['security', 'performance']).optional(),
})

const getLogsInputSchema = z.object({
  limit: z.number().min(1).max(100).optional(),
  level: z.enum(['debug', 'info', 'warning', 'error']).optional(),
  source: z.enum(['postgres', 'auth', 'storage', 'edge_function']).optional(),
  search: z.string().optional(),
})

const listPoliciesInputSchema = z.object({
  schemas: z.array(z.string()).describe('The schema names to get the policies for'),
})

export const MOCK_TABLES_DATA = [
  {
    name: 'user_documents',
    rls_enabled: false,
    columns: [
      { name: 'id', data_type: 'bigint' },
      { name: 'user_id', data_type: 'uuid' },
      { name: 'title', data_type: 'text' },
    ],
  },
  {
    name: 'customers',
    rls_enabled: true,
    columns: [
      { name: 'id', data_type: 'uuid' },
      { name: 'tenant_id', data_type: 'uuid' },
      { name: 'email', data_type: 'text' },
    ],
  },
  {
    name: 'projects',
    rls_enabled: false,
    columns: [
      { name: 'id', data_type: 'uuid' },
      { name: 'organization_id', data_type: 'uuid' },
      { name: 'name', data_type: 'text' },
    ],
  },
  {
    name: 'user_organizations',
    rls_enabled: true,
    columns: [
      { name: 'user_id', data_type: 'uuid' },
      { name: 'organization_id', data_type: 'uuid' },
    ],
  },
]

const MOCK_EXTENSIONS_DATA = [
  { name: 'pgcrypto', schema: 'extensions', installed_version: '1.3' },
  { name: 'uuid-ossp', schema: 'extensions', installed_version: '1.1' },
]

const MOCK_EDGE_FUNCTIONS_DATA = [
  { name: 'hello-world', last_deployed_at: '2024-06-10T12:30:00Z' },
  { name: 'daily-metrics-sync', last_deployed_at: '2024-06-18T08:15:00Z' },
  { name: 'select-from-table-with-auth-rls', last_deployed_at: '2024-06-19T09:20:00Z' },
]

const MOCK_ADVISORIES_DATA = [
  {
    id: '0016_materialized_view_in_api',
    level: 'warning',
    category: 'security',
    message: 'Materialized views in API schema can bypass RLS. Move them to private schema.',
    remediationUrl:
      'https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0016_materialized_view_in_api',
  },
  {
    id: '0031_functions_no_rls_guard',
    level: 'notice',
    category: 'security',
    message: 'Function api.health_check should verify auth context before querying tables.',
    remediationUrl:
      'https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0031_functions_no_rls_guard',
  },
  {
    id: '1012_slow_query',
    level: 'info',
    category: 'performance',
    message:
      'Query on table edge_function_logs exceeded 3s average execution time over the last hour.',
    remediationUrl: 'https://supabase.com/docs/guides/platform/performance-advisors#slow-queries',
  },
]

const MOCK_LOGS_DATA = [
  {
    id: 'log-001',
    timestamp: '2024-06-20T14:12:00Z',
    level: 'error',
    source: 'edge_function' as const,
    target: 'hello-world',
    message: "TypeError: fetch failed at await supabase.functions.invoke('analytics')",
  },
  {
    id: 'log-002',
    timestamp: '2024-06-20T14:05:30Z',
    level: 'warning',
    source: 'postgres' as const,
    target: 'connection_pool',
    message: 'Query timeout exceeded for statement SELECT * FROM public.audit_log_entries',
  },
  {
    id: 'log-003',
    timestamp: '2024-06-20T13:59:10Z',
    level: 'info',
    source: 'edge_function' as const,
    target: 'daily-metrics-sync',
    message: 'Invocation completed in 520ms',
  },
  {
    id: 'log-004',
    timestamp: '2024-06-20T13:50:00Z',
    level: 'error',
    source: 'postgres' as const,
    target: 'trigger:refresh_materialized_views',
    message: 'permission denied for relation user_documents',
  },
  {
    id: 'log-005',
    timestamp: '2024-06-20T13:45:00Z',
    level: 'info',
    source: 'auth' as const,
    target: 'email-confirmation',
    message: 'Sent verification email to alex@example.com',
  },
]

function createMockedRenderingTools() {
  const renderingTools = getRenderingTools()

  return Object.fromEntries(
    Object.entries(renderingTools).map(([name, baseTool]) => {
      if (typeof baseTool.execute === 'function') {
        return [name, baseTool]
      }

      const statusMessage =
        name === 'execute_sql'
          ? 'SQL execution mocked successfully.'
          : name === 'deploy_edge_function'
            ? 'Edge Function deployment mocked successfully.'
            : 'Tool call mocked successfully.'

      return [
        name,
        {
          ...baseTool,
          execute: async () => ({ status: statusMessage }),
        },
      ]
    })
  ) as typeof renderingTools
}

function createMockListTablesTool(overrideData?: Record<string, typeof MOCK_TABLES_DATA>) {
  return tool({
    description: 'Lists tables and columns for the provided schemas.',
    inputSchema: listTablesInputSchema,
    execute: async ({ schemas }: { schemas: string[] }) => {
      const effectiveSchemas = schemas?.length ? schemas : ['public']
      return effectiveSchemas.map((schema) => ({
        schema,
        tables: overrideData?.[schema] ?? MOCK_TABLES_DATA,
      }))
    },
  })
}

function createMockListExtensionsTool() {
  return tool({
    description: 'Lists installed database extensions.',
    inputSchema: z.object({}),
    execute: async () => {
      return MOCK_EXTENSIONS_DATA
    },
  })
}

function createMockListEdgeFunctionsTool() {
  return tool({
    description: 'Lists available Supabase Edge Functions.',
    inputSchema: z.object({}),
    execute: async () => {
      return MOCK_EDGE_FUNCTIONS_DATA
    },
  })
}

function createMockGetAdvisorsTool() {
  return tool({
    description: 'Returns advisory notices for the project (mocked).',
    inputSchema: getAdvisorsInputSchema,
    execute: async ({ type }: { type?: 'security' | 'performance' }) => {
      if (type) {
        return MOCK_ADVISORIES_DATA.filter((advisory) => advisory.category === type)
      }
      return MOCK_ADVISORIES_DATA
    },
  })
}

function createMockGetLogsTool() {
  return tool({
    description: 'Fetches recent project logs for debugging or health checks (mocked).',
    inputSchema: getLogsInputSchema,
    execute: async ({
      limit = 10,
      level,
      source,
      search,
    }: {
      limit?: number
      level?: 'debug' | 'info' | 'warning' | 'error'
      source?: 'postgres' | 'auth' | 'storage' | 'edge_function'
      search?: string
    }) => {
      let filtered = MOCK_LOGS_DATA

      if (level) {
        filtered = filtered.filter((entry) => entry.level === level)
      }

      if (source) {
        filtered = filtered.filter((entry) => entry.source === source)
      }

      if (search) {
        const needle = search.toLowerCase()
        filtered = filtered.filter((entry) =>
          `${entry.message} ${entry.target}`.toLowerCase().includes(needle)
        )
      }

      return filtered.slice(0, limit)
    },
  })
}

function createMockListPoliciesTool() {
  return tool({
    description: 'Get existing RLS policies for provided schemas.',
    inputSchema: listPoliciesInputSchema,
    execute: async ({ schemas }: { schemas: string[] }) => {
      const effectiveSchemas = schemas?.length ? schemas : ['public']
      const results = [] as Array<{
        schema: string
        table: string
        policies: Array<{
          name: string
          command: 'select' | 'insert' | 'update' | 'delete'
          using?: string
          check?: string
        }>
      }>

      for (const schema of effectiveSchemas) {
        if (schema !== 'public') continue
        results.push(
          {
            schema,
            table: 'customers',
            policies: [
              {
                name: 'customers_tenant_select',
                command: 'select',
                using: "(auth.jwt() ->> 'tenant_id')::uuid = tenant_id",
              },
            ],
          },
          { schema, table: 'user_documents', policies: [] },
          { schema, table: 'projects', policies: [] }
        )
      }
      return results
    },
  })
}

export type MockToolOverrides = {
  list_tables?: Record<string, typeof MOCK_TABLES_DATA>
}

/**
 * Deterministic mock implementations of MCP/platform tools for evals.
 * These mirror tool names used in prompts so the model can call them,
 * but return stable, static data for repeatable tests.
 *
 * Note: search_docs uses the real implementation
 */
export async function getMockTools(overrides?: MockToolOverrides) {
  const mockedRenderingTools = createMockedRenderingTools()

  const { search_docs } = await getMcpTools({
    accessToken: 'mock-access-token',
    projectRef: 'mock-project-ref',
    aiOptInLevel: 'schema_and_log_and_data',
  })

  assert(search_docs, 'search_docs tool not available from MCP server')

  return {
    ...mockedRenderingTools,
    search_docs,
    list_tables: createMockListTablesTool(overrides?.list_tables),
    list_extensions: createMockListExtensionsTool(),
    list_edge_functions: createMockListEdgeFunctionsTool(),
    get_advisors: createMockGetAdvisorsTool(),
    get_logs: createMockGetLogsTool(),
    list_policies: createMockListPoliciesTool(),
  }
}
