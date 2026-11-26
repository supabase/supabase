import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Route } from '@/routes/api/platform/storage/$ref/buckets/$id/objects/download'
import { callRoute } from '@/tests/lib/server-route'

const mocks = vi.hoisted(() => ({
  download: vi.fn(),
  from: vi.fn(),
}))

vi.mock('@/lib/api/self-hosted-admin', () => ({
  selfHostedSupabaseAdmin: {
    storage: {
      from: mocks.from.mockImplementation(() => ({
        download: mocks.download,
      })),
    },
  },
}))

const downloadRequest = (path: string) =>
  new Request('http://localhost/api/platform/storage/default/buckets/avatars/objects/download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }),
  })

describe('/api/platform/storage/$ref/buckets/$id/objects/download', () => {
  beforeEach(() => {
    mocks.download.mockReset()
    mocks.from.mockClear()
  })

  it('returns binary octet-stream bytes on POST success', async () => {
    const payload = new Uint8Array([0x89, 0x50, 0x4e, 0x47])
    mocks.download.mockResolvedValue({
      data: new Blob([payload], { type: 'image/png' }),
      error: null,
    })

    const response = await callRoute(Route, downloadRequest('logo.png'), {
      ref: 'default',
      id: 'avatars',
    })

    expect(mocks.from).toHaveBeenCalledWith('avatars')
    expect(mocks.download).toHaveBeenCalledWith('logo.png')
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/octet-stream')
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(payload)
  })

  it('returns 400 when storage download returns an error', async () => {
    mocks.download.mockResolvedValue({ data: null, error: { message: 'Object not found' } })

    const response = await callRoute(Route, downloadRequest('missing.png'), {
      ref: 'default',
      id: 'avatars',
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: { message: 'Object not found' } })
  })
})
