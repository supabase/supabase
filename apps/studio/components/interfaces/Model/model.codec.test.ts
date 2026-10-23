import { Blob } from 'node:buffer'
import { CompressionStream, DecompressionStream } from 'node:stream/web'
import { gunzipSync, gzipSync } from 'node:zlib'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { decodeModel, encodeModel, readBoundedStream } from './model.codec'
import { createExampleModel, MODEL_LIMITS, modelSchema } from './model.schema'
import example from '@/scripts/model/example.json'

const model = createExampleModel(new Date('2026-10-21T09:00:00Z'))
const fragment = (value: unknown) => `#v1=${gzipSync(JSON.stringify(value)).toString('base64url')}`

beforeAll(() => {
  vi.stubGlobal('Blob', Blob)
  vi.stubGlobal('CompressionStream', CompressionStream)
  vi.stubGlobal('DecompressionStream', DecompressionStream)
})
afterAll(() => vi.unstubAllGlobals())

describe('dashboard link boundary', () => {
  it('opens JSON compressed by Node, including the committed agent example', async () => {
    expect(await decodeModel(fragment(example))).toEqual(modelSchema.parse(example))
    expect(await decodeModel(fragment({ ...model, title: 'Database 🐘' }))).toEqual({
      ...model,
      title: 'Database 🐘',
    })
  })

  it('encodes links interoperable with Node gzip and browser decoding', async () => {
    const hash = await encodeModel(model)
    expect(
      JSON.parse(gunzipSync(Buffer.from(hash.slice(4), 'base64url')).toString('utf8'))
    ).toEqual(model)
    expect(await decodeModel(hash)).toEqual(model)
    expect(await decodeModel('')).toBeNull()
  })

  it.each([
    '#v2=abc',
    '#v1=***',
    '#v1=YQ',
    `#v1=${'a'.repeat(MODEL_LIMITS.encodedCharacters + 1)}`,
  ])('rejects invalid transport %#', async (hash) => {
    await expect(decodeModel(hash)).rejects.toThrow()
  })

  it.each([
    { ...model, panels: [{ metric: 'sql', query: 'select 1' }] },
    { ...model, version: 2 },
    { ...model, endpoint: 'https://example.com' },
    { ...model, start: 'invalid' },
    { ...model, start: '2026-10-21T08:00:00+02:00' },
    { ...model, end: model.start },
    { ...model, end: '2026-11-01T00:00:00Z' },
    { ...model, end: '2026-10-23T00:00:00Z' },
    { ...model, annotations: [{ at: '2026-10-01T00:00:00Z', label: 'Outside range' }] },
    { ...model, panels: [] },
    { ...model, panels: Array.from({ length: 9 }, () => ({ metric: 'cpu' })) },
  ])('rejects unsupported sources, invalid times and unbounded work %#', async (invalid) => {
    await expect(decodeModel(fragment(invalid))).rejects.toThrow('Invalid dashboard')
  })

  it('rejects highly compressed payloads exceeding the decompressed limit', async () => {
    await expect(
      decodeModel(fragment({ title: 'x'.repeat(MODEL_LIMITS.decompressedBytes + 1) }))
    ).rejects.toThrow('decompressed size limit')
  })

  it('cancels a stream as soon as its decompressed byte limit is crossed', async () => {
    const cancel = vi.fn()
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(4))
        controller.enqueue(new Uint8Array(4))
      },
      cancel,
    })
    await expect(readBoundedStream(stream, 6)).rejects.toThrow('size limit')
    expect(cancel).toHaveBeenCalledOnce()
  })

  it('cancels an outstanding read when its fragment is superseded', async () => {
    const cancel = vi.fn()
    const controller = new AbortController()
    const stream = new ReadableStream<Uint8Array>({ cancel })
    const read = readBoundedStream(stream, 100, controller.signal)
    controller.abort()
    await expect(read).rejects.toThrow()
    expect(cancel).toHaveBeenCalledOnce()
  })
})
