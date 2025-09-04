import { tool, type ToolSet } from 'ai'
import { z } from 'zod'

/**
 * Deterministic mock implementations of MCP/platform tools for evals.
 * These mirror tool names used in prompts so the model can call them,
 * but return stable, static data for repeatable tests.
 */
export function getEvalMockTools(): ToolSet {
  return {
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
              columns: [
                { name: 'id', data_type: 'bigint' },
                { name: 'user_id', data_type: 'uuid' },
                { name: 'title', data_type: 'text' },
              ],
            },
            {
              name: 'customers',
              columns: [
                { name: 'id', data_type: 'uuid' },
                { name: 'tenant_id', data_type: 'uuid' },
                { name: 'email', data_type: 'text' },
              ],
            },
            {
              name: 'projects',
              columns: [
                { name: 'id', data_type: 'uuid' },
                { name: 'organization_id', data_type: 'uuid' },
                { name: 'name', data_type: 'text' },
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
        return [{ name: 'hello-world' }, { name: 'select-from-table-with-auth-rls' }]
      },
    }),

    get_advisors: tool({
      description: 'Returns advisory notices for the project (mocked).',
      inputSchema: z.object({
        type: z.enum(['security', 'performance']).optional(),
      }),
      execute: async ({ type }: { type?: 'security' | 'performance' }) => {
        if (type === 'security') {
          return [
            {
              id: '0016_materialized_view_in_api',
              level: 'warning',
              message:
                'Materialized views in API schema can bypass RLS. Move them to private schema.',
              remediationUrl:
                'https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0016_materialized_view_in_api',
            },
          ]
        }
        return []
      },
    }),

    list_policies: tool({
      description: 'Get existing RLS policies for provided schemas.',
      inputSchema: z.object({
        schemas: z.array(z.string()).describe('The schema names to get the policies for'),
      }),
      execute: async ({ schemas }: { schemas: string[] }) => {
        // Keep simple and deterministic: no existing policies
        const effectiveSchemas = schemas?.length ? schemas : ['public']
        return effectiveSchemas
          .map((s) => `No existing policies in schema ${s}. You can create new policies as needed.`)
          .join('\n')
      },
    }),
  }
}
