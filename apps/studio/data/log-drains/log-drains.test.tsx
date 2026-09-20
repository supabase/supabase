import { waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { useTestLogDrainMutation } from './test-log-drain-mutation'
import { API_URL } from '@/lib/constants'
import { customRenderHook } from '@/tests/lib/custom-render'
import { mswServer } from '@/tests/lib/msw'

const REF = 'my-project'
const BASE = `${API_URL}/platform/projects/:ref/analytics/log-drains`

describe('project log drain hooks', () => {
  it('tests a log drain connection by token at the project-scoped path', async () => {
    let receivedRef: string | undefined
    let receivedToken: string | undefined
    mswServer.use(
      http.post(`${BASE}/:token/test`, ({ params }) => {
        receivedRef = params.ref as string
        receivedToken = params.token as string
        return HttpResponse.json({})
      })
    )

    const { result } = customRenderHook(() => useTestLogDrainMutation())

    result.current.mutate({ projectRef: REF, token: 'tok-1' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(receivedRef).toBe(REF)
    expect(receivedToken).toBe('tok-1')
  })
})
