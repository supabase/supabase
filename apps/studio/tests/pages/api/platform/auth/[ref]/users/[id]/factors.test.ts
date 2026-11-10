import { createMocks } from 'node-mocks-http'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import handler from '@/pages/api/platform/auth/[ref]/users/[id]/factors'

const { listFactorsMock, deleteFactorMock } = vi.hoisted(() => ({
  listFactorsMock: vi.fn(),
  deleteFactorMock: vi.fn(),
}))

vi.mock('@/lib/constants', () => ({
  IS_PLATFORM: false,
}))

vi.mock('@/lib/api/self-hosted-admin', () => ({
  selfHostedSupabaseAdmin: {
    auth: {
      admin: {
        mfa: {
          listFactors: listFactorsMock,
          deleteFactor: deleteFactorMock,
        },
      },
    },
  },
}))

describe('/api/platform/auth/[ref]/users/[id]/factors', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })
  it('waits for factor deletion to finish before responding', async () => {
    let resolveDelete!: (value: { error: null }) => void

    listFactorsMock.mockResolvedValue({
      data: {
        factors: [{ id: 'factor-1' }],
      },
      error: null,
    })

    deleteFactorMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveDelete = resolve
        })
    )

    const { req, res } = createMocks({
      method: 'DELETE',
      query: {
        ref: 'test-project',
        id: 'test-user',
      },
    })

    let handlerSettled = false

    const responsePromise = handler(req, res).then(() => {
      handlerSettled = true
    })

    try {
      await vi.waitFor(() => {
        expect(deleteFactorMock).toHaveBeenCalledOnce()
      })

      expect(handlerSettled).toBe(false)
    } finally {
      resolveDelete({ error: null })
    }

    await responsePromise

    expect(res._getStatusCode()).toBe(200)
    expect(JSON.parse(res._getData())).toEqual({
      data: null,
      error: null,
    })

    expect(deleteFactorMock).toHaveBeenCalledWith({
      id: 'factor-1',
      userId: 'test-user',
    })
  })

  it('returns 400 when factor deletion fails', async () => {
    listFactorsMock.mockResolvedValue({
      data: {
        factors: [{ id: 'factor-1' }],
      },
      error: null,
    })

    deleteFactorMock.mockResolvedValue({
      error: { message: 'Unable to delete factor' },
    })

    const { req, res } = createMocks({
      method: 'DELETE',
      query: {
        ref: 'test-project',
        id: 'test-user',
      },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)

    expect(JSON.parse(res._getData())).toEqual({
      error: { message: 'Unable to delete factor' },
    })

    expect(deleteFactorMock).toHaveBeenCalledOnce()
  })

  it('deletes all factors for the user', async () => {
    listFactorsMock.mockResolvedValue({
      data: {
        factors: [{ id: 'factor-1' }, { id: 'factor-2' }],
      },
      error: null,
    })

    deleteFactorMock.mockResolvedValue({ error: null })

    const { req, res } = createMocks({
      method: 'DELETE',
      query: {
        ref: 'test-project',
        id: 'test-user',
      },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)

    expect(deleteFactorMock).toHaveBeenCalledTimes(2)

    expect(deleteFactorMock).toHaveBeenNthCalledWith(1, {
      id: 'factor-1',
      userId: 'test-user',
    })

    expect(deleteFactorMock).toHaveBeenNthCalledWith(2, {
      id: 'factor-2',
      userId: 'test-user',
    })
  })
})
