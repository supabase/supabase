import assert from 'node:assert'
import { tool, type ToolExecutionOptions, type ToolSet } from 'ai'
import { z } from 'zod'

import { getStudioTools } from '../tools/studio-tools'
import { getNotebookTools } from './notebook-tools'
import {
  applyNotebookOperations,
  describeNotebookOperationError,
  type NotebookOperation,
  type OperationResultCell,
} from '@/data/content/notebooks/notebook-operations'
import type {
  AgentNotebook,
  CellWire,
  NotebookWire,
} from '@/data/content/notebooks/notebook-schema'
import { createInProcessSupabaseMCPClient } from '@/lib/ai/supabase-mcp'

const listTablesInputSchema = z.object({
  schemas: z.array(z.string()).describe('The schema names to list.'),
})

const getAdvisorsInputSchema = z.object({
  type: z.enum(['security', 'performance']).optional(),
})

const queryLogsInputSchema = z.object({
  sql: z.string().min(1),
  iso_timestamp_start: z.string().optional(),
  iso_timestamp_end: z.string().optional(),
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
  { name: 'pg_cron', schema: 'pg_catalog', installed_version: '1.6.4' },
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
      'https://supabase.com/docs/guides/monitoring-and-debugging/advisors?queryGroups=lint&lint=0016_materialized_view_in_api',
  },
  {
    id: '0031_functions_no_rls_guard',
    level: 'notice',
    category: 'security',
    message: 'Function api.health_check should verify auth context before querying tables.',
    remediationUrl:
      'https://supabase.com/docs/guides/monitoring-and-debugging/advisors?queryGroups=lint&lint=0031_functions_no_rls_guard',
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

type MockNotebook = {
  id: string
  name: string
  description?: string
  visibility: 'project'
  updated_at: string
  content: NotebookWire
}

const MOCK_NOTEBOOK_TIMESTAMP = '2024-06-20T14:30:00Z'

export const MOCK_NOTEBOOKS_DATA: MockNotebook[] = [
  {
    id: '6f1d3a54-8c2b-4d19-9f60-2a7b5c8e1d40',
    name: 'Auth health check',
    description: 'Daily signups plus any auth errors from the last hour.',
    visibility: 'project',
    updated_at: MOCK_NOTEBOOK_TIMESTAMP,
    content: {
      schema_version: 1,
      cells: [
        {
          _tag: 'markdown_cell',
          _id: 'c1a0b8e2-3f47-4a52-9d18-6b0c4e2f7a91',
          text: '# Auth health\n\nRun this daily: signup volume, then anything the auth service logged as an error.',
        },
        {
          _tag: 'database_cell',
          _id: 'd2b1c9f3-4a58-4b63-8e29-7c1d5f3a8b02',
          title: 'Signups per day',
          sql: "select date_trunc('day', created_at) as day, count(*) as signups\nfrom auth.users\ngroup by day\norder by day desc",
          row_limit: 30,
          chart: {
            x_column: 'day',
            y_series: ['signups'],
            cumulative: false,
            type: 'line',
            scale: 'log',
            show_labels: false,
          },
        },
        {
          _tag: 'log_cell',
          _id: 'e3c2d0a4-5b69-4c74-9f3a-8d2e6a4b9c13',
          title: 'Auth errors',
          sql: "select timestamp, event_message\nfrom auth_logs\nwhere event_message like '%error%'\norder by timestamp desc",
          time_range: { _tag: 'relative_time_range', unit: 'hour', amount: 1 },
        },
      ],
    },
  },
  {
    id: '9a4e7b21-6d0c-4f38-8b57-3e1f9c6a2d84',
    name: 'Edge function error triage',
    visibility: 'project',
    updated_at: MOCK_NOTEBOOK_TIMESTAMP,
    content: {
      schema_version: 1,
      cells: [
        {
          _tag: 'markdown_cell',
          _id: 'f4d3e1b5-7c80-4d85-8a4b-9e3f7b5c0d24',
          text: '# Edge function errors\n\nFailures from the last day, newest first.',
        },
        {
          _tag: 'log_cell',
          _id: '0a5e4f2c-8d91-4e96-9b5c-af408c6d1e35',
          title: 'hello-world failures',
          sql: "select timestamp, event_message\nfrom function_edge_logs\nwhere event_message like '%TypeError%'\norder by timestamp desc",
          time_range: { _tag: 'relative_time_range', unit: 'day', amount: 1 },
        },
      ],
    },
  },
]

function createMockedStudioTools() {
  const studioTools = getStudioTools()

  return Object.fromEntries(
    Object.entries(studioTools).map(([name, baseTool]) => {
      // Always mock execute_sql and deploy_edge_function with needsApproval disabled
      if (name === 'execute_sql') {
        return [name, { ...baseTool, needsApproval: false, execute: async () => [] as unknown[] }]
      }
      if (name === 'deploy_edge_function') {
        return [
          name,
          { ...baseTool, needsApproval: false, execute: async () => ({ success: true }) },
        ]
      }
      if (typeof baseTool.execute === 'function') {
        return [name, baseTool]
      }

      return [
        name,
        { ...baseTool, execute: async () => ({ status: 'Tool call mocked successfully.' }) },
      ]
    })
  ) as typeof studioTools
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

function createMockQueryLogsTool() {
  return tool({
    description:
      'Runs a read-only SQL query against recent project logs for debugging or health checks (mocked).',
    inputSchema: queryLogsInputSchema,
    // Deterministic mock: returns static log data regardless of the SQL passed.
    execute: async () => MOCK_LOGS_DATA,
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

function createMockNotebookStore() {
  const notebooks = new Map(MOCK_NOTEBOOKS_DATA.map((notebook) => [notebook.id, notebook]))

  let notebookCount = 0
  let cellCount = 0

  const assignCellIds = (cells: OperationResultCell[]): CellWire[] =>
    cells.map((cell): CellWire => {
      if ('_id' in cell) return cell
      const _id = `mock-cell-${++cellCount}`
      switch (cell._tag) {
        case 'markdown_cell':
          return { ...cell, _id }
        case 'database_cell':
          return { ...cell, _id }
        case 'log_cell':
          return { ...cell, _id }
      }
    })

  return {
    list: () => [...notebooks.values()],
    get: (id: string) => notebooks.get(id),
    delete: (id: string) => notebooks.delete(id),
    create: ({
      name,
      description,
      content,
    }: {
      name: string
      description?: string
      content: AgentNotebook
    }) => {
      const notebook: MockNotebook = {
        id: `mock-notebook-${++notebookCount}`,
        name,
        description,
        visibility: 'project',
        updated_at: MOCK_NOTEBOOK_TIMESTAMP,
        content: { schema_version: content.schema_version, cells: assignCellIds(content.cells) },
      }
      notebooks.set(notebook.id, notebook)
      return notebook
    },
    replaceCells: (id: string, cells: OperationResultCell[]) => {
      const existing = notebooks.get(id)
      if (!existing) return
      notebooks.set(id, {
        ...existing,
        content: { schema_version: existing.content.schema_version, cells: assignCellIds(cells) },
      })
    },
  }
}

type MockNotebookStore = ReturnType<typeof createMockNotebookStore>

const MOCK_DATABASES_DATA = [
  {
    identifier: 'mock-project-ref',
    is_primary: true,
    region: 'us-east-1',
    status: 'ACTIVE_HEALTHY',
  },
  {
    identifier: 'mock-project-ref-replica-1',
    is_primary: false,
    region: 'us-west-1',
    status: 'ACTIVE_HEALTHY',
  },
]

// All notebook tools are real, locally-defined ai-SDK tools, so wrap them and
// override only execute/needsApproval — evals must validate the model's arguments
// against the exact schemas production uses (agentCellSchema's `.strict()` rejection of
// agent-authored cell ids, update_notebook's real operations schema, etc).
function createMockNotebookTools(store: MockNotebookStore) {
  const {
    list_databases,
    list_notebooks,
    get_notebook,
    run_notebook,
    create_notebook,
    update_notebook,
    delete_notebook,
  } = getNotebookTools({ aiOptInLevel: 'schema_and_log_and_data' })

  return {
    list_databases: {
      ...list_databases,
      execute: async (_args: object, _options: ToolExecutionOptions<unknown>) => ({
        databases: MOCK_DATABASES_DATA,
      }),
    },
    list_notebooks: {
      ...list_notebooks,
      execute: async (
        { limit = 20 }: { cursor?: string; limit?: number },
        _options: ToolExecutionOptions<unknown>
      ) => ({
        notebooks: store
          .list()
          .slice(0, limit)
          .map((notebook) => ({
            id: notebook.id,
            name: notebook.name,
            description: notebook.description,
            visibility: notebook.visibility,
            updated_at: notebook.updated_at,
            cell_count: notebook.content.cells.length,
          })),
        // The in-memory store never paginates: one page holds everything.
        cursor: undefined,
      }),
    },
    get_notebook: {
      ...get_notebook,
      execute: async ({ id }: { id: string }, _options: ToolExecutionOptions<unknown>) => {
        const notebook = store.get(id)
        if (!notebook) throw new Error(`Notebook ${id} not found.`)

        return {
          id: notebook.id,
          name: notebook.name,
          description: notebook.description,
          visibility: notebook.visibility,
          updated_at: notebook.updated_at,
          cells: notebook.content.cells,
        }
      },
    },
    run_notebook: {
      ...run_notebook,
      // The eval harness cannot answer approval gates. Nothing executes here; return a
      // deterministic empty result for each query cell in notebook order.
      needsApproval: false,
      execute: async (
        { id }: { id: string; expected_updated_at: string },
        _options: ToolExecutionOptions<unknown>
      ) => {
        const notebook = store.get(id)
        if (!notebook) throw new Error(`Notebook ${id} not found.`)

        return {
          id,
          name: notebook.name,
          updated_at: notebook.updated_at,
          cells: notebook.content.cells.flatMap((cell) =>
            cell._tag === 'markdown_cell'
              ? []
              : [
                  {
                    cell_id: cell._id,
                    title: cell.title?.trim() || 'Untitled query',
                    source: cell._tag === 'log_cell' ? ('logs' as const) : ('database' as const),
                    status: 'success' as const,
                    rows: [],
                  },
                ]
          ),
        }
      },
    },
    create_notebook: {
      ...create_notebook,
      // The eval harness can't answer an approval gate (generate-assistant-response
      // drops tool parts in 'approval-requested' state when cleaning messages), so the
      // real needsApproval: true would stall the eval turn — same override as
      // execute_sql/deploy_edge_function above. Because that gate is gone, this mock
      // deliberately skips acceptUntrustedSql/acceptUntrustedLogsSql promotion: nothing
      // here is executed or sent anywhere, cells are stored as plain data in a Map.
      needsApproval: false,
      execute: async (
        {
          name,
          description,
          content,
        }: {
          name: string
          description?: string
          content: AgentNotebook
        },
        _options: ToolExecutionOptions<unknown>
      ) => {
        const created = store.create({ name, description, content })
        return { id: created.id, name: created.name }
      },
    },
    update_notebook: {
      ...update_notebook,
      // Same reasoning as create_notebook's override above.
      needsApproval: false,
      // expected_updated_at is validated by the real inputSchema (spread above) but not
      // checked here: the in-memory store has no concurrent writers for the eval harness
      // to race against.
      execute: async (
        {
          id,
          operations,
        }: { id: string; expected_updated_at: string; operations: NotebookOperation[] },
        _options: ToolExecutionOptions<unknown>
      ) => {
        const notebook = store.get(id)
        if (!notebook) throw new Error(`Notebook ${id} not found.`)

        const result = applyNotebookOperations(notebook.content, operations)
        if (!result.success) throw new Error(describeNotebookOperationError(result.error))

        store.replaceCells(id, result.notebook.cells)
        return { id, name: notebook.name }
      },
    },
    delete_notebook: {
      ...delete_notebook,
      // Same reasoning as create_notebook's override above.
      needsApproval: false,
      execute: async ({ id }: { id: string }, _options: ToolExecutionOptions<unknown>) => {
        const notebook = store.get(id)
        if (!notebook) throw new Error(`Notebook ${id} not found.`)

        store.delete(id)
        return { id, name: notebook.name }
      },
    },
  }
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
export async function getMockTools(overrides: MockToolOverrides | undefined, signal: AbortSignal) {
  const mockedStudioTools = createMockedStudioTools()
  const notebookStore = createMockNotebookStore()

  // Every tool here is a deterministic mock except `search_docs`, which uses the
  // real implementation. We source it from an in-process MCP server directly
  // (rather than `getMcpTools`) so the eval harness stays hermetic and decoupled
  // from the assistant's transport gate (`USE_REMOTE_MCP`): the in-process server
  // needs no live remote endpoint or real access token. See AI-897 for how to
  // point evals at the remote MCP server instead.
  const mcpClient = await createInProcessSupabaseMCPClient({
    accessToken: 'mock-access-token',
    projectRef: 'mock-project-ref',
  })
  // The caller owns this signal and aborts it once generation is done, which
  // closes the client opened here (search_docs executes during generation, so
  // the connection must stay open until then).
  signal.addEventListener('abort', () => void mcpClient.close().catch(() => {}), { once: true })

  const { search_docs } = (await mcpClient.tools()) as ToolSet

  assert(search_docs, 'search_docs tool not available from MCP server')

  return {
    ...mockedStudioTools,
    search_docs,
    list_tables: createMockListTablesTool(overrides?.list_tables),
    list_extensions: createMockListExtensionsTool(),
    list_edge_functions: createMockListEdgeFunctionsTool(),
    get_advisors: createMockGetAdvisorsTool(),
    query_logs: createMockQueryLogsTool(),
    list_policies: createMockListPoliciesTool(),
    ...createMockNotebookTools(notebookStore),
  }
}
