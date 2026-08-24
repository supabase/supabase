import { components } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import {
  decodeNotebookToolError,
  encodeNotebookToolError,
  getNotebookTools,
  NotebookToolError,
} from './notebook-tools'
import type { AgentNotebook } from '@/data/content/notebooks/notebook-schema'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

type DatabaseDetailResponse = components['schemas']['DatabaseDetailResponse']

function mockDatabases(identifiers: string[]) {
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/databases',
    response: () =>
      HttpResponse.json<DatabaseDetailResponse[]>(
        identifiers.map((identifier) => ({
          identifier,
          region: 'us-east-1',
          status: 'ACTIVE_HEALTHY',
          cloud_provider: 'AWS',
          db_host: `db.${identifier}.supabase.co`,
          db_name: 'postgres',
          db_port: 5432,
          db_user: 'postgres',
          inserted_at: '2026-01-01T00:00:00.000Z',
          restUrl: `https://${identifier}.supabase.co/rest/v1`,
          size: 't4g.micro',
        }))
      ),
  })
}

function mockCreateNotebookPut() {
  addAPIMock({
    method: 'put',
    path: '/platform/projects/:ref/content',
    response: () => new HttpResponse(null),
  })
}

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
        // The generated response type expects a stricter cell union than this hand-written
        // fixture provides; the cells themselves are exercised by the schema tests above.
      } as unknown as GetUserContentByIdResponse),
  })
}

