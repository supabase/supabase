import { components } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { getNotebookTools } from './notebook-tools'
import type { AgentNotebook } from '@/data/content/notebooks/notebook-schema'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

const VALID_AGENT_CONTENT: AgentNotebook = {
  schema_version: 1,
  cells: [
    { _tag: 'markdown_cell', text: '# Signup funnel' },
    {
      _tag: 'database_cell',
      sql: 'select * from auth.users limit 100',
      row_limit: 100,
    },
    {
      _tag: 'log_cell',
      sql: "select timestamp, event_message from edge_logs where source = 'edge_logs' limit 10",
      time_range: { _tag: 'relative_time_range', unit: 'hour', amount: 1 },
    },
  ],
}

type GetUserContentByIdResponse = components['schemas']['GetUserContentByIdResponse']
type GetUserContentResponse = components['schemas']['GetUserContentResponse']

const NOTEBOOK_CONTENT = {
  schema_version: 1,
  cells: [
    { _tag: 'markdown_cell', id: 'cell-1', text: '# Signup funnel' },
    {
      _tag: 'database_cell',
      id: 'cell-2',
      sql: 'select * from auth.users limit 100',
      row_limit: 100,
    },
    {
      _tag: 'log_cell',
      id: 'cell-3',
      sql: 'select timestamp, event_message from edge_logs limit 10',
      time_range: { _tag: 'relative_time_range', unit: 'hour', amount: 1 },
    },
  ],
}

