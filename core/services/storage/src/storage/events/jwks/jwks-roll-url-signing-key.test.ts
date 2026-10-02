import { vi } from 'vitest'

const { mockRollUrlSigningJwk, mockInfo, mockError } = vi.hoisted(() => ({
  mockRollUrlSigningJwk: vi.fn(),
  mockInfo: vi.fn(),
  mockError: vi.fn(),
}))

vi.mock('@internal/database', () => ({
  jwksManager: {
    rollUrlSigningJwk: mockRollUrlSigningJwk,
  },
}))

vi.mock('@internal/monitoring', () => ({
  logger: {},
  logSchema: {
    info: mockInfo,
    error: mockError,
    warning: vi.fn(),
  },
}))

vi.mock('../base-event', () => ({
  BaseEvent: class {},
}))

import { JwksRollUrlSigningKey } from './jwks-roll-url-signing-key'

function makeJob(overrides?: Partial<Record<string, unknown>>) {
  return {
    data: {
      tenantId: 'tenant-a',
      tenant: {
        ref: 'tenant-a',
      },
      sbReqId: 'sb-req-123',
    },
    ...overrides,
  }
}

describe('JwksRollUrlSigningKey.handle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('falls back to HS512 when keyType is not set on the job (pre-deploy queue items)', async () => {
    mockRollUrlSigningJwk.mockResolvedValue({
      oldKid: 'old-kid',
      newKid: 'new-kid',
    })

    await expect(JwksRollUrlSigningKey.handle(makeJob() as never)).resolves.toBeUndefined()

    expect(mockRollUrlSigningJwk).toHaveBeenCalledWith('tenant-a', 'HS512')
    expect(mockInfo).toHaveBeenCalledWith(
      expect.anything(),
      '[Jwks] rolled url signing key for tenant tenant-a (old: old-kid, new: new-kid)',
      expect.objectContaining({
        type: 'jwks',
        project: 'tenant-a',
        sbReqId: 'sb-req-123',
      })
    )
  })

  it('uses the explicit keyType from the job instead of the HS512 fallback', async () => {
    mockRollUrlSigningJwk.mockResolvedValue({
      oldKid: 'old-kid',
      newKid: 'new-kid',
    })

    const job = makeJob()
    job.data = { ...job.data, keyType: 'ES256' } as never

    await expect(JwksRollUrlSigningKey.handle(job as never)).resolves.toBeUndefined()

    expect(mockRollUrlSigningJwk).toHaveBeenCalledWith('tenant-a', 'ES256')
  })

  it('logs sbReqId on failure', async () => {
    const error = new Error('boom')
    mockRollUrlSigningJwk.mockRejectedValue(error)

    await expect(JwksRollUrlSigningKey.handle(makeJob() as never)).rejects.toThrow(error)

    expect(mockError).toHaveBeenCalledWith(
      expect.anything(),
      '[Jwks] roll url signing key failed for tenant tenant-a',
      expect.objectContaining({
        type: 'jwks',
        error,
        project: 'tenant-a',
        sbReqId: 'sb-req-123',
      })
    )
  })
})
