import { components } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { getNotebookTools } from './notebook-tools'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

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
    it('should return list_notebooks and get_notebook tools', () => {
      const tools = getNotebookTools()

      expect(Object.keys(tools)).toEqual(['list_notebooks', 'get_notebook'])
    })

    it('should not require approval to read notebooks', () => {
      const tools = getNotebookTools()

      expect(tools.list_notebooks.needsApproval).toBeUndefined()
      expect(tools.get_notebook.needsApproval).toBeUndefined()
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
})
