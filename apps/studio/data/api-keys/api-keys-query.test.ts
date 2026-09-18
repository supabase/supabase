import { waitFor } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { useAPIKeysQuery } from './api-keys-query'
import { customRenderHook } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

describe('useAPIKeysQuery', () => {
  it('returns an empty array when the endpoint responds with a non-array body', async () => {
    addAPIMock({
      method: 'get',
      path: '/v1/projects/:ref/api-keys',
      response: () => HttpResponse.json<APIErrorBody>({ message: 'Project is paused' }),
    })

    const { result } = customRenderHook(() => useAPIKeysQuery({ projectRef: 'default' }))

    await waitFor(() => expect(result.current.data).toBeDefined())

    expect(result.current.data).toEqual([])
  })
})
