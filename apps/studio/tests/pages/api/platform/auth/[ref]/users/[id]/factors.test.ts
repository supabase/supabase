import { createMocks } from 'node-mocks-http'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import handler from '../../../../../../../../pages/api/platform/auth/[ref]/users/[id]/factors'

const { listFactors, deleteFactor } = vi.hoisted(() => ({
  listFactors: vi.fn(),
  deleteFactor: vi.fn(),
}))

vi.mock('@/lib/api/self-hosted-admin', () => ({
  selfHostedSupabaseAdmin: { auth: { admin: { mfa: { listFactors, deleteFactor } } } },
}))

const createRequest = () =>
  createMocks({ method: 'DELETE', query: { ref: 'default', id: 'user-1' } })

const factor = (id: string) => ({ id, friendly_name: id, factor_type: 'totp', status: 'verified' })

describe('/api/platform/auth/[ref]/users/[id]/factors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deleteFactor.mockResolvedValue({ data: {}, error: null })
  })

  it('deletes every factor belonging to the user', async () => {
    listFactors.mockResolvedValue({ data: { factors: [factor('a'), factor('b')] }, error: null })
    const { req, res } = createRequest()

    await handler(req, res)

    expect(deleteFactor).toHaveBeenCalledTimes(2)
    expect(deleteFactor).toHaveBeenCalledWith({ id: 'a', userId: 'user-1' })
    expect(deleteFactor).toHaveBeenCalledWith({ id: 'b', userId: 'user-1' })
    expect(res._getStatusCode()).toBe(200)
  })

  it('waits for the deletions to finish before responding', async () => {
    listFactors.mockResolvedValue({ data: { factors: [factor('a')] }, error: null })
    let resolveDelete: (value: { data: object; error: null }) => void = () => {}
    deleteFactor.mockReturnValue(
      new Promise<{ data: object; error: null }>((resolve) => {
        resolveDelete = resolve
      })
    )
    const { req, res } = createRequest()

    const pending = handler(req, res)
    // Let every already-queued microtask run. The response must still be open,
    // otherwise the handler reported success while the delete was in flight.
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(res._isEndCalled()).toBe(false)

    resolveDelete({ data: {}, error: null })
    await pending

    expect(res._getStatusCode()).toBe(200)
  })

  it('returns a 400 when a factor fails to delete', async () => {
    listFactors.mockResolvedValue({ data: { factors: [factor('a'), factor('b')] }, error: null })
    deleteFactor
      .mockResolvedValueOnce({ data: null, error: { message: 'Factor not found' } })
      .mockResolvedValueOnce({ data: {}, error: null })
    const { req, res } = createRequest()

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toEqual({ error: { message: 'Factor not found' } })
  })

  it('attempts every deletion even when one of them fails', async () => {
    listFactors.mockResolvedValue({ data: { factors: [factor('a'), factor('b')] }, error: null })
    deleteFactor
      .mockResolvedValueOnce({ data: null, error: { message: 'Factor not found' } })
      .mockResolvedValueOnce({ data: {}, error: null })
    const { req, res } = createRequest()

    await handler(req, res)

    expect(deleteFactor).toHaveBeenCalledTimes(2)
  })

  it('returns a 400 when the factors cannot be listed', async () => {
    listFactors.mockResolvedValue({ data: null, error: { message: 'User not found' } })
    const { req, res } = createRequest()

    await handler(req, res)

    expect(deleteFactor).not.toHaveBeenCalled()
    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toEqual({ error: { message: 'User not found' } })
  })

  it('succeeds when the user has no factors', async () => {
    listFactors.mockResolvedValue({ data: { factors: [] }, error: null })
    const { req, res } = createRequest()

    await handler(req, res)

    expect(deleteFactor).not.toHaveBeenCalled()
    expect(res._getStatusCode()).toBe(200)
  })

  it('rejects methods other than DELETE', async () => {
    const { req, res } = createMocks({ method: 'GET', query: { ref: 'default', id: 'user-1' } })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(405)
  })
})
