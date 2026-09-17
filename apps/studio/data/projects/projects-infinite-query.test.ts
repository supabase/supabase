import { waitFor } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { useProjectsInfiniteQuery } from './projects-infinite-query'
import { customRenderHook } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'

describe('useProjectsInfiniteQuery', () => {
  it('defaults projects to an empty array when a page comes back without it', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/projects',
      response: () => HttpResponse.json<APIErrorBody>({ message: 'Something went wrong' }),
    })

    const { result } = customRenderHook(() => useProjectsInfiniteQuery({}), {
      profileContext: createMockProfileContext(),
    })

    await waitFor(() => expect(result.current.data).toBeDefined())

    expect(result.current.data?.pages.flatMap((page) => page.projects)).toEqual([])
  })
})
