import { gunzipSync } from 'node:zlib'
import type { ListObjectsV2Command, PutObjectCommand } from '@aws-sdk/client-s3'
import { S3Client } from '@aws-sdk/client-s3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ getGlobal: vi.fn() }))

vi.mock('../../../config', () => ({
  getConfig: () => ({
    profilingS3Bucket: 'profiles',
    profilingS3ForcePathStyle: false,
    profilingS3Region: 'us-east-1',
    version: '1.2.3',
  }),
}))
vi.mock('@platformatic/globals', () => ({ getGlobal: mocks.getGlobal }))
vi.mock('os', () => ({ hostname: () => 'storage-host-a' }))

import {
  InvalidProfileCursorError,
  InvalidProfileDateError,
  ProfileNotFoundError,
  ProfileStore,
} from './store'
import { buildProfileKey, parseProfileKey } from './store-key'

const provenance = { applicationId: 'storage', workerId: '3' }

function createStore() {
  return new ProfileStore(new S3Client({ region: 'us-east-1' }), 'profiles')
}

describe('profile object keys', () => {
  beforeEach(() => mocks.getGlobal.mockReset())

  it('encodes Watt application and worker provenance', () => {
    const key = buildProfileKey(
      {
        class: 'auto',
        kind: 'cpu',
        reason: 'elu-sustained',
        startedAt: new Date('2026-07-12T14:30:12.123Z'),
        durationSeconds: 30,
      },
      provenance
    )

    expect(key).toMatch(
      /^v1\/auto\/\d{13}-[a-f0-9]{12}\/cpu\/d000030s_elu-sustained_storage-host-a_a\.storage_w\.3_p\.\d+_1\.2\.3\.pprof\.gz$/
    )
    expect(parseProfileKey(key)).toMatchObject({ key, applicationId: 'storage', workerId: '3' })
  })

  it('sorts newer captures first across kinds and dates', () => {
    mocks.getGlobal.mockReturnValue(undefined)
    const newer = buildProfileKey(
      {
        class: 'auto',
        kind: 'heap',
        reason: 'delay-severe',
        startedAt: new Date('2026-07-13T00:00:00.000Z'),
        durationSeconds: 30,
      },
      provenance
    )
    const older = buildProfileKey(
      {
        class: 'auto',
        kind: 'cpu',
        reason: 'elu-sustained',
        startedAt: new Date('2026-07-12T23:59:59.999Z'),
        durationSeconds: 30,
      },
      provenance
    )

    expect(newer < older).toBe(true)
  })

  it('normalizes long untrusted boundary runs without a backtracking trim', () => {
    mocks.getGlobal.mockReturnValue(undefined)
    const key = buildProfileKey(
      {
        class: 'auto',
        kind: 'cpu',
        reason: `${'-'.repeat(10_000)}admin event${'-'.repeat(10_000)}`,
        startedAt: new Date('2026-07-12T14:30:12.123Z'),
        durationSeconds: 30,
      },
      provenance
    )

    expect(key).toMatch(/_admin-event_storage-host-a_/)
  })

  it('preserves uploaded Watt provenance when listing', async () => {
    const store = createStore()
    const send = vi.spyOn(store.client, 'send').mockResolvedValue({} as never)

    try {
      await store.archive(
        {
          class: 'auto',
          kind: 'cpu',
          reason: 'elu-sustained',
          startedAt: new Date('2026-07-12T14:30:12.123Z'),
          durationSeconds: 30,
        },
        Buffer.from('profile'),
        provenance
      )
      const command = send.mock.calls[0][0] as PutObjectCommand
      const key = command.input.Key!
      expect(command.input).not.toHaveProperty('IfNoneMatch')
      expect(command.input).not.toHaveProperty('Metadata')
      expect(command.input.ContentType).toBe('application/gzip')
      const uploadedProfile = Buffer.from(command.input.Body as Uint8Array)
      expect([...uploadedProfile.subarray(0, 2)]).toEqual([0x1f, 0x8b])
      expect(gunzipSync(uploadedProfile).toString()).toBe('profile')

      send.mockResolvedValueOnce({ Contents: [{ Key: key }] } as never)
      const result = await store.list({ class: 'auto', limit: 1 })
      expect(result).toEqual({
        profiles: [
          expect.objectContaining({
            hostname: 'storage-host-a',
            applicationId: 'storage',
            workerId: '3',
            processId: process.pid,
            build: '1.2.3',
          }),
        ],
        cursor: undefined,
      })
      expect(result.profiles[0]).not.toHaveProperty('id')
    } finally {
      store.destroy()
    }
  })

  it('fills a filtered UTC-day page across S3 scan pages', async () => {
    mocks.getGlobal.mockReturnValue(undefined)
    const store = createStore()
    const key = (startedAt: string, kind: 'cpu' | 'heap' = 'cpu') =>
      buildProfileKey(
        {
          class: 'auto',
          kind,
          reason: 'elu-sustained',
          startedAt: new Date(startedAt),
          durationSeconds: 30,
        },
        provenance
      )
    const nextDay = key('2026-07-13T00:00:00.000Z')
    const wrongKind = key('2026-07-12T21:00:00.000Z', 'heap')
    const first = key('2026-07-12T20:00:00.000Z')
    const second = key('2026-07-12T19:00:00.000Z')
    const olderDay = key('2026-07-11T23:59:59.999Z')
    const send = vi
      .spyOn(store.client, 'send')
      .mockResolvedValueOnce({
        Contents: [{ Key: nextDay }, { Key: wrongKind }],
        IsTruncated: true,
      } as never)
      .mockResolvedValueOnce({
        Contents: [{ Key: first }, { Key: second }, { Key: olderDay }],
      } as never)

    try {
      const result = await store.list({
        class: 'auto',
        kind: 'cpu',
        date: '2026-07-12',
        limit: 2,
      })

      expect(result.profiles.map((profile) => profile.key)).toEqual([first, second])
      expect(Buffer.from(result.cursor!, 'base64url').toString('utf8')).toBe(second)
      expect(send).toHaveBeenCalledTimes(2)
      const firstCommand = send.mock.calls[0][0] as ListObjectsV2Command
      const secondCommand = send.mock.calls[1][0] as ListObjectsV2Command
      expect(firstCommand.input).toMatchObject({
        Prefix: 'v1/auto/',
        MaxKeys: 1000,
      })
      const reverseEnd = `${9_999_999_999_999 - Date.parse('2026-07-13T00:00:00.000Z')}`
      expect(firstCommand.input.StartAfter).toBe(`v1/auto/${reverseEnd}/`)
      expect(secondCommand.input.StartAfter).toBe(wrongKind)
    } finally {
      store.destroy()
    }
  })

  it('rejects impossible UTC profile dates before listing S3', async () => {
    const store = createStore()
    const send = vi.spyOn(store.client, 'send').mockResolvedValue({} as never)

    try {
      await expect(
        store.list({ class: 'auto', date: '2026-02-30', limit: 20 })
      ).rejects.toBeInstanceOf(InvalidProfileDateError)
      expect(send).not.toHaveBeenCalled()
    } finally {
      store.destroy()
    }
  })

  it('resumes listing after the last scanned key cursor', async () => {
    mocks.getGlobal.mockReturnValue(undefined)
    const store = createStore()
    const previousKey = buildProfileKey(
      {
        class: 'auto',
        kind: 'cpu',
        reason: 'elu-sustained',
        startedAt: new Date('2026-07-12T20:00:00.000Z'),
        durationSeconds: 30,
      },
      provenance
    )
    const send = vi.spyOn(store.client, 'send').mockResolvedValue({ Contents: [] } as never)

    try {
      await store.list({
        class: 'auto',
        cursor: Buffer.from(previousKey).toString('base64url'),
        limit: 20,
      })

      const command = send.mock.calls[0][0] as ListObjectsV2Command
      expect(command.input.StartAfter).toBe(previousKey)
      expect(command.input.MaxKeys).toBe(20)
    } finally {
      store.destroy()
    }
  })

  it('rejects a malformed cursor before listing S3', async () => {
    const store = createStore()
    const send = vi.spyOn(store.client, 'send')

    try {
      await expect(
        store.list({ class: 'auto', cursor: 'not+a+cursor', limit: 20 })
      ).rejects.toBeInstanceOf(InvalidProfileCursorError)
      expect(send).not.toHaveBeenCalled()
    } finally {
      store.destroy()
    }
  })

  it('maps invalid and missing profile keys to a not-found error', async () => {
    const store = createStore()
    const send = vi.spyOn(store.client, 'send')

    try {
      await expect(store.get('not-a-profile')).rejects.toBeInstanceOf(ProfileNotFoundError)
      expect(send).not.toHaveBeenCalled()

      const key = buildProfileKey(
        {
          class: 'auto',
          kind: 'cpu',
          reason: 'elu-sustained',
          startedAt: new Date('2026-07-12T14:30:12.123Z'),
          durationSeconds: 30,
        },
        provenance
      )
      send.mockRejectedValueOnce(Object.assign(new Error('missing'), { name: 'NotFound' }))

      await expect(store.get(key)).rejects.toBeInstanceOf(ProfileNotFoundError)
    } finally {
      store.destroy()
    }
  })

  it('preserves operational S3 failures', async () => {
    const store = createStore()
    const error = Object.assign(new Error('forbidden'), { name: 'AccessDenied' })
    vi.spyOn(store.client, 'send').mockRejectedValue(error)
    const key = buildProfileKey(
      {
        class: 'manual',
        kind: 'heap',
        reason: 'admin',
        startedAt: new Date('2026-07-12T14:30:12.123Z'),
        durationSeconds: 30,
      },
      provenance
    )

    try {
      await expect(store.get(key)).rejects.toBe(error)
    } finally {
      store.destroy()
    }
  })
})
