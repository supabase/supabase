import { tool, type ToolSet } from 'ai'
import { getRenderingTools } from '../tools/rendering-tools'
import { z } from 'zod'

/**
 * Deterministic mock implementations of MCP/platform tools for evals.
 * These mirror tool names used in prompts so the model can call them,
 * but return stable, static data for repeatable tests.
 */
export function getEvalMockTools(): ToolSet {
  const renderingTools = getRenderingTools()

  const mockedRenderingTools = Object.fromEntries(
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
  ) as ToolSet

  return {
    ...mockedRenderingTools,

    list_tables: tool({
      description: 'Lists tables and columns for the provided schemas.',
      inputSchema: z.object({
        schemas: z.array(z.string()).describe('The schema names to list.'),
      }),
      execute: async ({ schemas }: { schemas: string[] }) => {
        const effectiveSchemas = schemas?.length ? schemas : ['public']
        // Deterministic, minimal schema metadata suitable for RLS generation
        const result = effectiveSchemas.map((schema) => ({
          schema,
          tables: [
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
          ],
        }))
        return result
      },
    }),

    list_extensions: tool({
      description: 'Lists installed database extensions.',
      inputSchema: z.object({}),
      execute: async () => {
        return [
          { name: 'pgcrypto', schema: 'extensions', installed_version: '1.3' },
          { name: 'uuid-ossp', schema: 'extensions', installed_version: '1.1' },
        ]
      },
    }),

    list_edge_functions: tool({
      description: 'Lists available Supabase Edge Functions.',
      inputSchema: z.object({}),
      execute: async () => {
        return [
          { name: 'hello-world', last_deployed_at: '2024-06-10T12:30:00Z' },
          { name: 'daily-metrics-sync', last_deployed_at: '2024-06-18T08:15:00Z' },
          { name: 'select-from-table-with-auth-rls', last_deployed_at: '2024-06-19T09:20:00Z' },
        ]
      },
    }),

    get_advisors: tool({
      description: 'Returns advisory notices for the project (mocked).',
      inputSchema: z.object({
        type: z.enum(['security', 'performance']).optional(),
      }),
      execute: async ({ type }: { type?: 'security' | 'performance' }) => {
        const advisories = [
          {
            id: '0016_materialized_view_in_api',
            level: 'warning',
            category: 'security',
            message:
              'Materialized views in API schema can bypass RLS. Move them to private schema.',
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
            message: 'Query on table edge_function_logs exceeded 3s average execution time over the last hour.',
            remediationUrl:
              'https://supabase.com/docs/guides/platform/performance-advisors#slow-queries',
          },
        ]

        if (type) {
          return advisories.filter((advisory) => advisory.category === type)
        }

        return advisories
      },
    }),

    get_logs: tool({
      description: 'Fetches recent project logs for debugging or health checks (mocked).',
      inputSchema: z.object({
        limit: z.number().min(1).max(100).optional(),
        level: z.enum(['debug', 'info', 'warning', 'error']).optional(),
        source: z.enum(['postgres', 'auth', 'storage', 'edge_function']).optional(),
        search: z.string().optional(),
      }),
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
        const logs = [
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

        let filtered = logs

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
    }),

    list_policies: tool({
      description: 'Get existing RLS policies for provided schemas.',
      inputSchema: z.object({
        schemas: z.array(z.string()).describe('The schema names to get the policies for'),
      }),
      execute: async ({ schemas }: { schemas: string[] }) => {
        // Deterministic: In public schema, only 'customers' has an existing SELECT policy
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
    }),
  }
}
