import { components } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { sanitizeNotebookRunOutput, type NotebookRunOutput } from './notebook-run-output'
import {
  decodeNotebookToolError,
  encodeNotebookToolError,
  getNotebookTools,
  NotebookToolError,
} from './notebook-tools'
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
    { _tag: 'markdown_cell', _id: 'cell-1', text: '# Signup funnel' },
    {
      _tag: 'database_cell',
      _id: 'cell-2',
      sql: 'select * from auth.users limit 100',
      row_limit: 100,
    },
    {
      _tag: 'log_cell',
      _id: 'cell-3',
      sql: 'select timestamp, event_message from edge_logs limit 10',
      time_range: { _tag: 'relative_time_range', unit: 'hour', amount: 1 },
    },
  ],
}

describe('ai/tools/notebook-tools', () => {
  describe('getNotebookTools', () => {
    it('should return all notebook tools', () => {
      const tools = getNotebookTools()

      expect(Object.keys(tools)).toEqual([
        'list_notebooks',
        'get_notebook',
        'run_notebook',
        'create_notebook',
        'update_notebook',
      ])
    })

    it('should not require approval to read notebooks', () => {
      const tools = getNotebookTools()

      expect(tools.list_notebooks.needsApproval).toBeUndefined()
      expect(tools.get_notebook.needsApproval).toBeUndefined()
    })

    it('should require approval to run, create, or update a notebook', () => {
      const tools = getNotebookTools()

      expect(tools.run_notebook.needsApproval).toBe(true)
      expect(tools.create_notebook.needsApproval).toBe(true)
      expect(tools.update_notebook.needsApproval).toBe(true)
    })
  })

  describe('run_notebook', () => {
    function mockGetNotebook(content: unknown = NOTEBOOK_CONTENT) {
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
            content,
          } as unknown as GetUserContentByIdResponse),
      })
    }

    it('runs database and log cells in notebook order and skips markdown', async () => {
      mockGetNotebook()
      const executionOrder: string[] = []

      addAPIMock({
        method: 'post',
        path: '/platform/pg-meta/:ref/query',
        response: () => {
          executionOrder.push('database')
          return HttpResponse.json([{ email: 'person@example.com' }])
        },
      })
      addAPIMock({
        method: 'post',
        path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
        response: () => {
          executionOrder.push('logs')
          return HttpResponse.json<{ result: unknown[] }>({
            result: [{ event_message: 'started' }],
          })
        },
      })

      const tools = getNotebookTools({
        projectRef: 'test-project',
        connectionString: 'encrypted-connection-string',
        authorization: 'Bearer token',
        aiOptInLevel: 'schema_and_log_and_data',
      })
      if (!tools.run_notebook.execute) throw new Error('execute is undefined')

      const result = await tools.run_notebook.execute(
        {
          id: 'notebook-1',
          expected_updated_at: '2026-01-01T00:00:00.000Z',
        },
        { toolCallId: 'test', messages: [], context: {} }
      )

      expect(executionOrder).toEqual(['database', 'logs'])
      expect(result).toMatchObject({
        id: 'notebook-1',
        name: 'Signup funnel',
        cells: [
          {
            cell_id: 'cell-2',
            source: 'database',
            status: 'success',
            rows: [{ email: 'person@example.com' }],
          },
          {
            cell_id: 'cell-3',
            source: 'logs',
            status: 'success',
            rows: [{ event_message: 'started' }],
          },
        ],
      })
    })

    it('continues primary and log cells when the read replica lookup fails', async () => {
      mockGetNotebook({
        schema_version: 1,
        cells: [
          {
            _tag: 'database_cell',
            _id: 'primary-cell',
            title: 'Primary query',
            sql: 'select 1 as primary',
            row_limit: 100,
          },
          {
            _tag: 'database_cell',
            _id: 'replica-cell',
            title: 'Replica query',
            sql: 'select 1 as replica',
            row_limit: 100,
            database_identifier: 'replica-1',
          },
          {
            _tag: 'log_cell',
            _id: 'log-cell',
            title: 'Log query',
            sql: 'select event_message from edge_logs limit 10',
            time_range: { _tag: 'relative_time_range', unit: 'hour', amount: 1 },
          },
        ],
      })

      addAPIMock({
        method: 'get',
        path: '/platform/projects/:ref/databases',
        response: () =>
          HttpResponse.json<APIErrorBody>({ message: 'Replica lookup failed' }, { status: 500 }),
      })
      addAPIMock({
        method: 'post',
        path: '/platform/pg-meta/:ref/query',
        response: () => HttpResponse.json([{ primary: 1 }]),
      })
      addAPIMock({
        method: 'post',
        path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
        response: () =>
          HttpResponse.json<{ result: unknown[] }>({
            result: [{ event_message: 'started' }],
          }),
      })

      const tools = getNotebookTools({
        projectRef: 'test-project',
        connectionString: 'encrypted-connection-string',
        authorization: 'Bearer token',
        aiOptInLevel: 'schema_and_log_and_data',
      })
      if (!tools.run_notebook.execute) throw new Error('execute is undefined')

      const result = await tools.run_notebook.execute(
        {
          id: 'notebook-1',
          expected_updated_at: '2026-01-01T00:00:00.000Z',
        },
        { toolCallId: 'test', messages: [], context: {} }
      )

      expect(result).toEqual({
        id: 'notebook-1',
        name: 'Signup funnel',
        updated_at: '2026-01-01T00:00:00.000Z',
        cells: [
          {
            cell_id: 'primary-cell',
            title: 'Primary query',
            source: 'database',
            status: 'success',
            rows: [{ primary: 1 }],
          },
          {
            cell_id: 'replica-cell',
            title: 'Replica query',
            source: 'database',
            status: 'error',
            error: { message: 'Replica lookup failed' },
          },
          {
            cell_id: 'log-cell',
            title: 'Log query',
            source: 'logs',
            status: 'success',
            rows: [{ event_message: 'started' }],
          },
        ],
      })
    })

    it('rejects the run when the notebook changed after it was read', async () => {
      mockGetNotebook()
      const tools = getNotebookTools({ projectRef: 'test-project' })
      if (!tools.run_notebook.execute) throw new Error('execute is undefined')

      await expect(
        tools.run_notebook.execute(
          { id: 'notebook-1', expected_updated_at: '2025-12-31T00:00:00.000Z' },
          { toolCallId: 'test', messages: [], context: {} }
        )
      ).rejects.toMatchObject({
        metadata: { exposeToAssistant: true },
      })
    })

    it('shares each source result only at its permitted opt-in level', () => {
      const output: NotebookRunOutput = {
        id: 'notebook-1',
        name: 'Signup funnel',
        updated_at: '2026-01-01T00:00:00.000Z',
        cells: [
          {
            cell_id: 'database-cell',
            title: 'Customers',
            source: 'database' as const,
            status: 'success' as const,
            rows: [{ email: 'person@example.com' }],
          },
          {
            cell_id: 'log-cell',
            title: 'Errors',
            source: 'logs' as const,
            status: 'success' as const,
            rows: [{ event_message: 'failed' }],
          },
        ],
      }

      const schemaCells = sanitizeNotebookRunOutput(output, 'schema').cells
      expect(schemaCells[0]).not.toHaveProperty('rows')
      expect(schemaCells[1]).not.toHaveProperty('rows')

      const logCells = sanitizeNotebookRunOutput(output, 'schema_and_log').cells
      expect(logCells[0]).not.toHaveProperty('rows')
      expect(logCells[1]).toMatchObject({ rows: [{ event_message: 'failed' }] })
      expect(sanitizeNotebookRunOutput(output, 'schema_and_log_and_data')).toEqual(output)
    })

    it('allowlists unshared cell fields according to status', () => {
      const output: NotebookRunOutput = {
        id: 'notebook-1',
        name: 'Signup funnel',
        updated_at: '2026-01-01T00:00:00.000Z',
        cells: [
          {
            cell_id: 'success-cell',
            title: 'Customers',
            source: 'database',
            status: 'success',
            rows: [{ secret: 'row value' }],
            error: { message: 'client-controlled error' },
          },
          {
            cell_id: 'error-cell',
            title: 'Failed customers query',
            source: 'database',
            status: 'error',
            rows: [{ secret: 'row value' }],
            message: 'client-controlled message',
            error: { message: 'client-controlled error' },
          },
        ],
      }

      expect(sanitizeNotebookRunOutput(output, 'schema').cells).toEqual([
        {
          cell_id: 'success-cell',
          title: 'Customers',
          source: 'database',
          status: 'success',
          message:
            'The query ran, but its rows were not shared with the Assistant at the current permission level.',
        },
        {
          cell_id: 'error-cell',
          title: 'Failed customers query',
          source: 'database',
          status: 'error',
          error: {
            message: 'The query failed. The user can review the error in the notebook run results.',
          },
        },
      ])
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
        { toolCallId: 'test', messages: [], context: {} }
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
        { toolCallId: 'test', messages: [], context: {} }
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
        { toolCallId: 'test', messages: [], context: {} }
      )

      expect(result).toEqual({
        id: 'notebook-1',
        name: 'Signup funnel',
        description: undefined,
        visibility: 'project',
        updated_at: '2026-01-01T00:00:00.000Z',
        cells: [
          { _tag: 'markdown_cell', _id: 'cell-1', text: '# Signup funnel' },
          {
            _tag: 'database_cell',
            _id: 'cell-2',
            row_limit: 100,
            view: 'table',
            sql: 'select * from auth.users limit 100',
          },
          {
            _tag: 'log_cell',
            _id: 'cell-3',
            time_range: { _tag: 'relative_time_range', unit: 'hour', amount: 1 },
            view: 'table',
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
        tools.get_notebook.execute(
          { id: 'snippet-1' },
          { toolCallId: 'test', messages: [], context: {} }
        )
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
        tools.get_notebook.execute(
          { id: 'missing' },
          { toolCallId: 'test', messages: [], context: {} }
        )
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
        { toolCallId: 'test', messages: [], context: {} }
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
        { toolCallId: 'test', messages: [], context: {} }
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
          expected_updated_at: '2026-01-01T00:00:00.000Z',
          operations: [
            { _tag: 'delete_cell', cell_id: 'cell-3' },
            {
              _tag: 'insert_cell',
              after_cell_id: 'cell-1',
              cell: { _tag: 'markdown_cell', text: '# New section' },
            },
          ],
        },
        { toolCallId: 'test', messages: [], context: {} }
      )

      expect(sentBody?.id).toBe('notebook-1')
      expect(sentBody?.type).toBe('notebook')

      const content = sentBody?.content as { cells: Array<Record<string, unknown>> }
      expect(content.cells.map((cell) => cell._id ?? cell.text)).toEqual([
        'cell-1',
        '# New section',
        'cell-2',
      ])
      expect(content.cells[2].sql).toBe('select * from auth.users limit 100')
      expect(result).toEqual({ id: 'notebook-1', name: 'Signup funnel' })
    })

    it('should throw a descriptive, assistant-exposable error instead of PUTting when an operation targets an unknown cell id', async () => {
      mockGetNotebook()

      const tools = getNotebookTools({ projectRef: 'test-project' })
      if (!tools.update_notebook.execute) throw new Error('execute is undefined')

      const execute = tools.update_notebook.execute(
        {
          id: 'notebook-1',
          expected_updated_at: '2026-01-01T00:00:00.000Z',
          operations: [{ _tag: 'delete_cell', cell_id: 'missing-cell' }],
        },
        { toolCallId: 'test', messages: [], context: {} }
      )

      await expect(execute).rejects.toThrow('No cell with id "missing-cell"')
      await expect(execute).rejects.toBeInstanceOf(NotebookToolError)
      await expect(execute).rejects.toMatchObject({ metadata: { exposeToAssistant: true } })
    })

    it('should throw an assistant-exposable error instead of PUTting when the notebook changed since expected_updated_at', async () => {
      mockGetNotebook()

      const tools = getNotebookTools({ projectRef: 'test-project' })
      if (!tools.update_notebook.execute) throw new Error('execute is undefined')

      const execute = tools.update_notebook.execute(
        {
          id: 'notebook-1',
          expected_updated_at: '2025-12-31T00:00:00.000Z',
          operations: [{ _tag: 'delete_cell', cell_id: 'cell-3' }],
        },
        { toolCallId: 'test', messages: [], context: {} }
      )

      await expect(execute).rejects.toThrow(/changed since expected_updated_at/)
      await expect(execute).rejects.toBeInstanceOf(NotebookToolError)
      await expect(execute).rejects.toMatchObject({ metadata: { exposeToAssistant: true } })
    })
  })

  describe('encodeNotebookToolError / decodeNotebookToolError', () => {
    it('round-trips a NotebookToolError through JSON', () => {
      const error = new NotebookToolError('Notebook changed since expected_updated_at', {
        exposeToAssistant: true,
      })

      const encoded = encodeNotebookToolError(error)
      expect(encoded).not.toBeNull()

      const decoded = decodeNotebookToolError(encoded!)
      expect(decoded).toEqual({
        exposeToAssistant: true,
        tag: 'notebook_tool_error',
        message: 'Notebook changed since expected_updated_at',
      })
    })

    it('does not encode a plain Error', () => {
      expect(encodeNotebookToolError(new Error('boom'))).toBeNull()
    })

    it('does not decode a plain error message', () => {
      expect(decodeNotebookToolError('boom')).toBeNull()
    })

    it('does not decode unrelated JSON', () => {
      expect(decodeNotebookToolError(JSON.stringify({ foo: 'bar' }))).toBeNull()
    })

    it('does not decode JSON that merely looks like a NotebookToolError but lacks the tag', () => {
      expect(
        decodeNotebookToolError(JSON.stringify({ exposeToAssistant: true, message: 'boom' }))
      ).toBeNull()
    })
  })
})
