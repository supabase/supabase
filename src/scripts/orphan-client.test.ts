import { once } from 'events'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { Readable } from 'stream'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  fetchOrphanStream,
  main,
  parseConfig,
  resolveAdminUrl,
  writeDeleteOrphanStream,
  writeListOrphanStream,
} from './orphan-client'

class PendingNdjsonStream extends Readable {
  private sent = false

  _read() {
    if (this.sent) {
      return
    }

    this.sent = true
    this.push(
      '{"event":"data","type":"s3Orphans","value":[{"name":"my-object","version":"v1","size":1}]}\n'
    )
  }

  _destroy(_error: Error | null, callback: (error?: Error | null) => void) {
    callback(null)
  }
}

describe('resolveAdminUrl', () => {
  it('preserves base URL path prefixes for leading-slash request paths', () => {
    const url = resolveAdminUrl(
      'http://localhost:54321/admin/',
      '/tenants/test/buckets/public/orphan-objects'
    )

    expect(url.toString()).toBe(
      'http://localhost:54321/admin/tenants/test/buckets/public/orphan-objects'
    )
  })

  it('adds query parameters when provided', () => {
    const url = resolveAdminUrl(
      'http://localhost:54321/admin/',
      '/tenants/test/buckets/public/orphan-objects',
      {
        before: '2026-04-17T12:00:00.000Z',
      }
    )

    expect(url.toString()).toBe(
      'http://localhost:54321/admin/tenants/test/buckets/public/orphan-objects?before=2026-04-17T12%3A00%3A00.000Z'
    )
  })
})

describe('parseConfig', () => {
  it('uses the default delete limit when DELETE_LIMIT is omitted', () => {
    expect(
      parseConfig({
        ADMIN_URL: 'http://localhost:54321/admin',
        ADMIN_API_KEY: 'test-key',
        TENANT_ID: 'tenant-id',
        BUCKET_ID: 'public',
      })
    ).toEqual({
      adminUrl: 'http://localhost:54321/admin',
      adminApiKey: 'test-key',
      tenantId: 'tenant-id',
      bucketId: 'public',
      deleteLimit: 1000000,
      before: undefined,
    })
  })

  it('reads ORPHAN_BEFORE into the request config', () => {
    expect(
      parseConfig({
        ADMIN_URL: 'http://localhost:54321/admin',
        ADMIN_API_KEY: 'test-key',
        TENANT_ID: 'tenant-id',
        BUCKET_ID: 'public',
        ORPHAN_BEFORE: '2026-04-17T12:00:00.000Z',
      })
    ).toEqual({
      adminUrl: 'http://localhost:54321/admin',
      adminApiKey: 'test-key',
      tenantId: 'tenant-id',
      bucketId: 'public',
      deleteLimit: 1000000,
      before: '2026-04-17T12:00:00.000Z',
    })
  })

  it.each([
    'not-a-number',
    '1x',
    '0',
    '-1',
  ])('rejects invalid DELETE_LIMIT input %s', (deleteLimit) => {
    expect(
      parseConfig({
        ADMIN_URL: 'http://localhost:54321/admin',
        ADMIN_API_KEY: 'test-key',
        TENANT_ID: 'tenant-id',
        BUCKET_ID: 'public',
        DELETE_LIMIT: deleteLimit,
      })
    ).toBe('Please provide a valid positive integer for DELETE_LIMIT')
  })
})

describe('main', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    process.exitCode = undefined
  })

  it('sets a non-zero exit code for invalid actions', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(
      main(
        {
          ADMIN_URL: 'http://localhost:54321/admin',
          ADMIN_API_KEY: 'test-key',
          TENANT_ID: 'tenant-id',
          BUCKET_ID: 'public',
        },
        ['node', 'orphan-client.ts', 'invalid']
      )
    ).resolves.toBe(false)

    expect(process.exitCode).toBe(1)
    expect(console.error).toHaveBeenCalledWith('Please provide an action: list or delete')
  })

  it('sets a non-zero exit code for invalid config', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(
      main(
        {
          ADMIN_URL: 'http://localhost:54321/admin',
          ADMIN_API_KEY: 'test-key',
          TENANT_ID: 'tenant-id',
        },
        ['node', 'orphan-client.ts', 'list']
      )
    ).resolves.toBe(false)

    expect(process.exitCode).toBe(1)
    expect(console.error).toHaveBeenCalledWith('Please provide a bucket ID')
  })
})

