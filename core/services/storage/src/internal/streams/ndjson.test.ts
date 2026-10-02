import { NdJsonTransform } from '@internal/streams/ndjson'
import { Buffer } from 'buffer'

/**
 * Helper that writes the given chunks into the transform,
 * collects all the parsed objects (in order), and resolves
 * them—or rejects on error.
 */
function collect(transform: NdJsonTransform, chunks: Buffer[]): Promise<object[]> {
  return new Promise((resolve, reject) => {
    const out: object[] = []
    transform.on('data', (obj) => out.push(obj))
    transform.on('error', (err) => reject(err))
    transform.on('end', () => resolve(out))
    for (const c of chunks) transform.write(c)
    transform.end()
  })
}

describe('NdJsonTransform', () => {
  it('parses a single JSON object terminated by newline', async () => {
    const t = new NdJsonTransform()
    const result = await collect(t, [Buffer.from('{"foo":123}\n')])
    expect(result).toEqual([{ foo: 123 }])
  })

  it('parses multiple JSON objects in one chunk', async () => {
    const t = new NdJsonTransform()
    const chunk = Buffer.from('{"a":1}\n{"b":2}\n')
    const result = await collect(t, [chunk])
    expect(result).toEqual([{ a: 1 }, { b: 2 }])
  })

  it('skips empty and whitespace-only lines', async () => {
    const t = new NdJsonTransform()
    const chunk = Buffer.from('\n   \n{"x":10}\n  \n')
    const result = await collect(t, [chunk])
    expect(result).toEqual([{ x: 10 }])
  })

  it('parses JSON split across multiple chunks', async () => {
    const t = new NdJsonTransform()
    const chunks = [Buffer.from('{"split":'), Buffer.from('true}\n')]
    const result = await collect(t, chunks)
    expect(result).toEqual([{ split: true }])
  })

  it('parses final line without trailing newline on flush', async () => {
    const t = new NdJsonTransform()
    const chunks = [Buffer.from('{"end":"last"}')]
    const result = await collect(t, chunks)
    expect(result).toEqual([{ end: 'last' }])
  })

  it('propagates parse errors in _transform (invalid JSON with newline)', async () => {
    const t = new NdJsonTransform()
    const bad = Buffer.from('{"foo": bad}\n')
    await expect(collect(t, [bad])).rejects.toThrow(/Invalid JSON on flush:/)
  })

  it('propagates parse errors in _flush (invalid final JSON)', async () => {
    const t = new NdJsonTransform()
    const bad = Buffer.from('{"incomplete":123')
    await expect(collect(t, [bad])).rejects.toThrow(/Invalid JSON on flush:/)
  })

  it('handles multi-byte UTF-8 characters split across chunk boundary', async () => {
    const t = new NdJsonTransform()
    const full = Buffer.from('{"emoji":"💩"}\n', 'utf8')
    // Split in the middle of the 4‑byte 💩 codepoint:
    const chunk1 = full.slice(0, 12) // up through two bytes of the emoji
    const chunk2 = full.slice(12) // remainder of emoji + '}' + '\n'
    const result = await collect(t, [chunk1, chunk2])
    expect(result).toEqual([{ emoji: '💩' }])
  })

  it('emits no data for completely empty input', async () => {
    const t = new NdJsonTransform()
    const result = await collect(t, [])
    expect(result).toEqual([])
  })
})
