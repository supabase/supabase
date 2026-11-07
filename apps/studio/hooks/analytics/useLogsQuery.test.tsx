// @vitest-environment jsdom
import { waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { useLogsQuery } from './useLogsQuery'
import { API_URL } from '@/lib/constants'
import { customRenderHook } from '@/tests/lib/custom-render'
import { addAPIMock, mswServer, type APIErrorBody } from '@/tests/lib/msw'

const LOGS_PATH = '/platform/projects/:ref/analytics/endpoints/logs.all'

const renderLogsQuery = () =>
  customRenderHook(() =>
    useLogsQuery({ projectRef: 'default', initialParams: { sql: 'select 1 limit 1' } })
  )

// Error bodies outside the `APIErrorBody` convention, such as the self-hosted route's
// `{ error: { message } }`, can't go through the typed `addAPIMock`.
const mockLogsErrorBody = (body: object) =>
  mswServer.use(http.get(`${API_URL}${LOGS_PATH}`, () => HttpResponse.json(body, { status: 500 })))

describe('useLogsQuery', () => {
  beforeEach(() => {
    mswServer.use(
      http.get('/api/enabled-features-overrides', () =>
        HttpResponse.json<{ disabled_features: string[] }>({ disabled_features: [] })
      )
    )
  })

  it('surfaces the message of a self-hosted route error, which is nested under `error`', async () => {
    mockLogsErrorBody({ error: { message: 'fetch failed' } })
    const { result } = renderLogsQuery()
    await waitFor(() => expect(result.current.error).toBe('fetch failed'))
  })

  it('surfaces a top-level error message', async () => {
    addAPIMock({
      method: 'get',
      path: LOGS_PATH,
      response: () =>
        HttpResponse.json<APIErrorBody>({ message: 'Logs are unavailable' }, { status: 500 }),
    })
    const { result } = renderLogsQuery()
    await waitFor(() => expect(result.current.error).toBe('Logs are unavailable'))
  })

  it('falls back to the whole error body when it has no message', async () => {
    mockLogsErrorBody({ reason: 'unknown' })
    const { result } = renderLogsQuery()
    await waitFor(() =>
      expect(result.current.error).toMatchObject({ reason: 'unknown', code: 500 })
    )
  })
})
