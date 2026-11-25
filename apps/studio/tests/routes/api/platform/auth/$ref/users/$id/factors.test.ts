import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Route } from '@/routes/api/platform/auth/$ref/users/$id/factors'
import { getRouteHandler } from '@/tests/lib/server-route'

const mocks = vi.hoisted(() => ({
  listFactors: vi.fn(),
  deleteFactor: vi.fn(),
}))

vi.mock('@/lib/api/self-hosted-admin', () => ({
  selfHostedSupabaseAdmin: {
    auth: {
      admin: {
        mfa: {
          listFactors: mocks.listFactors,
          deleteFactor: mocks.deleteFactor,
        },
      },
    },
  },
}))

describe('/api/platform/auth/$ref/users/$id/factors', () => {
  beforeEach(() => {
    mocks.listFactors.mockReset()
    mocks.deleteFactor.mockReset()
  })

  it('awaits all factor deletions before returning 200', async () => {
    let completed = 0
    mocks.listFactors.mockResolvedValue({
      data: { factors: [{ id: 'f-1' }, { id: 'f-2' }] },
      error: null,
    })
    mocks.deleteFactor.mockImplementation(async () => {
      await Promise.resolve()
      completed += 1
      return { data: {}, error: null }
    })

    const response = await getRouteHandler(
      Route,
      'DELETE'
    )({
      request: new Request('http://localhost/api/platform/auth/default/users/u-1/factors', {
        method: 'DELETE',
      }),
      params: { ref: 'default', id: 'u-1' },
    })

    expect(completed).toBe(2)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ data: null, error: null })
  })

  it('returns 400 when any factor deletion fails', async () => {
    mocks.listFactors.mockResolvedValue({
      data: { factors: [{ id: 'f-1' }, { id: 'f-2' }] },
      error: null,
    })
    mocks.deleteFactor
      .mockResolvedValueOnce({ data: {}, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'Delete failed' } })

    const response = await getRouteHandler(
      Route,
      'DELETE'
    )({
      request: new Request('http://localhost/api/platform/auth/default/users/u-1/factors', {
        method: 'DELETE',
      }),
      params: { ref: 'default', id: 'u-1' },
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: { message: 'Delete failed' } })
  })

  it('returns 405 with Allow: DELETE for unsupported methods', async () => {
    const response = await getRouteHandler(
      Route,
      'GET'
    )({
      request: new Request('http://localhost/api/platform/auth/default/users/u-1/factors', {
        method: 'GET',
      }),
      params: { ref: 'default', id: 'u-1' },
    })

    expect(response.status).toBe(405)
    expect(response.headers.get('Allow')).toBe('DELETE')
  })
})
