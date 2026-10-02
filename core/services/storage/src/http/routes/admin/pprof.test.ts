import Fastify from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { withFiniteAjv } from '../../finite'

const mocks = vi.hoisted(() => ({
  heapSnapshot: vi.fn(),
  list: vi.fn(),
  get: vi.fn(),
  triggerManualProfile: vi.fn(),
  profilingS3Bucket: 'profiles' as string | undefined,
}))

vi.mock('@internal/monitoring/pprof/controller', () => ({
  ProfilingBusyError: class ProfilingBusyError extends Error {},
  heapSnapshotController: {
    heapSnapshot: mocks.heapSnapshot,
    isActive: () => false,
  },
}))
vi.mock('@internal/monitoring/pprof/store', () => ({
  InvalidProfileCursorError: class InvalidProfileCursorError extends Error {},
  InvalidProfileDateError: class InvalidProfileDateError extends Error {},
  ProfileNotFoundError: class ProfileNotFoundError extends Error {},
  closeProfileStore: vi.fn(),
  getProfileStore: () => ({ list: mocks.list, get: mocks.get }),
}))
vi.mock('@internal/monitoring/pprof/trigger', () => ({
  triggerManualProfile: mocks.triggerManualProfile,
}))
vi.mock('../../../config', () => ({
  getConfig: () => ({
    adminApiKeys: 'secret',
    logLevel: 'info',
    profilingS3Bucket: mocks.profilingS3Bucket,
  }),
}))

import { ProfilingBusyError } from '@internal/monitoring/pprof/controller'
import { InvalidProfileDateError, ProfileNotFoundError } from '@internal/monitoring/pprof/store'
import { blobResponse } from '../../plugins/blob-response'
import { signals } from '../../plugins/signals'
import routes from './pprof'

const profileKey =
  'v1/auto/8215147911279-cc8065289c6e/cpu/d000010s_event-loop-delay-severe_storage-host_a.storage_w.0_p.123_1.2.3.pprof.gz'

async function app() {
  const fastify = Fastify(withFiniteAjv({}))
  await fastify.register(blobResponse)
  await fastify.register(signals)
  await fastify.register(routes, { prefix: '/debug/pprof' })
  return fastify
}

