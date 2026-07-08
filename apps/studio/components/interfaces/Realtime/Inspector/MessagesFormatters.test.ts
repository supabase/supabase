import { describe, expect, it } from 'vitest'

import { formatHexdump, isBinaryPayload, withBinaryPayloadPlaceholder } from './MessagesFormatters'

describe('isBinaryPayload', () => {
  it('returns true for ArrayBuffer', () => {
    expect(isBinaryPayload(new ArrayBuffer(0))).toBe(true)
    expect(isBinaryPayload(new ArrayBuffer(8))).toBe(true)
  })

  it('returns true for TypedArrays', () => {
    expect(isBinaryPayload(new Uint8Array([1, 2, 3]))).toBe(true)
    expect(isBinaryPayload(new Int16Array(4))).toBe(true)
    expect(isBinaryPayload(new Float32Array(2))).toBe(true)
  })

  it('returns true for DataView', () => {
    expect(isBinaryPayload(new DataView(new ArrayBuffer(4)))).toBe(true)
  })

  it('returns true for a TypedArray view with non-zero byteOffset', () => {
    const buffer = new ArrayBuffer(8)
    const view = new Uint8Array(buffer, 2, 4)
    expect(isBinaryPayload(view)).toBe(true)
  })

  it('returns false for nullish values', () => {
    expect(isBinaryPayload(null)).toBe(false)
    expect(isBinaryPayload(undefined)).toBe(false)
  })

  it('returns false for plain objects (including the legacy { type: "Buffer", data: [...] } shape)', () => {
    expect(isBinaryPayload({})).toBe(false)
    expect(isBinaryPayload({ type: 'Buffer', data: [1, 2, 3] })).toBe(false)
  })

  it('returns false for primitives and arrays of numbers', () => {
    expect(isBinaryPayload('hello')).toBe(false)
    expect(isBinaryPayload(42)).toBe(false)
    expect(isBinaryPayload([1, 2, 3])).toBe(false)
  })
})

describe('formatHexdump', () => {
  it('returns an empty string for an empty buffer', () => {
    expect(formatHexdump(new ArrayBuffer(0))).toBe('')
    expect(formatHexdump(new Uint8Array(0))).toBe('')
  })

  it('renders a single row for "Hello World" with offset, byte groups, and ASCII gutter', () => {
    const bytes = new TextEncoder().encode('Hello World')
    const expected =
      '00000000  48 65 6c 6c 6f 20 57 6f  72 6c 64' + ' '.repeat(15) + '  |Hello World|'
    expect(formatHexdump(bytes)).toBe(expected)
  })

  it('renders all 16 bytes in one row with dots in the gutter for all-zero buffer', () => {
    const expected =
      '00000000  00 00 00 00 00 00 00 00  00 00 00 00 00 00 00 00  |................|'
    expect(formatHexdump(new Uint8Array(16))).toBe(expected)
  })

  it('renders two rows for a 17-byte buffer, padding the short last row so the gutter aligns', () => {
    const bytes = new Uint8Array(17).fill(0x41)
    const row1 = '00000000  41 41 41 41 41 41 41 41  41 41 41 41 41 41 41 41  |AAAAAAAAAAAAAAAA|'
    const row2 = '00000010  41' + ' '.repeat(21) + '  ' + ' '.repeat(23) + '  |A|'
    expect(formatHexdump(bytes)).toBe(`${row1}\n${row2}`)
  })

  it('increments the offset column on later rows', () => {
    const bytes = new Uint8Array(32)
    bytes.fill(0x41, 0, 16) // 'A' × 16
    bytes.fill(0x42, 16, 32) // 'B' × 16

    const secondRow = formatHexdump(bytes).split('\n')[1]
    const expected =
      '00000010  42 42 42 42 42 42 42 42  42 42 42 42 42 42 42 42  |BBBBBBBBBBBBBBBB|'
    expect(secondRow).toBe(expected)
  })

  it('replaces non-printable bytes with "." in the ASCII gutter, leaving printable bytes (including space and ~) intact', () => {
    // Boundary mix: 0x00 (null) and 0x1f (just below printable) → dot;
    // 0x20 (space) and 0x7e (~) → printable (lowest/highest);
    // 0x7f (DEL), 0x80, 0xff → dot.
    const bytes = new Uint8Array([0x00, 0x1f, 0x20, 0x41, 0x7e, 0x7f, 0x80, 0xff])
    const expected = '00000000  00 1f 20 41 7e 7f 80 ff  ' + ' '.repeat(23) + '  |.. A~...|'
    expect(formatHexdump(bytes)).toBe(expected)
  })

  it('respects the view window when given a TypedArray with byteOffset > 0', () => {
    const buffer = new ArrayBuffer(8)
    const all = new Uint8Array(buffer)
    all.set([0xaa, 0xbb, 0x48, 0x65, 0x6c, 0x6c, 0x6f, 0xff])

    const view = new Uint8Array(buffer, 2, 5) // "Hello"
    const expected =
      '00000000  48 65 6c 6c 6f' + ' '.repeat(9) + '  ' + ' '.repeat(23) + '  |Hello|'
    expect(formatHexdump(view)).toBe(expected)
  })
})

describe('withBinaryPayloadPlaceholder', () => {
  it('returns the same reference when the payload is not binary', () => {
    const metadata = { type: 'broadcast', event: 'e', payload: { hello: 'world' } }
    expect(withBinaryPayloadPlaceholder(metadata)).toBe(metadata)
  })

  it('returns null and undefined unchanged', () => {
    expect(withBinaryPayloadPlaceholder(null)).toBe(null)
    expect(withBinaryPayloadPlaceholder(undefined)).toBe(undefined)
  })

  it('replaces an ArrayBuffer payload with a byte-length placeholder, preserving siblings', () => {
    const original = {
      type: 'broadcast',
      event: 'binary-test',
      payload: new ArrayBuffer(11),
      meta: { id: 'abc' },
    }
    const result = withBinaryPayloadPlaceholder(original)

    expect(result).not.toBe(original)
    expect(original.payload).toBeInstanceOf(ArrayBuffer)
    expect(result).toEqual({
      type: 'broadcast',
      event: 'binary-test',
      payload: '<binary, 11 bytes>',
      meta: { id: 'abc' },
    })
  })

  it('reports the view byteLength (not the underlying buffer) for a Uint8Array with byteOffset > 0', () => {
    const buffer = new ArrayBuffer(16)
    const view = new Uint8Array(buffer, 4, 5)
    const result = withBinaryPayloadPlaceholder({ payload: view })

    expect(result).toEqual({ payload: '<binary, 5 bytes>' })
  })
})
