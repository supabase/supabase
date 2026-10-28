import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { getTools } from './index'
import { getMcpTools } from './mcp-tools'

const state = vi.hoisted(() => ({ isPlatform: true }))

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  const mocked = { ...actual }
  Object.defineProperty(mocked, 'IS_PLATFORM', { get: () => state.isPlatform, enumerable: true })
  return mocked
})

vi.mock('./mcp-tools', () => ({ getMcpTools: vi.fn() }))

const MCP_TOOL_NAMES = [
  'list_tables',
  'list_extensions',
  'list_edge_functions',
  'list_branches',
  'search_docs',
  'get_advisors',
  'query_logs',
]

const BASE_PARAMS = {
  projectRef: 'abcdefghijklmnopqrst',
  connectionString: 'postgresql://localhost',
  authorization: 'Bearer token',
  aiOptInLevel: 'schema_and_log_and_data' as const,
  accessToken: 'access-token',
  signal: new AbortController().signal,
}

const SHARED = ['execute_sql', 'load_knowledge', 'rename_chat']
const FALLBACK = ['getEdgeFunctionKnowledge', 'getFunctions', 'getRlsKnowledge', 'getSchemaTables']
const SUPPORT = ['escalate_to_human', 'resolve_support_conversation']
const PLATFORM = [
  'deploy_edge_function',
  'get_report',
  'list_databases',
  'list_policies',
  'list_reports',
  'update_opt_in_level',
]
const EXPLORER = [
  'create_notebook',
  'delete_notebook',
  'get_notebook',
  'list_notebooks',
  'render_page',
  'run_notebook',
  'update_notebook',
]
const INCIDENTS = ['get_active_incidents']

const sorted = (...groups: string[][]) => groups.flat().sort()

describe('ai/tools getTools availability', () => {
  beforeEach(() => {
    vi.mocked(getMcpTools).mockResolvedValue(
      Object.fromEntries(
        MCP_TOOL_NAMES.map((name) => [
          name,
          { description: 'x', inputSchema: z.object({}), execute: async () => ({}) },
        ])
      ) as never
    )
  })

  const cases = [
    // [isPlatform, isExplorerEnabled, supportMode, hasBaseUrl, expected]
    [false, false, false, false, sorted(SHARED, FALLBACK)],
    [false, false, false, true, sorted(SHARED, FALLBACK)],
    [false, false, true, false, sorted(SHARED, FALLBACK)],
    [false, false, true, true, sorted(SHARED, FALLBACK)],
    [false, true, false, false, sorted(SHARED, FALLBACK)],
    [false, true, false, true, sorted(SHARED, FALLBACK)],
    [false, true, true, false, sorted(SHARED, FALLBACK)],
    [false, true, true, true, sorted(SHARED, FALLBACK)],
    [true, false, false, false, sorted(SHARED, PLATFORM, MCP_TOOL_NAMES)],
    [true, false, false, true, sorted(SHARED, PLATFORM, MCP_TOOL_NAMES, INCIDENTS)],
    [true, false, true, false, sorted(SHARED, PLATFORM, MCP_TOOL_NAMES, SUPPORT)],
    [true, false, true, true, sorted(SHARED, PLATFORM, MCP_TOOL_NAMES, SUPPORT, INCIDENTS)],
    [true, true, false, false, sorted(SHARED, PLATFORM, MCP_TOOL_NAMES, EXPLORER)],
    [true, true, false, true, sorted(SHARED, PLATFORM, MCP_TOOL_NAMES, EXPLORER, INCIDENTS)],
    [true, true, true, false, sorted(SHARED, PLATFORM, MCP_TOOL_NAMES, EXPLORER, SUPPORT)],
    [
      true,
      true,
      true,
      true,
      sorted(SHARED, PLATFORM, MCP_TOOL_NAMES, EXPLORER, SUPPORT, INCIDENTS),
    ],
  ] as const

  it.each(cases)(
    'IS_PLATFORM=%s isExplorerEnabled=%s supportMode=%s baseUrl=%s',
    async (isPlatform, isExplorerEnabled, supportMode, hasBaseUrl, expected) => {
      state.isPlatform = isPlatform

      const tools = await getTools({
        ...BASE_PARAMS,
        isExplorerEnabled,
        supportMode,
        baseUrl: hasBaseUrl ? 'https://supabase.com/dashboard' : undefined,
      })

      expect(Object.keys(tools).sort()).toEqual(expected)
    }
  )
})
