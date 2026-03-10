import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMocks } from 'node-mocks-http'

vi.mock('lib/api/self-hosted/provisioner', () => ({
  getProvisioner: vi.fn(),
}))

vi.mock('lib/constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lib/constants')>()
  return { ...actual, IS_PLATFORM: false }
})

import { getProvisioner } from 'lib/api/self-hosted/provisioner'
import handler from 'pages/api/platform/projects/[ref]/rotate-keys'

const mockRotateKeys = vi.fn()

const mockProvisioner = {
  rotateKeys: mockRotateKeys,
}

const SAMPLE_PROJECT = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'acme',
  schema_name: 'co_acme',
  anon_key: 'eyJhbGci.NEW_ANON_KEY',
  service_key: 'eyJhbGci.NEW_SERVICE_KEY',
  status: 'active' as const,
  created_at: '2026-01-01T00:00:00Z',
}

describe('POST /api/platform/projects/[ref]/rotate-keys', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(getProvisioner as ReturnType<typeof vi.fn>).mockReturnValue(mockProvisioner)
  })

  it('calls provisioner.rotateKeys with ref', async () => {
    mockRotateKeys.mockResolvedValue(SAMPLE_PROJECT)

    const { req, res } = createMocks({
      method: 'POST',
      query: { ref: 'acme' },
    })
    await handler(req, res)

    expect(mockRotateKeys).toHaveBeenCalledWith('acme')
  })

  it('returns updated project with new keys', async () => {
    mockRotateKeys.mockResolvedValue(SAMPLE_PROJECT)

    const { req, res } = createMocks({
      method: 'POST',
      query: { ref: 'acme' },
    })
    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.ref).toBe('acme')
    expect(data.anon_key).toBe('eyJhbGci.NEW_ANON_KEY')
    expect(data.service_key).toBe('eyJhbGci.NEW_SERVICE_KEY')
    expect(data.status).toBe('ACTIVE_HEALTHY')
  })

  it('returns 404 when project not found', async () => {
    mockRotateKeys.mockRejectedValue(new Error('Project "nonexistent" not found'))

    const { req, res } = createMocks({
      method: 'POST',
      query: { ref: 'nonexistent' },
    })
    await handler(req, res)

    expect(res._getStatusCode()).toBe(404)
  })

  it('returns 500 on rotation failure', async () => {
    mockRotateKeys.mockRejectedValue(new Error('Key signing failed'))

    const { req, res } = createMocks({
      method: 'POST',
      query: { ref: 'acme' },
    })
    await handler(req, res)

    expect(res._getStatusCode()).toBe(500)
  })
})
