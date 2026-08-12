import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getMockTools, MOCK_NOTEBOOKS_DATA } from './mock-tools'
import { getNotebookTools } from './notebook-tools'
import type { AgentNotebook } from '@/data/content/notebooks/notebook-schema'
import { createInProcessSupabaseMCPClient } from '@/lib/ai/supabase-mcp'

// The one real tool in the eval harness (search_docs) is sourced from an
// in-process MCP client. Mock that client so this test stays hermetic and
// guards the wiring, not a live connection.
vi.mock('@/lib/ai/supabase-mcp', () => ({
  createInProcessSupabaseMCPClient: vi.fn(),
}))

const SEARCH_DOCS = { description: 'search the docs' }

describe('ai/tools/mock-tools getMockTools', () => {
  let close: ReturnType<typeof vi.fn>
  let tools: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    close = vi.fn().mockResolvedValue(undefined)
    tools = vi.fn().mockResolvedValue({ search_docs: SEARCH_DOCS })
    vi.mocked(createInProcessSupabaseMCPClient).mockResolvedValue({ tools, close } as any)
  })

  it('sources the real search_docs from the in-process MCP server alongside the deterministic mocks', async () => {
    const result = await getMockTools(undefined, new AbortController().signal)

    expect(createInProcessSupabaseMCPClient).toHaveBeenCalledTimes(1)
    // The real tool, wired through from the MCP client
    expect(result).toHaveProperty('search_docs', SEARCH_DOCS)
    // A couple of the deterministic mocks, to confirm the merge
    expect(result).toHaveProperty('list_tables')
    expect(result).toHaveProperty('query_logs')
  })

  // This is the regression guard: if the eval's MCP wiring breaks (contract
  // drift, or a refactor that stops sourcing search_docs — e.g. the future
  // AI-897 removal of the in-process client), fail loudly in normal CI instead
  // of only surfacing during an opt-in Braintrust eval run.
  it('throws a clear error when the MCP server does not expose search_docs', async () => {
    tools.mockResolvedValueOnce({})

    await expect(getMockTools(undefined, new AbortController().signal)).rejects.toThrow(
      'search_docs tool not available from MCP server'
    )
  })

  it('closes the MCP client when the caller aborts the signal', async () => {
    const controller = new AbortController()

    await getMockTools(undefined, controller.signal)
    // Connection stays open until generation ends (search_docs runs during it)
    expect(close).not.toHaveBeenCalled()

    controller.abort()
    await Promise.resolve()
    expect(close).toHaveBeenCalledTimes(1)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('notebook tools', () => {
    const AUTH_HEALTH_NOTEBOOK_ID = MOCK_NOTEBOOKS_DATA[0].id
    const EDGE_FUNCTION_NOTEBOOK_ID = MOCK_NOTEBOOKS_DATA[1].id

    it('list_notebooks reflects the two seeded fixtures', async () => {
      const mockTools = await getMockTools(undefined, new AbortController().signal)
      if (!mockTools.list_notebooks.execute) throw new Error('execute is undefined')

      const result = await mockTools.list_notebooks.execute(
        { limit: 20 },
        { toolCallId: 'test', messages: [] }
      )

      expect(result.notebooks.map((notebook) => notebook.name)).toEqual([
        'Auth health check',
        'Edge function error triage',
      ])
      expect(result.notebooks.map((notebook) => notebook.cell_count)).toEqual([3, 2])
      expect(result.notebooks[1].description).toBeUndefined()
      expect(result.cursor).toBeUndefined()
    })

    it('get_notebook resolves cells in order and rejects an unknown id', async () => {
      const mockTools = await getMockTools(undefined, new AbortController().signal)
      if (!mockTools.get_notebook.execute) throw new Error('execute is undefined')

      const result = await mockTools.get_notebook.execute(
        { id: AUTH_HEALTH_NOTEBOOK_ID },
        { toolCallId: 'test', messages: [] }
      )

      expect(result.cells.map((cell) => cell._tag)).toEqual([
        'markdown_cell',
        'database_cell',
        'log_cell',
      ])

      const [, databaseCell, logCell] = result.cells
      if (databaseCell._tag !== 'database_cell') throw new Error('expected database_cell')
      if (logCell._tag !== 'log_cell') throw new Error('expected log_cell')

      expect(databaseCell.sql).toContain('signups')
      expect(databaseCell.row_limit).toBe(30)
      expect(logCell.time_range).toEqual({ _tag: 'relative_time_range', unit: 'hour', amount: 1 })

      await expect(
        mockTools.get_notebook.execute(
          { id: 'unknown-notebook-id' },
          { toolCallId: 'test', messages: [] }
        )
      ).rejects.toThrow(/not found/i)
    })

    it('overrides create_notebook needsApproval to false, unlike the real tool', async () => {
      const mockTools = await getMockTools(undefined, new AbortController().signal)

      expect(getNotebookTools().create_notebook.needsApproval).toBe(true)
      expect(mockTools.create_notebook.needsApproval).toBe(false)
    })

    it('create_notebook stores a new notebook visible via get_notebook and list_notebooks', async () => {
      const mockTools = await getMockTools(undefined, new AbortController().signal)
      if (!mockTools.create_notebook.execute) throw new Error('execute is undefined')
      if (!mockTools.get_notebook.execute) throw new Error('execute is undefined')
      if (!mockTools.list_notebooks.execute) throw new Error('execute is undefined')

      const content: AgentNotebook = {
        schema_version: 1,
        cells: [
          { _tag: 'markdown_cell', text: '# New notebook' },
          { _tag: 'database_cell', sql: 'select 1', row_limit: 10 },
        ],
      }

      const created = await mockTools.create_notebook.execute(
        { name: 'New notebook', content },
        { toolCallId: 'test', messages: [] }
      )
      expect(created).toEqual({ id: expect.any(String), name: 'New notebook' })

      const fetched = await mockTools.get_notebook.execute(
        { id: created.id },
        { toolCallId: 'test', messages: [] }
      )
      expect(fetched.cells).toHaveLength(2)
      expect(fetched.cells.every((cell) => typeof cell.id === 'string')).toBe(true)

      const listed = await mockTools.list_notebooks.execute(
        { limit: 20 },
        { toolCallId: 'test', messages: [] }
      )
      expect(listed.notebooks).toHaveLength(3)
      const newEntry = listed.notebooks.find((notebook) => notebook.id === created.id)
      expect(newEntry?.cell_count).toBe(2)
    })

    it('overrides update_notebook needsApproval to false, unlike the real tool', async () => {
      const mockTools = await getMockTools(undefined, new AbortController().signal)

      expect(getNotebookTools().update_notebook.needsApproval).toBe(true)
      expect(mockTools.update_notebook.needsApproval).toBe(false)
    })

    it('update_notebook inserts and deletes cells, and list_notebooks reflects the new cell count', async () => {
      const mockTools = await getMockTools(undefined, new AbortController().signal)
      if (!mockTools.get_notebook.execute) throw new Error('execute is undefined')
      if (!mockTools.update_notebook.execute) throw new Error('execute is undefined')
      if (!mockTools.list_notebooks.execute) throw new Error('execute is undefined')

      const before = await mockTools.get_notebook.execute(
        { id: AUTH_HEALTH_NOTEBOOK_ID },
        { toolCallId: 'test', messages: [] }
      )
      const [markdownCell, , logCell] = before.cells

      const result = await mockTools.update_notebook.execute(
        {
          id: AUTH_HEALTH_NOTEBOOK_ID,
          operations: [
            {
              _tag: 'insert_cell',
              after_cell_id: markdownCell.id,
              cell: { _tag: 'database_cell', sql: 'select 1', row_limit: 10 },
            },
            { _tag: 'delete_cell', cell_id: logCell.id },
          ],
        },
        { toolCallId: 'test', messages: [] }
      )
      expect(result).toEqual({ id: AUTH_HEALTH_NOTEBOOK_ID, name: 'Auth health check' })

      const after = await mockTools.get_notebook.execute(
        { id: AUTH_HEALTH_NOTEBOOK_ID },
        { toolCallId: 'test', messages: [] }
      )
      expect(after.cells.map((cell) => cell._tag)).toEqual([
        'markdown_cell',
        'database_cell',
        'database_cell',
      ])

      const listed = await mockTools.list_notebooks.execute(
        { limit: 20 },
        { toolCallId: 'test', messages: [] }
      )
      const entry = listed.notebooks.find((notebook) => notebook.id === AUTH_HEALTH_NOTEBOOK_ID)
      expect(entry?.cell_count).toBe(3)
    })

    it('update_notebook rejects an unknown cell_id without mutating the notebook', async () => {
      const mockTools = await getMockTools(undefined, new AbortController().signal)
      if (!mockTools.get_notebook.execute) throw new Error('execute is undefined')
      if (!mockTools.update_notebook.execute) throw new Error('execute is undefined')

      await expect(
        mockTools.update_notebook.execute(
          {
            id: EDGE_FUNCTION_NOTEBOOK_ID,
            operations: [{ _tag: 'delete_cell', cell_id: 'does-not-exist' }],
          },
          { toolCallId: 'test', messages: [] }
        )
      ).rejects.toThrow(/does-not-exist/)

      const after = await mockTools.get_notebook.execute(
        { id: EDGE_FUNCTION_NOTEBOOK_ID },
        { toolCallId: 'test', messages: [] }
      )
      expect(after.cells.map((cell) => cell._tag)).toEqual(['markdown_cell', 'log_cell'])
    })

    it('is isolated per call to getMockTools', async () => {
      const firstCall = await getMockTools(undefined, new AbortController().signal)
      if (!firstCall.create_notebook.execute) throw new Error('execute is undefined')

      await firstCall.create_notebook.execute(
        {
          name: 'Ephemeral notebook',
          content: { schema_version: 1, cells: [{ _tag: 'markdown_cell', text: 'hi' }] },
        },
        { toolCallId: 'test', messages: [] }
      )

      const secondCall = await getMockTools(undefined, new AbortController().signal)
      if (!secondCall.list_notebooks.execute) throw new Error('execute is undefined')

      const result = await secondCall.list_notebooks.execute(
        { limit: 20 },
        { toolCallId: 'test', messages: [] }
      )
      expect(result.notebooks.map((notebook) => notebook.name)).toEqual([
        'Auth health check',
        'Edge function error triage',
      ])
    })
  })
})