describe('fetchOrphanStream', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('builds list requests with the before query and ApiKey header', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{"event":"ping"}\n'))

    const { stream } = await fetchOrphanStream({
      action: 'list',
      adminApiKey: 'test-key',
      adminUrl: 'http://localhost:54321/admin',
      before: '2026-04-17T12:00:00.000Z',
      bucketId: 'public',
      tenantId: 'tenant-id',
    })

    stream.resume()
    await once(stream, 'end')

    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [requestUrl, requestInit] = fetchMock.mock.calls[0]

    expect(String(requestUrl)).toBe(
      'http://localhost:54321/admin/tenants/tenant-id/buckets/public/orphan-objects?before=2026-04-17T12%3A00%3A00.000Z'
    )
    expect(requestInit?.method).toBe('GET')
    expect(requestInit?.body).toBeUndefined()
    expect((requestInit?.headers as Headers).get('ApiKey')).toBe('test-key')
    expect((requestInit?.headers as Headers).get('Content-Type')).toBeNull()
    expect(requestInit?.signal).toBeInstanceOf(AbortSignal)
  })

  it('builds delete requests with a JSON body', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{"event":"ping"}\n'))

    const { stream } = await fetchOrphanStream({
      action: 'delete',
      adminApiKey: 'test-key',
      adminUrl: 'http://localhost:54321/admin',
      bucketId: 'public',
      tenantId: 'tenant-id',
    })

    stream.resume()
    await once(stream, 'end')

    const [, requestInit] = fetchMock.mock.calls[0]

    expect(requestInit?.method).toBe('DELETE')
    expect(JSON.parse(requestInit?.body as string)).toEqual({ deleteS3Keys: true })
    expect((requestInit?.headers as Headers).get('ApiKey')).toBe('test-key')
    expect((requestInit?.headers as Headers).get('Content-Type')).toBe('application/json')
  })

  it('throws the HTTP status and body on failed responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('permission denied', {
        status: 403,
        statusText: 'Forbidden',
      })
    )

    await expect(
      fetchOrphanStream({
        action: 'list',
        adminUrl: 'http://localhost:54321/admin',
        bucketId: 'public',
        tenantId: 'tenant-id',
      })
    ).rejects.toThrow(
      'LIST http://localhost:54321/admin/tenants/tenant-id/buckets/public/orphan-objects failed with 403 Forbidden: permission denied'
    )
  })
})

describe('writeListOrphanStream', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('calls cancel after a successful write', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orphan-client-list-success-'))
    const filePath = path.join(tempDir, 'list.json')
    const requestStream = Readable.from(
      [
        '{"event":"data","type":"s3Orphans","value":[{"name":"my-object","version":"v1","size":1}]}\n',
      ],
      { objectMode: false }
    )
    const cancel = vi.fn()

    vi.spyOn(console, 'log').mockImplementation(() => {})

    try {
      await expect(
        writeListOrphanStream({
          requestStream,
          cancel,
          filePath,
        })
      ).resolves.toBeUndefined()

      expect(cancel).toHaveBeenCalledTimes(1)
      await expect(fs.readFile(filePath, 'utf8')).resolves.toContain('"my-object"')
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true })
    }
  })

  it('calls cancel when the local output write fails', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orphan-client-list-failure-'))
    const requestStream = Readable.from(
      [
        '{"event":"data","type":"s3Orphans","value":[{"name":"my-object","version":"v1","size":1}]}\n',
      ],
      { objectMode: false }
    )
    const cancel = vi.fn()

    vi.spyOn(console, 'log').mockImplementation(() => {})

    try {
      await expect(
        writeListOrphanStream({
          requestStream,
          cancel,
          filePath: tempDir,
        })
      ).rejects.toThrow()

      expect(cancel).toHaveBeenCalledTimes(1)
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true })
    }
  })
})

describe('writeDeleteOrphanStream', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('suppresses request-stream teardown errors after the delete limit cancels the stream', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orphan-client-delete-limit-'))
    const filePath = path.join(tempDir, 'delete-limit.json')
    const destroyError = Object.assign(new Error('stream closed early'), {
      code: 'ERR_STREAM_PREMATURE_CLOSE',
      name: 'PrematureCloseError',
    })
    const requestStream = new PendingNdjsonStream()
    const cancel = vi.fn(() => {
      requestStream.destroy()
      process.nextTick(() => {
        requestStream.emit('error', destroyError)
      })
    })

    vi.spyOn(console, 'log').mockImplementation(() => {})

    try {
      await expect(
        writeDeleteOrphanStream({
          requestStream,
          cancel,
          deleteLimit: 1,
          filePath,
        })
      ).resolves.toBeUndefined()

      expect(cancel).toHaveBeenCalledTimes(1)
      await expect(fs.readFile(filePath, 'utf8')).resolves.toContain('"my-object"')
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true })
    }
  })
})
