import { QueryClient, useQuery } from '@tanstack/react-query'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { getContentCount } from './content-count-query'
import type { ContentBase } from './content-query'
import {
  logsViewsQueryOptions,
  useDeleteLogsViewMutation,
  useSaveLogsViewMutation,
} from './logs-views-query'
import { getSqlSnippets } from './sql-snippets-query'
import { SaveViewDialog } from '@/components/interfaces/UnifiedLogs/components/SaveViewDialog'
import { useLogsViews } from '@/components/interfaces/UnifiedLogs/useLogsViews'
import type { components } from '@/data/api'
import { createMockProject } from '@/tests/helpers'
import { customRender, customRenderHook } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

mockAnimationsApi()

type ListResponse = components['schemas']['GetUserContentResponse_Output']
const draft = {
  name: 'Errors',
  logSource: 'edge_logs',
  filters: { logicalOperator: 'AND' as const, conditions: [] },
  viewOptions: {},
}
const viewRow: ContentBase = {
  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  type: 'log_sql',
  name: draft.name,
  description: '',
  favorite: false,
  folder_id: null,
  inserted_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  visibility: 'project',
  owner_id: 1,
  project_id: 1,
  owner: { id: 1, username: 'test' },
  updated_by: { id: 1, username: 'test' },
  content: { type: 'logs_view', version: 1, ...draft },
}
const legacyRow: ContentBase = {
  ...viewRow,
  id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  name: 'Legacy SQL',
  visibility: 'user',
  content: { sql: 'select timestamp from edge_logs', schema_version: '1' },
}

function mockList() {
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/content',
    response: ({ params, request }) => {
      if (params.ref !== 'project-a')
        return HttpResponse.json<ListResponse>({ data: [], cursor: undefined })
      const cursor = new URL(request.url).searchParams.get('cursor')
      return HttpResponse.json<ListResponse>({
        data: cursor
          ? [
              {
                ...legacyRow,
                id: cursor === 'next-page' ? legacyRow.id : 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
              },
            ]
          : [
              viewRow,
              { ...viewRow, content: { ...viewRow.content, version: 2 } },
              { ...viewRow, content: { ...viewRow.content, viewOptions: { sort: 'invalid' } } },
            ],
        cursor: cursor === 'final-page' ? undefined : cursor ? 'final-page' : 'next-page',
      })
    },
  })
}

