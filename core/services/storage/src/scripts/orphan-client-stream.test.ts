import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { Readable } from 'stream'
import { vi } from 'vitest'
import { writeStreamToJsonArray } from './orphan-client-stream'

describe('writeStreamToJsonArray', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'orphan-client-stream-'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  it('rejects when the server streams an error event', async () => {
    const filePath = path.join(tempDir, 'orphan-objects.json')
    const stream = Readable.from(
      [
        {
          event: 'data',
          type: 'dbOrphans',
          value: [{ name: 'my-object', version: 'v1', size: 1 }],
        },
        {
          event: 'error',
          error: {
            statusCode: '500',
            code: 'InternalError',
            error: 'InternalError',
            message: 'Entity expansion limit exceeded',
          },
        },
      ],
      { objectMode: true }
    )

    await expect(writeStreamToJsonArray(stream, filePath)).rejects.toThrow(
      '[InternalError] Entity expansion limit exceeded'
    )
    await expect(fs.readFile(filePath, 'utf8')).resolves.toContain('"my-object"')
  })

  it('creates parent directories for the output file', async () => {
    const filePath = path.join(tempDir, 'nested', 'orphan-objects.json')
    const stream = Readable.from(
      [
        {
          event: 'data',
          type: 's3Orphans',
          value: [{ name: 'my-object', version: 'v1', size: 1 }],
        },
      ],
      { objectMode: true }
    )

    await expect(writeStreamToJsonArray(stream, filePath)).resolves.toBeUndefined()
    await expect(fs.readFile(filePath, 'utf8')).resolves.toContain('"my-object"')
  })

  it('resolves after writing partial data when the delete limit is reached', async () => {
    const filePath = path.join(tempDir, 'delete-limit.json')
    const stream = Readable.from(
      (async function* () {
        yield {
          event: 'data' as const,
          type: 's3Orphans' as const,
          value: [{ name: 'my-object', version: 'v1', size: 1 }],
        }

        throw new Error('DELETE_LIMIT_REACHED')
      })(),
      { objectMode: true }
    )

    await expect(writeStreamToJsonArray(stream, filePath)).resolves.toBeUndefined()
    await expect(fs.readFile(filePath, 'utf8')).resolves.toContain('"my-object"')
  })

  it('rejects after closing the JSON array on input stream errors', async () => {
    const filePath = path.join(tempDir, 'stream-error.json')
    const stream = Readable.from(
      (async function* () {
        yield {
          event: 'data' as const,
          type: 's3Orphans' as const,
          value: [{ name: 'my-object', version: 'v1', size: 1 }],
        }

        throw new Error('upstream stream failed')
      })(),
      { objectMode: true }
    )

    await expect(writeStreamToJsonArray(stream, filePath)).rejects.toThrow('upstream stream failed')

    const content = await fs.readFile(filePath, 'utf8')

    expect(JSON.parse(content)).toEqual([
      {
        name: 'my-object',
        version: 'v1',
        size: 1,
        orphanType: 's3Orphans',
      },
    ])
  })

  it('normalizes non-Error input stream failures', async () => {
    const filePath = path.join(tempDir, 'non-error-stream-failure.json')
    const stream = new Readable({
      objectMode: true,
      read() {
        this.destroy('stream failed' as unknown as Error)
      },
    })

    await expect(writeStreamToJsonArray(stream, filePath)).rejects.toThrow(
      'Unexpected stream failure'
    )
  })

  it('ignores malformed events that include a value field but are not data events', async () => {
    const filePath = path.join(tempDir, 'invalid-event.json')
    const stream = Readable.from(
      [
        {
          event: 'unexpected',
          type: 's3Orphans',
          value: [{ name: 'my-object', version: 'v1', size: 1 }],
        },
      ] as Iterable<unknown>,
      { objectMode: true }
    )

    await expect(writeStreamToJsonArray(stream, filePath)).resolves.toBeUndefined()

    const content = await fs.readFile(filePath, 'utf8')

    expect(JSON.parse(content)).toEqual([])
    expect(console.warn).toHaveBeenCalled()
  })

  it('rejects when the local output stream cannot be opened', async () => {
    const stream = Readable.from([], { objectMode: true })

    await expect(writeStreamToJsonArray(stream, tempDir)).rejects.toThrow()
  })
})
