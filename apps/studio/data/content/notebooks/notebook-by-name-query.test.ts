import { useQuery } from '@tanstack/react-query'
import { waitFor } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { isNotebookNamed, notebookByNameQueryOptions } from './notebook-by-name-query'
import type { components } from '@/data/api'
import { customRenderHook } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type ContentRow = components['schemas']['GetUserContentResponse_Output']['data'][number]

const notebookRow = (id: string, name: string): ContentRow => ({
  id,
  type: 'notebook',
  name,
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
  content: { schema_version: 1, cells: [] },
})

describe('isNotebookNamed', () => {
  it('matches the name case-insensitively, ignoring surrounding whitespace', () => {
    expect(isNotebookNamed({ name: ' home ' }, 'Home')).toBe(true)
    expect(isNotebookNamed({ name: 'Homepage metrics' }, 'Home')).toBe(false)
  })
})

describe('notebookByNameQueryOptions', () => {
  it('pages past partial matches until it finds the exact name', async () => {
    const homepage = notebookRow('d3aadd77-7c3c-4de7-aa5c-5aa8ac270b44', 'Homepage metrics')
    const home = notebookRow('0b5c3f0e-5f4e-4d0a-9d8a-2f1b6c7e8a90', 'home')

    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/content',
      response: ({ request }) => {
        const cursor = new URL(request.url).searchParams.get('cursor')
        return HttpResponse.json<components['schemas']['GetUserContentResponse_Output']>(
          cursor === 'page-2'
            ? { cursor: undefined, data: [home] }
            : { cursor: 'page-2', data: [homepage] }
        )
      },
    })

    const { result } = customRenderHook(() =>
      useQuery(notebookByNameQueryOptions({ projectRef: 'default', name: 'Home' }))
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.id).toBe(home.id)
  })

  it('returns null when no notebook has the exact name', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/content',
      response: () =>
        HttpResponse.json<components['schemas']['GetUserContentResponse_Output']>({
          cursor: undefined,
          data: [notebookRow('d3aadd77-7c3c-4de7-aa5c-5aa8ac270b44', 'Homepage metrics')],
        }),
    })

    const { result } = customRenderHook(() =>
      useQuery(notebookByNameQueryOptions({ projectRef: 'default', name: 'Home' }))
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
  })
})
