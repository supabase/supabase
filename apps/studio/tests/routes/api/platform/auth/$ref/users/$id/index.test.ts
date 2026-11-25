import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Route } from '@/routes/api/platform/auth/$ref/users/$id/index'
import { getRouteHandler } from '@/tests/lib/server-route'

const mocks = vi.hoisted(() => ({
  updateUserById: vi.fn(),
  deleteUser: vi.fn(),
}))

vi.mock('@/lib/api/self-hosted-admin', () => ({
  selfHostedSupabaseAdmin: {
    auth: {
      admin: {
        updateUserById: mocks.updateUserById,
        deleteUser: mocks.deleteUser,
      },
    },
  },
}))

describe('/api/platform/auth/$ref/users/$id', () => {
  beforeEach(() => {
    mocks.updateUserById.mockReset()
    mocks.deleteUser.mockReset()
  })

  it('updates ban_duration on PATCH', async () => {
    mocks.updateUserById.mockResolvedValue({ data: { user: { id: 'u-1' } }, error: null })

    const response = await getRouteHandler(
      Route,
      'PATCH'
    )({
      request: new Request('http://localhost/api/platform/auth/default/users/u-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ban_duration: '24h' }),
      }),
      params: { ref: 'default', id: 'u-1' },
    })

    expect(mocks.updateUserById).toHaveBeenCalledWith('u-1', { ban_duration: '24h' })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ id: 'u-1' })
  })

  it('deletes the user on DELETE', async () => {
    mocks.deleteUser.mockResolvedValue({ data: { user: null }, error: null })

    const response = await getRouteHandler(
      Route,
      'DELETE'
    )({
      request: new Request('http://localhost/api/platform/auth/default/users/u-1', {
        method: 'DELETE',
      }),
      params: { ref: 'default', id: 'u-1' },
    })

    expect(mocks.deleteUser).toHaveBeenCalledWith('u-1')
    expect(response.status).toBe(200)
  })

  it('returns 405 with Allow: PATCH, DELETE for unsupported methods', async () => {
    const response = await getRouteHandler(
      Route,
      'GET'
    )({
      request: new Request('http://localhost/api/platform/auth/default/users/u-1', {
        method: 'GET',
      }),
      params: { ref: 'default', id: 'u-1' },
    })

    expect(response.status).toBe(405)
    expect(response.headers.get('Allow')).toBe('PATCH, DELETE')
  })
})