describe('ai/tools/notebook-tools', () => {
  describe('getNotebookTools', () => {
    it('should return list_notebooks, get_notebook, create_notebook, and update_notebook tools', () => {
      const tools = getNotebookTools()

      expect(Object.keys(tools)).toEqual([
        'list_notebooks',
        'get_notebook',
        'create_notebook',
        'update_notebook',
      ])
    })

    it('should not require approval to read notebooks', () => {
      const tools = getNotebookTools()

      expect(tools.list_notebooks.needsApproval).toBeUndefined()
      expect(tools.get_notebook.needsApproval).toBeUndefined()
    })

    it('should require approval to create or update a notebook', () => {
      const tools = getNotebookTools()

      expect(tools.create_notebook.needsApproval).toBe(true)
      expect(tools.update_notebook.needsApproval).toBe(true)
    })
  })

  describe('list_notebooks', () => {
    it('should list notebooks with summary fields, forwarding the authorization header and cursor', async () => {
      let capturedRequest: Request | undefined

      addAPIMock({
        method: 'get',
        path: '/platform/projects/:ref/content',
        response: ({ request }) => {
          capturedRequest = request
          return HttpResponse.json<GetUserContentResponse>({
            cursor: 'next-page',
            data: [
              {
                id: 'notebook-1',
                name: 'Signup funnel',
                description: undefined,
                visibility: 'project',
                favorite: false,
                folder_id: null,
                inserted_at: '2026-01-01T00:00:00.000Z',
                updated_at: '2026-01-01T00:00:00.000Z',
                owner_id: 1,
                owner: { id: 1, username: 'test' },
                updated_by: { id: 1, username: 'test' },
                project_id: 1,
                type: 'notebook',
                content: NOTEBOOK_CONTENT,
              },
            ],
          } as unknown as GetUserContentResponse)
        },
      })

      const tools = getNotebookTools({
        projectRef: 'test-project',
        authorization: 'Bearer token',
      })
      if (!tools.list_notebooks.execute) throw new Error('execute is undefined')

      const result = await tools.list_notebooks.execute(
        { limit: 20, cursor: 'prev-page' },
        { toolCallId: 'test', messages: [] }
      )

      expect(capturedRequest?.headers.get('authorization')).toBe('Bearer token')
      const url = new URL(capturedRequest!.url)
      expect(url.pathname).toContain('/projects/test-project/content')
      expect(url.searchParams.get('type')).toBe('notebook')
      expect(url.searchParams.get('limit')).toBe('20')
      expect(url.searchParams.get('cursor')).toBe('prev-page')

      expect(result).toEqual({
        notebooks: [
          {
            id: 'notebook-1',
            name: 'Signup funnel',
            description: undefined,
            visibility: 'project',
            updated_at: '2026-01-01T00:00:00.000Z',
            cell_count: 3,
          },
        ],
        cursor: 'next-page',
      })
    })

    it('should forward sort_by as the content API sort_by query param', async () => {
      let capturedRequest: Request | undefined

      addAPIMock({
        method: 'get',
        path: '/platform/projects/:ref/content',
        response: ({ request }) => {
          capturedRequest = request
          return HttpResponse.json<GetUserContentResponse>({
            cursor: undefined,
            data: [],
          } as unknown as GetUserContentResponse)
        },
      })

      const tools = getNotebookTools({ projectRef: 'test-project' })
      if (!tools.list_notebooks.execute) throw new Error('execute is undefined')

      await tools.list_notebooks.execute(
        { limit: 1, sort_by: 'inserted_at' },
        { toolCallId: 'test', messages: [] }
      )

      const url = new URL(capturedRequest!.url)
      expect(url.searchParams.get('sort_by')).toBe('inserted_at')
    })
  })

  describe('get_notebook', () => {
    it('should resolve markdown text and SQL for every cell', async () => {
      addAPIMock({
        method: 'get',
        path: '/platform/projects/:ref/content/item/:id',
        response: () =>
          HttpResponse.json<GetUserContentByIdResponse>({
            id: 'notebook-1',
            name: 'Signup funnel',
            description: undefined,
            visibility: 'project',
            favorite: false,
            folder_id: null,
            inserted_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-01T00:00:00.000Z',
            owner_id: 1,
            project_id: 1,
            type: 'notebook',
            content: NOTEBOOK_CONTENT,
          } as unknown as GetUserContentByIdResponse),
      })

      const tools = getNotebookTools({ projectRef: 'test-project' })
      if (!tools.get_notebook.execute) throw new Error('execute is undefined')

      const result = await tools.get_notebook.execute(
        { id: 'notebook-1' },
        { toolCallId: 'test', messages: [] }
      )

      expect(result).toEqual({
        id: 'notebook-1',
        name: 'Signup funnel',
        description: undefined,
        visibility: 'project',
        cells: [
          { _tag: 'markdown_cell', id: 'cell-1', text: '# Signup funnel' },
          {
            _tag: 'database_cell',
            id: 'cell-2',
            row_limit: 100,
            sql: 'select * from auth.users limit 100',
          },
          {
            _tag: 'log_cell',
            id: 'cell-3',
            time_range: { _tag: 'relative_time_range', unit: 'hour', amount: 1 },
            sql: 'select timestamp, event_message from edge_logs limit 10',
          },
        ],
      })
    })

    it('should throw when the content id is not a notebook', async () => {
      addAPIMock({
        method: 'get',
        path: '/platform/projects/:ref/content/item/:id',
        response: () =>
          HttpResponse.json<GetUserContentByIdResponse>({
            id: 'snippet-1',
            name: 'My query',
            description: undefined,
            visibility: 'user',
            favorite: false,
            folder_id: null,
            inserted_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-01T00:00:00.000Z',
            owner_id: 1,
            project_id: 1,
            type: 'sql',
            content: { content_id: 'snippet-1', sql: 'select 1', schema_version: '1' },
          }),
      })

      const tools = getNotebookTools({ projectRef: 'test-project' })
      if (!tools.get_notebook.execute) throw new Error('execute is undefined')

      await expect(
        tools.get_notebook.execute({ id: 'snippet-1' }, { toolCallId: 'test', messages: [] })
      ).rejects.toThrow('is not a notebook')
    })

    it('should throw when the content id does not exist', async () => {
      addAPIMock({
        method: 'get',
        path: '/platform/projects/:ref/content/item/:id',
        response: () => HttpResponse.json<APIErrorBody>({ message: 'Not found' }, { status: 404 }),
      })

      const tools = getNotebookTools({ projectRef: 'test-project' })
      if (!tools.get_notebook.execute) throw new Error('execute is undefined')

      await expect(
        tools.get_notebook.execute({ id: 'missing' }, { toolCallId: 'test', messages: [] })
      ).rejects.toThrow()
    })
  })

  describe('create_notebook', () => {
    it('should reject content whose cells carry an agent-supplied id', () => {
      const tools = getNotebookTools()
      const schema = tools.create_notebook.inputSchema

      if (!('safeParse' in schema)) throw new Error('inputSchema has no safeParse')

      const result = schema.safeParse({
        name: 'Signup funnel',
        content: {
          schema_version: 1,
          cells: [{ _tag: 'markdown_cell', id: 'cell-1', text: '# Signup funnel' }],
        },
      })

      expect(result.success).toBe(false)
    })

    it('should accept a valid id-less notebook with all three cell types', () => {
      const tools = getNotebookTools()
      const schema = tools.create_notebook.inputSchema

      if (!('safeParse' in schema)) throw new Error('inputSchema has no safeParse')

      const result = schema.safeParse({
        name: 'Signup funnel',
        description: 'Tracks signups over time',
        content: VALID_AGENT_CONTENT,
      })

      expect(result.success).toBe(true)
    })

    it('should PUT a notebook with promoted SQL and no cell ids', async () => {
      let sentBody: Record<string, unknown> | undefined
      addAPIMock({
        method: 'put',
        path: '/platform/projects/:ref/content',
        response: async ({ request }) => {
          sentBody = (await request.json()) as Record<string, unknown>
          return new HttpResponse(null)
        },
      })

      const tools = getNotebookTools({ projectRef: 'test-project' })
      if (!tools.create_notebook.execute) throw new Error('execute is undefined')

      await tools.create_notebook.execute(
        { name: 'Signup funnel', content: VALID_AGENT_CONTENT },
        { toolCallId: 'test', messages: [] }
      )

      expect(sentBody?.type).toBe('notebook')
      expect(sentBody?.visibility).toBe('project')

      const content = sentBody?.content as { cells: Array<Record<string, unknown>> }
      for (const cell of content.cells) {
        expect(cell).not.toHaveProperty('id')
      }

      const [, databaseCell, logCell] = content.cells
      expect(databaseCell.sql).toBe('select * from auth.users limit 100')
      expect(logCell.sql).toBe(
        "select timestamp, event_message from edge_logs where source = 'edge_logs' limit 10"
      )
    })

    it('should return the id it generated and sent, since a successful create response has no body', async () => {
      let sentBody: Record<string, unknown> | undefined
      addAPIMock({
        method: 'put',
        path: '/platform/projects/:ref/content',
        response: async ({ request }) => {
          sentBody = (await request.json()) as Record<string, unknown>
          return new HttpResponse(null)
        },
      })

      const tools = getNotebookTools({ projectRef: 'test-project' })
      if (!tools.create_notebook.execute) throw new Error('execute is undefined')

      const result = await tools.create_notebook.execute(
        { name: 'Signup funnel', content: VALID_AGENT_CONTENT },
        { toolCallId: 'test', messages: [] }
      )

      expect(typeof sentBody?.id).toBe('string')
      expect(result).toEqual({ id: sentBody?.id, name: 'Signup funnel' })
    })
  })

  describe('update_notebook', () => {
    function mockGetNotebook() {
      addAPIMock({
        method: 'get',
        path: '/platform/projects/:ref/content/item/:id',
        response: () =>
          HttpResponse.json<GetUserContentByIdResponse>({
            id: 'notebook-1',
            name: 'Signup funnel',
            description: undefined,
            visibility: 'project',
            favorite: false,
            folder_id: null,
            inserted_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-01T00:00:00.000Z',
            owner_id: 1,
            project_id: 1,
            type: 'notebook',
            content: NOTEBOOK_CONTENT,
          } as unknown as GetUserContentByIdResponse),
      })
    }

    it('should re-fetch the notebook, apply the operations, and PUT the resolved content', async () => {
      mockGetNotebook()
      let sentBody: Record<string, unknown> | undefined
      addAPIMock({
        method: 'put',
        path: '/platform/projects/:ref/content',
        response: async ({ request }) => {
          sentBody = (await request.json()) as Record<string, unknown>
          return new HttpResponse(null)
        },
      })

      const tools = getNotebookTools({ projectRef: 'test-project' })
      if (!tools.update_notebook.execute) throw new Error('execute is undefined')

      const result = await tools.update_notebook.execute(
        {
          id: 'notebook-1',
          operations: [
            { _tag: 'delete_cell', cell_id: 'cell-3' },
            {
              _tag: 'insert_cell',
              after_cell_id: 'cell-1',
              cell: { _tag: 'markdown_cell', text: '# New section' },
            },
          ],
        },
        { toolCallId: 'test', messages: [] }
      )

      expect(sentBody?.id).toBe('notebook-1')
      expect(sentBody?.type).toBe('notebook')

      const content = sentBody?.content as { cells: Array<Record<string, unknown>> }
      expect(content.cells.map((cell) => cell.id ?? cell.text)).toEqual([
        'cell-1',
        '# New section',
        'cell-2',
      ])
      expect(content.cells[2].sql).toBe('select * from auth.users limit 100')
      expect(result).toEqual({ id: 'notebook-1', name: 'Signup funnel' })
    })

    it('should throw a descriptive error instead of PUTting when an operation targets an unknown cell id', async () => {
      mockGetNotebook()

      const tools = getNotebookTools({ projectRef: 'test-project' })
      if (!tools.update_notebook.execute) throw new Error('execute is undefined')

      await expect(
        tools.update_notebook.execute(
          { id: 'notebook-1', operations: [{ _tag: 'delete_cell', cell_id: 'missing-cell' }] },
          { toolCallId: 'test', messages: [] }
        )
      ).rejects.toThrow('No cell with id "missing-cell"')
    })
  })
})