describe('admin pprof routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.profilingS3Bucket = 'profiles'
    mocks.triggerManualProfile.mockResolvedValue({ scheduled: true })
  })

  it.each([
    ['profile', 'cpu'],
    ['heap', 'heap'],
  ] as const)('schedules a Watt manual %s capture for 30 seconds by default', async (path, type) => {
    const fastify = await app()
    const response = await fastify.inject({
      method: 'GET',
      url: `/debug/pprof/${path}`,
      headers: { apikey: 'secret' },
    })

    expect(response.statusCode).toBe(202)
    expect(response.headers['cache-control']).toBe('no-store')
    expect(response.json()).toEqual({
      scheduled: true,
      class: 'manual',
      kind: type,
      message: 'Profile capture scheduled; use list and download to retrieve it',
    })
    expect(mocks.triggerManualProfile).toHaveBeenCalledWith(type, 30)
    await fastify.close()
  })

  it.each([
    ['busy', 409, 'A CPU profile capture is already active for this worker'],
    ['not-watt', 501, 'Manual profiling requires Watt'],
    ['unavailable', 503, 'Watt profiling extension is unavailable'],
  ] as const)('maps a %s manual trigger result', async (reason, status, error) => {
    mocks.triggerManualProfile.mockResolvedValue({ scheduled: false, reason })
    const fastify = await app()

    try {
      const response = await fastify.inject({
        method: 'GET',
        url: '/debug/pprof/profile',
        headers: { apikey: 'secret' },
      })

      expect(response.statusCode).toBe(status)
      expect(response.json()).toEqual({ error })
    } finally {
      await fastify.close()
    }
  })

  it.each([
    '/debug/pprof/profile?seconds=Infinity',
    '/debug/pprof/profile?seconds=1e999',
    '/debug/pprof/heap?seconds=-1e999',
    '/debug/pprof/profiles?class=auto&limit=Infinity',
  ])('rejects non-finite numeric query values: %s', async (url) => {
    const fastify = await app()

    try {
      const response = await fastify.inject({
        method: 'GET',
        url,
        headers: { apikey: 'secret' },
      })

      expect(response.statusCode).toBe(400)
      expect(response.json().message).toContain('finite')
      expect(mocks.triggerManualProfile).not.toHaveBeenCalled()
      expect(mocks.list).not.toHaveBeenCalled()
    } finally {
      await fastify.close()
    }
  })

  it('uses a portable filename for heap snapshots', async () => {
    mocks.heapSnapshot.mockReturnValue(Buffer.from('{}'))
    const fastify = await app()
    const response = await fastify.inject({
      method: 'GET',
      url: '/debug/pprof/heap-snapshot',
      headers: { apikey: 'secret' },
    })

    expect(response.statusCode).toBe(200)
    expect(response.headers['cache-control']).toBe('no-store')
    expect(response.headers['content-type']).toBe('application/json')
    expect(response.headers['content-disposition']).toMatch(
      /^attachment; filename="heap-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.heapsnapshot"$/
    )
    await fastify.close()
  })

  it('does not attach download headers to busy heap snapshot responses', async () => {
    mocks.heapSnapshot.mockImplementation(() => {
      throw new ProfilingBusyError('A heap snapshot capture is already active')
    })
    const fastify = await app()

    try {
      const response = await fastify.inject({
        method: 'GET',
        url: '/debug/pprof/heap-snapshot',
        headers: { apikey: 'secret' },
      })

      expect(response.statusCode).toBe(409)
      expect(response.headers['content-type']).toMatch(/^application\/json/)
      expect(response.headers['content-disposition']).toBeUndefined()
      expect(response.json()).toEqual({ error: 'A heap snapshot capture is already active' })
    } finally {
      await fastify.close()
    }
  })

  it('lists stored auto and manual profiles', async () => {
    mocks.list.mockResolvedValue({ profiles: [], cursor: 'next' })
    const fastify = await app()
    const response = await fastify.inject({
      method: 'GET',
      url: '/debug/pprof/profiles?class=auto&kind=cpu&date=2026-07-13&limit=20',
      headers: { apikey: 'secret' },
    })

    expect(response.json()).toEqual({ profiles: [], cursor: 'next' })
    expect(mocks.list).toHaveBeenCalledWith({
      class: 'auto',
      kind: 'cpu',
      date: '2026-07-13',
      limit: 20,
    })
    await fastify.close()
  })

  it('rejects the old automatic class name', async () => {
    const fastify = await app()
    const response = await fastify.inject({
      method: 'GET',
      url: '/debug/pprof/profiles?class=automatic',
      headers: { apikey: 'secret' },
    })

    expect(response.statusCode).toBe(400)
    expect(mocks.list).not.toHaveBeenCalled()
    await fastify.close()
  })

  it('rejects invalid profile dates', async () => {
    const fastify = await app()
    const response = await fastify.inject({
      method: 'GET',
      url: '/debug/pprof/profiles?class=auto&date=2026-02-30',
      headers: { apikey: 'secret' },
    })

    expect(response.statusCode).toBe(400)
    expect(mocks.list).not.toHaveBeenCalled()
    await fastify.close()
  })

  it('maps profile-store date validation failures to HTTP 400', async () => {
    mocks.list.mockRejectedValue(new InvalidProfileDateError('Invalid profile date'))
    const fastify = await app()
    const response = await fastify.inject({
      method: 'GET',
      url: '/debug/pprof/profiles?class=auto&date=2026-02-28',
      headers: { apikey: 'secret' },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({ error: 'Invalid profile date' })
    await fastify.close()
  })

  it('rejects malformed profile cursors', async () => {
    const fastify = await app()
    const response = await fastify.inject({
      method: 'GET',
      url: '/debug/pprof/profiles?class=auto&cursor=not%2Ba%2Bcursor',
      headers: { apikey: 'secret' },
    })

    expect(response.statusCode).toBe(400)
    expect(mocks.list).not.toHaveBeenCalled()
    await fastify.close()
  })

  it('downloads profiles using their S3 keys', async () => {
    mocks.get.mockResolvedValue({
      object: { ContentType: 'application/gzip', Body: Buffer.from('stored') },
      profile: {
        class: 'auto',
        kind: 'cpu',
        startedAt: new Date('2026-07-13T12:00:00.000Z'),
      },
    })
    const fastify = await app()

    const download = await fastify.inject({
      method: 'GET',
      url: `/debug/pprof/profiles/download?key=${encodeURIComponent(profileKey)}`,
      headers: { apikey: 'secret' },
    })

    expect(download.body).toBe('stored')
    expect(download.headers['cache-control']).toBe('no-store')
    expect(mocks.get).toHaveBeenCalledWith(profileKey)
    await fastify.close()
  })

  it('streams Blob profile bodies instead of sending object payloads to Fastify', async () => {
    mocks.get.mockResolvedValue({
      object: { ContentType: 'application/gzip', Body: new Blob(['stored']) },
      profile: {
        class: 'auto',
        kind: 'cpu',
        startedAt: new Date('2026-07-13T12:00:00.000Z'),
      },
    })
    const fastify = await app()

    try {
      const download = await fastify.inject({
        method: 'GET',
        url: `/debug/pprof/profiles/download?key=${encodeURIComponent(profileKey)}`,
        headers: { apikey: 'secret' },
      })

      expect(download.statusCode).toBe(200)
      expect(download.headers['content-type']).toBe('application/gzip')
      expect(download.body).toBe('stored')
    } finally {
      await fastify.close()
    }
  })

  it('returns 404 only when the stored profile is missing', async () => {
    mocks.get.mockRejectedValue(new ProfileNotFoundError('Profile not found'))
    const fastify = await app()

    const download = await fastify.inject({
      method: 'GET',
      url: `/debug/pprof/profiles/download?key=${encodeURIComponent(profileKey)}`,
      headers: { apikey: 'secret' },
    })

    expect(download.statusCode).toBe(404)
    await fastify.close()
  })

  it('reports operational S3 failures as server errors', async () => {
    mocks.get.mockRejectedValue(new Error('S3 unavailable'))
    const fastify = await app()

    const download = await fastify.inject({
      method: 'GET',
      url: `/debug/pprof/profiles/download?key=${encodeURIComponent(profileKey)}`,
      headers: { apikey: 'secret' },
    })

    expect(download.statusCode).toBe(500)
    await fastify.close()
  })

  it('requires a key query parameter for profile download', async () => {
    const fastify = await app()
    const response = await fastify.inject({
      method: 'GET',
      url: '/debug/pprof/profiles/download',
      headers: { apikey: 'secret' },
    })

    expect(response.statusCode).toBe(400)
    expect(mocks.get).not.toHaveBeenCalled()
    await fastify.close()
  })

  it('rejects malformed profile keys before accessing S3', async () => {
    const fastify = await app()
    const response = await fastify.inject({
      method: 'GET',
      url: '/debug/pprof/profiles/download?key=..%2Fprofiles',
      headers: { apikey: 'secret' },
    })

    expect(response.statusCode).toBe(400)
    expect(mocks.get).not.toHaveBeenCalled()
    await fastify.close()
  })

  it('protects profiling routes with the admin API key', async () => {
    const fastify = await app()
    const response = await fastify.inject({ method: 'GET', url: '/debug/pprof/profiles' })
    expect(response.statusCode).toBe(401)
    expect(response.headers['cache-control']).toBe('no-store')
    await fastify.close()
  })
})