describe('saved log views persistence', () => {
  it('loads all pages and isolates each project cache while preserving legacy SQL', async () => {
    mockList()
    let projectRef = 'project-a'
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result, rerender } = customRenderHook(
      () => useQuery(logsViewsQueryOptions({ projectRef })),
      { queryClient }
    )
    await waitFor(() => expect(result.current.data?.map((view) => view.name)).toEqual(['Errors']))
    projectRef = 'project-b'
    rerender()
    expect(result.current.data).toBeUndefined()
    await waitFor(() => expect(result.current.data).toEqual([]))
    projectRef = 'project-a'
    rerender()
    expect(result.current.data?.[0].name).toBe('Errors')

    const snippets = await getSqlSnippets({ projectRef: 'project-a', type: 'log_sql' })
    expect(snippets.contents.map((snippet) => snippet.name)).toEqual(['Legacy SQL'])
    expect(snippets.cursor).toBe('final-page')
    expect(snippets.contents[0].content?.unchecked_sql).toBe('select timestamp from edge_logs')
    expect(await getContentCount({ projectRef: 'project-a', type: 'log_sql' })).toEqual({
      favorites: 0,
      private: 2,
      shared: 0,
    })
  })

  it('sends project-scoped opaque content and confirms create, update and delete', async () => {
    const writes: unknown[] = []
    addAPIMock({
      method: 'put',
      path: '/platform/projects/:ref/content',
      response: async ({ request, params }) => {
        writes.push({ projectRef: params.ref, body: await request.json() })
        return HttpResponse.json<components['schemas']['GetUserContentByIdResponse_Output']>({
          ...viewRow,
          updated_by: 1,
          owner: undefined,
        })
      },
    })
    addAPIMock({
      method: 'delete',
      path: '/platform/projects/:ref/content',
      response: ({ request, params }) => {
        writes.push({ projectRef: params.ref, ids: new URL(request.url).searchParams.get('ids') })
        return HttpResponse.json<{ id: string }[]>([{ id: viewRow.id }])
      },
    })
    const { result } = customRenderHook(() => ({
      save: useSaveLogsViewMutation(),
      remove: useDeleteLogsViewMutation(),
    }))
    await act(async () => {
      await result.current.save.mutateAsync({
        projectRef: 'project-a',
        id: viewRow.id,
        input: draft,
      })
      await result.current.save.mutateAsync({
        projectRef: 'project-a',
        id: viewRow.id,
        input: { ...draft, name: 'Renamed' },
      })
      await result.current.remove.mutateAsync({ projectRef: 'project-a', ids: [viewRow.id] })
    })
    expect(writes).toEqual([
      {
        projectRef: 'project-a',
        body: {
          id: viewRow.id,
          name: 'Errors',
          type: 'log_sql',
          visibility: 'project',
          content: {
            type: 'logs_view',
            version: 1,
            logSource: 'edge_logs',
            filters: draft.filters,
            viewOptions: {},
          },
        },
      },
      {
        projectRef: 'project-a',
        body: {
          id: viewRow.id,
          name: 'Renamed',
          type: 'log_sql',
          visibility: 'project',
          content: {
            type: 'logs_view',
            version: 1,
            logSource: 'edge_logs',
            filters: draft.filters,
            viewOptions: {},
          },
        },
      },
      { projectRef: 'project-a', ids: viewRow.id },
    ])
  })

  it('retains the save form after a failed write and only closes after retry succeeds', async () => {
    let shouldFail = true
    addAPIMock({
      method: 'put',
      path: '/platform/projects/:ref/content',
      response: () =>
        shouldFail
          ? HttpResponse.json<APIErrorBody>({ message: 'Write failed' }, { status: 403 })
          : HttpResponse.json<components['schemas']['GetUserContentByIdResponse_Output']>({
              ...viewRow,
              updated_by: 1,
              owner: undefined,
            }),
    })
    const onCancel = vi.fn()
    const onSuccess = vi.fn()
    function SaveForm() {
      const save = useSaveLogsViewMutation()
      return (
        <SaveViewDialog
          visible
          onCancel={onCancel}
          onSave={async (input) => {
            await save.mutateAsync({ projectRef: 'project-a', id: viewRow.id, input })
            onSuccess()
          }}
          {...draft}
          existingNames={[]}
          columnLabels={{}}
        />
      )
    }
    customRender(<SaveForm />)
    fireEvent.change(await screen.findByPlaceholderText('Enter a name for this view'), {
      target: { value: 'Retry me' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save view' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save view' })).toBeDisabled())
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Save view' })).not.toBeDisabled()
    )
    expect(onSuccess).not.toHaveBeenCalled()
    expect(onCancel).not.toHaveBeenCalled()
    expect(screen.getByPlaceholderText('Enter a name for this view')).toHaveValue('Retry me')
    shouldFail = false
    fireEvent.click(screen.getByRole('button', { name: 'Save view' }))
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('recovers from a failed read and retains loaded views after a failed delete', async () => {
    let shouldFailRead = true
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/content',
      response: () =>
        shouldFailRead
          ? HttpResponse.json<APIErrorBody>({ message: 'Read failed' }, { status: 403 })
          : HttpResponse.json<ListResponse>({ data: [viewRow], cursor: undefined }),
    })
    addAPIMock({
      method: 'delete',
      path: '/platform/projects/:ref/content',
      response: () =>
        HttpResponse.json<APIErrorBody>({ message: 'Delete failed' }, { status: 403 }),
    })
    const { result } = customRenderHook(() => ({
      views: useQuery(logsViewsQueryOptions({ projectRef: 'project-a' })),
      remove: useDeleteLogsViewMutation(),
    }))
    await waitFor(() => expect(result.current.views.isError).toBe(true))
    shouldFailRead = false
    await act(async () => {
      await result.current.views.refetch()
    })
    await waitFor(() => expect(result.current.views.data?.[0].name).toBe('Errors'))
    await act(async () => {
      await expect(
        result.current.remove.mutateAsync({ projectRef: 'project-a', ids: [viewRow.id] })
      ).rejects.toMatchObject({ message: 'Delete failed' })
    })
    expect(result.current.views.data?.[0].name).toBe('Errors')
  })

  it('makes no content requests with the flag off, including an explicit retry', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: () =>
        HttpResponse.json<components['schemas']['ProjectDetailResponse_Output']>({
          ...createMockProject({ ref: 'default' }),
          inserted_at: '2026-01-01',
          subscription_id: 'subscription-1',
          is_physical_backups_enabled: false,
          status: 'ACTIVE_HEALTHY',
          connectionString: null,
          db_host: 'localhost',
          high_availability: false,
          integration_source: null,
          restUrl: 'https://default.supabase.co',
          updated_at: '2026-01-01',
        }),
    })
    const requests = vi.fn()
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/content',
      response: () => {
        requests()
        return HttpResponse.json<ListResponse>({ data: [], cursor: undefined })
      },
    })
    const { result } = customRenderHook(() => useLogsViews())
    act(() => result.current.retry())
    await act(async () => {
      await Promise.resolve()
    })
    expect(result.current.views).toEqual([])
    expect(requests).not.toHaveBeenCalled()
  })
})
