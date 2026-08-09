import { waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { useAuditLogDrainsQuery } from './audit-log-drains-query'
import { useCreateAuditLogDrainMutation } from './create-audit-log-drain-mutation'
import { useDeleteAuditLogDrainMutation } from './delete-audit-log-drain-mutation'
import { API_URL } from '@/lib/constants'
import { customRenderHook } from '@/tests/lib/custom-render'
import { mswServer } from '@/tests/lib/msw'

const SLUG = 'my-org'
const BASE = `${API_URL}/platform/organizations/:slug/analytics/audit-log-drains`

const DRAIN = {
  id: 1,
  token: 'tok-1',
  name: 'Audit drain',
  description: '',
  type: 'webhook',
  config: { url: 'https://example.com' },
}

describe('org audit log drain hooks', () => {
  it('lists audit log drains for an organization', async () => {
    mswServer.use(http.get(BASE, () => HttpResponse.json([DRAIN])))

    const { result } = customRenderHook(() => useAuditLogDrainsQuery({ slug: SLUG }))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0].name).toBe('Audit drain')
  })

  it('creates an audit log drain at the org-scoped path', async () => {
    let receivedSlug: string | undefined
    mswServer.use(
      http.post(BASE, ({ params }) => {
        receivedSlug = params.slug as string
        return HttpResponse.json(DRAIN)
      })
    )

    const { result } = customRenderHook(() => useCreateAuditLogDrainMutation())

    result.current.mutate({
      slug: SLUG,
      name: 'Audit drain',
      description: '',
      type: 'webhook',
      config: {} as any,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(receivedSlug).toBe(SLUG)
  })

  it('deletes an audit log drain by token', async () => {
    let receivedToken: string | undefined
    mswServer.use(
      http.delete(`${BASE}/:token`, ({ params }) => {
        receivedToken = params.token as string
        return new HttpResponse(null, { status: 204 })
      })
    )

    const { result } = customRenderHook(() => useDeleteAuditLogDrainMutation())

    result.current.mutate({ slug: SLUG, token: 'tok-1' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(receivedToken).toBe('tok-1')
  })
})
