import { waitFor } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { useNotebooksInfiniteQuery } from './notebooks-infinite-query'
import type { components } from '@/data/api'
import { customRenderHook } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

const NOTEBOOK_ROW: components['schemas']['GetUserContentResponse']['data'][number] = {
  id: 'd3aadd77-7c3c-4de7-aa5c-5aa8ac270b44',
  type: 'notebook',
  name: 'Signup funnel',
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
  content: {
    schema_version: 1,
    cells: [],
  },
}

describe('useNotebooksInfiniteQuery', () => {
  it('narrows the page content to notebook rows', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/content',
      response: () =>
        HttpResponse.json<components['schemas']['GetUserContentResponse']>({
          cursor: undefined,
          data: [NOTEBOOK_ROW],
        }),
    })

    const { result } = customRenderHook(() => useNotebooksInfiniteQuery({ projectRef: 'default' }))

    await waitFor(() => expect(result.current.data).toBeDefined())

    expect(result.current.data?.pages[0].content).toEqual([
      { ...NOTEBOOK_ROW, content: { schema_version: 1, cells: [] } },
    ])
  })
})