describe('ai/tools/notebook-tools', () => {
  describe('getNotebookTools', () => {
    it('should return list_databases, list_notebooks, get_notebook, create_notebook, update_notebook, and delete_notebook tools', () => {
      const tools = getNotebookTools()

      expect(Object.keys(tools)).toEqual([
        'list_databases',
        'list_notebooks',
        'get_notebook',
        'create_notebook',
        'update_notebook',
        'delete_notebook',
      ])
    })

    it('should not require approval to read notebooks', () => {
      const tools = getNotebookTools()

      expect(tools.list_notebooks.needsApproval).toBeUndefined()
      expect(tools.get_notebook.needsApproval).toBeUndefined()
    })

    it('should require approval to create, update, or delete a notebook', () => {
      const tools = getNotebookTools()

      expect(tools.create_notebook.needsApproval).toBe(true)
      expect(tools.update_notebook.needsApproval).toBe(true)
      expect(tools.delete_notebook.needsApproval).toBe(true)
    })
  })

  describe('list_databases', () => {
    it('should list databases with a computed is_primary flag', async () => {
      addAPIMock({
        method: 'get',
        path: '/platform/projects/:ref/databases',
        response: () =>
          HttpResponse.json<components['schemas']['DatabaseDetailResponse'][]>([
            {
              identifier: 'test-project',
              region: 'us-east-1',
              status: 'ACTIVE_HEALTHY',
              cloud_provider: 'AWS',
              db_host: 'db.test-project.supabase.co',
              db_name: 'postgres',
              db_port: 5432,
              db_user: 'postgres',
              inserted_at: '2026-01-01T00:00:00.000Z',
              restUrl: 'https://test-project.supabase.co/rest/v1',
              size: 't4g.micro',
            },
            {
              identifier: 'test-project-replica-1',
              region: 'us-west-1',
              status: 'COMING_UP',
              cloud_provider: 'AWS',
              db_host: 'db.test-project-replica-1.supabase.co',
              db_name: 'postgres',
              db_port: 5432,
              db_user: 'postgres',
              inserted_at: '2026-01-01T00:00:00.000Z',
              restUrl: 'https://test-project-replica-1.supabase.co/rest/v1',
              size: 't4g.micro',
            },
          ]),
      })

      const tools = getNotebookTools({ projectRef: 'test-project' })
      if (!tools.list_databases.execute) throw new Error('execute is undefined')

      const result = await tools.list_databases.execute(
        {},
        { toolCallId: 'test', messages: [], context: {} }
      )

      expect(result).toEqual({
        databases: [
          {
            identifier: 'test-project',
            is_primary: true,
            region: 'us-east-1',
            status: 'ACTIVE_HEALTHY',
          },
          {
            identifier: 'test-project-replica-1',
            is_primary: false,
            region: 'us-west-1',
            status: 'COMING_UP',
          },
        ],
      })
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

    it('should throw an assistant-exposable error instead of PUTting when a database_cell carries an unknown database_identifier', async () => {
      mockDatabases(['test-project', 'test-project-replica-1'])

      const tools = getNotebookTools({ projectRef: 'test-project' })
      if (!tools.create_notebook.execute) throw new Error('execute is undefined')

      const execute = tools.create_notebook.execute(
        {
          name: 'Signup funnel',
          content: {
            schema_version: 1,
            cells: [
              {
                _tag: 'database_cell',
                sql: 'select 1',
                row_limit: 100,
                database_identifier: 'made-up-replica',
              },
            ],
          },
        },
        { toolCallId: 'test', messages: [], context: {} }
      )

      await expect(execute).rejects.toThrow(/made-up-replica/)
      await expect(execute).rejects.toBeInstanceOf(NotebookToolError)
      await expect(execute).rejects.toMatchObject({ metadata: { exposeToAssistant: true } })
    })

    it('should throw an assistant-exposable error instead of PUTting when a database_cell carries an empty database_identifier', async () => {
      mockDatabases(['test-project', 'test-project-replica-1'])

      const tools = getNotebookTools({ projectRef: 'test-project' })
      if (!tools.create_notebook.execute) throw new Error('execute is undefined')

      const execute = tools.create_notebook.execute(
        {
          name: 'Signup funnel',
          content: {
            schema_version: 1,
            cells: [
              {
                _tag: 'database_cell',
                sql: 'select 1',
                row_limit: 100,
                database_identifier: '',
              },
            ],
          },
        },
        { toolCallId: 'test', messages: [], context: {} }
      )

      await expect(execute).rejects.toBeInstanceOf(NotebookToolError)
      await expect(execute).rejects.toMatchObject({ metadata: { exposeToAssistant: true } })
    })

    it('should succeed when a database_cell carries a database_identifier that matches a real database', async () => {
      mockDatabases(['test-project', 'test-project-replica-1'])
      mockCreateNotebookPut()

      const tools = getNotebookTools({ projectRef: 'test-project' })
      if (!tools.create_notebook.execute) throw new Error('execute is undefined')

      await expect(
        tools.create_notebook.execute(
          {
            name: 'Signup funnel',
            content: {
              schema_version: 1,
              cells: [
                {
                  _tag: 'database_cell',
                  sql: 'select 1',
                  row_limit: 100,
                  database_identifier: 'test-project-replica-1',
                },
              ],
            },
          },
          { toolCallId: 'test', messages: [], context: {} }
        )
      ).resolves.toMatchObject({ name: 'Signup funnel' })
    })

    it('should succeed without ever calling the databases endpoint when no cell sets database_identifier', async () => {
      mockCreateNotebookPut()

      const tools = getNotebookTools({ projectRef: 'test-project' })
      if (!tools.create_notebook.execute) throw new Error('execute is undefined')

      // No mock registered for GET /platform/projects/:ref/databases: MSW fails the test
      // on any unhandled request, so this also asserts the endpoint was never called.
      await expect(
        tools.create_notebook.execute(
          { name: 'Signup funnel', content: VALID_AGENT_CONTENT },
          { toolCallId: 'test', messages: [], context: {} }
        )
      ).resolves.toMatchObject({ name: 'Signup funnel' })
    })
  })

  describe('update_notebook', () => {
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
      // previous_content is the pre-update notebook (unaffected by this update's
      // operations), not the post-update `sentBody` asserted above — it lets the client
      // re-derive the diff at the time of approval
      expect(result).toEqual({
        id: 'notebook-1',
        name: 'Signup funnel',
        previous_content: {
          schema_version: 1,
          cells: [
            { _tag: 'markdown_cell', _id: 'cell-1', text: '# Signup funnel' },
            {
              _tag: 'database_cell',
              _id: 'cell-2',
              sql: 'select * from auth.users limit 100',
              row_limit: 100,
              view: 'table',
            },
            {
              _tag: 'log_cell',
              _id: 'cell-3',
              sql: 'select timestamp, event_message from edge_logs limit 10',
              time_range: { _tag: 'relative_time_range', unit: 'hour', amount: 1 },
              view: 'table',
            },
          ],
        },
      })
      expect((tools.update_notebook as any).toModelOutput({ output: result })).toEqual({
        type: 'json',
        value: { id: 'notebook-1', name: 'Signup funnel' },
      })
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

    it('should throw an assistant-exposable error instead of PUTting when a resulting database_cell carries an unknown database_identifier', async () => {
      mockGetNotebook()
      mockDatabases(['test-project'])

      const tools = getNotebookTools({ projectRef: 'test-project' })
      if (!tools.update_notebook.execute) throw new Error('execute is undefined')

      const execute = tools.update_notebook.execute(
        {
          id: 'notebook-1',
          expected_updated_at: '2026-01-01T00:00:00.000Z',
          operations: [
            {
              _tag: 'replace_cell',
              cell_id: 'cell-2',
              cell: {
                _tag: 'database_cell',
                sql: 'select * from auth.users limit 100',
                row_limit: 100,
                database_identifier: 'made-up-replica',
              },
            },
          ],
        },
        { toolCallId: 'test', messages: [], context: {} }
      )

      await expect(execute).rejects.toThrow(/made-up-replica/)
      await expect(execute).rejects.toBeInstanceOf(NotebookToolError)
      await expect(execute).rejects.toMatchObject({ metadata: { exposeToAssistant: true } })
    })

    it('should succeed when a resulting database_cell carries a database_identifier that matches a real database', async () => {
      mockGetNotebook()
      mockDatabases(['test-project', 'test-project-replica-1'])
      addAPIMock({
        method: 'put',
        path: '/platform/projects/:ref/content',
        response: () => new HttpResponse(null),
      })

      const tools = getNotebookTools({ projectRef: 'test-project' })
      if (!tools.update_notebook.execute) throw new Error('execute is undefined')

      await expect(
        tools.update_notebook.execute(
          {
            id: 'notebook-1',
            expected_updated_at: '2026-01-01T00:00:00.000Z',
            operations: [
              {
                _tag: 'replace_cell',
                cell_id: 'cell-2',
                cell: {
                  _tag: 'database_cell',
                  sql: 'select * from auth.users limit 100',
                  row_limit: 100,
                  database_identifier: 'test-project-replica-1',
                },
              },
            ],
          },
          { toolCallId: 'test', messages: [], context: {} }
        )
      ).resolves.toMatchObject({ id: 'notebook-1', name: 'Signup funnel' })
    })

    it('should throw an assistant-exposable error instead of PUTting when an inserted database_cell carries an unknown database_identifier', async () => {
      mockGetNotebook()
      mockDatabases(['test-project'])

      const tools = getNotebookTools({ projectRef: 'test-project' })
      if (!tools.update_notebook.execute) throw new Error('execute is undefined')

      const execute = tools.update_notebook.execute(
        {
          id: 'notebook-1',
          expected_updated_at: '2026-01-01T00:00:00.000Z',
          operations: [
            {
              _tag: 'insert_cell',
              after_cell_id: 'cell-1',
              cell: {
                _tag: 'database_cell',
                sql: 'select * from auth.users limit 100',
                row_limit: 100,
                database_identifier: 'made-up-replica',
              },
            },
          ],
        },
        { toolCallId: 'test', messages: [], context: {} }
      )

      await expect(execute).rejects.toThrow(/made-up-replica/)
      await expect(execute).rejects.toBeInstanceOf(NotebookToolError)
      await expect(execute).rejects.toMatchObject({ metadata: { exposeToAssistant: true } })
    })

    it('should succeed when an inserted database_cell carries a database_identifier that matches a real database', async () => {
      mockGetNotebook()
      mockDatabases(['test-project', 'test-project-replica-1'])
      addAPIMock({
        method: 'put',
        path: '/platform/projects/:ref/content',
        response: () => new HttpResponse(null),
      })

      const tools = getNotebookTools({ projectRef: 'test-project' })
      if (!tools.update_notebook.execute) throw new Error('execute is undefined')

      await expect(
        tools.update_notebook.execute(
          {
            id: 'notebook-1',
            expected_updated_at: '2026-01-01T00:00:00.000Z',
            operations: [
              {
                _tag: 'insert_cell',
                after_cell_id: 'cell-1',
                cell: {
                  _tag: 'database_cell',
                  sql: 'select * from auth.users limit 100',
                  row_limit: 100,
                  database_identifier: 'test-project-replica-1',
                },
              },
            ],
          },
          { toolCallId: 'test', messages: [], context: {} }
        )
      ).resolves.toMatchObject({ id: 'notebook-1', name: 'Signup funnel' })
    })

    it('should succeed without validating or fetching databases when no operation introduces a database_cell', async () => {
      // cell-2 already carries an identifier that wouldn't validate today (e.g. its
      // replica was since removed) — but this update never touches it, so it must not
      // be re-checked, and the databases endpoint must not be called at all.
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
            content: {
              ...NOTEBOOK_CONTENT,
              cells: NOTEBOOK_CONTENT.cells.map((cell) =>
                cell._tag === 'database_cell'
                  ? { ...cell, database_identifier: 'stale-replica-removed-long-ago' }
                  : cell
              ),
            },
          }),
      })
      addAPIMock({
        method: 'put',
        path: '/platform/projects/:ref/content',
        response: () => new HttpResponse(null),
      })

      const tools = getNotebookTools({ projectRef: 'test-project' })
      if (!tools.update_notebook.execute) throw new Error('execute is undefined')

      // No mock registered for GET /platform/projects/:ref/databases: MSW fails the test
      // on any unhandled request, so this also asserts the endpoint was never called.
      await expect(
        tools.update_notebook.execute(
          {
            id: 'notebook-1',
            expected_updated_at: '2026-01-01T00:00:00.000Z',
            operations: [{ _tag: 'delete_cell', cell_id: 'cell-3' }],
          },
          { toolCallId: 'test', messages: [], context: {} }
        )
      ).resolves.toMatchObject({ id: 'notebook-1', name: 'Signup funnel' })
    })
  })

  describe('delete_notebook', () => {
    it('should fetch the notebook, delete it, and return its id and name', async () => {
      mockGetNotebook()
      let capturedRequest: Request | undefined
      addAPIMock({
        method: 'delete',
        path: '/platform/projects/:ref/content',
        response: ({ request }) => {
          capturedRequest = request
          return HttpResponse.json([{ id: 'notebook-1' }])
        },
      })

      const tools = getNotebookTools({ projectRef: 'test-project' })
      if (!tools.delete_notebook.execute) throw new Error('execute is undefined')

      const result = await tools.delete_notebook.execute(
        { id: 'notebook-1' },
        { toolCallId: 'test', messages: [], context: {} }
      )

      const url = new URL(capturedRequest!.url)
      expect(url.pathname).toContain('/projects/test-project/content')
      expect(url.searchParams.get('ids')).toBe('notebook-1')
      expect(result).toEqual({ id: 'notebook-1', name: 'Signup funnel' })
    })

    it('should throw when the notebook does not exist, without calling delete', async () => {
      addAPIMock({
        method: 'get',
        path: '/platform/projects/:ref/content/item/:id',
        response: () => HttpResponse.json<APIErrorBody>({ message: 'Not found' }, { status: 404 }),
      })

      const tools = getNotebookTools({ projectRef: 'test-project' })
      if (!tools.delete_notebook.execute) throw new Error('execute is undefined')

      // No mock registered for DELETE /platform/projects/:ref/content: MSW fails the test
      // on any unhandled request, so this also asserts the endpoint was never called.
      await expect(
        tools.delete_notebook.execute(
          { id: 'missing' },
          { toolCallId: 'test', messages: [], context: {} }
        )
      ).rejects.toThrow()
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
