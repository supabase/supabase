import { describe, expect, it } from 'vitest'

import { createTar } from './createTarGz'

const BLOCK = 512
const decoder = new TextDecoder()
const field = (tar: Uint8Array, start: number, end: number) =>
  decoder.decode(tar.slice(start, end)).replace(/\0.*$/, '')

describe('createTar', () => {
  const tar = createTar([{ name: 'index.ts', content: 'hello' }])

  it('pads the archive to whole 512-byte blocks', () => {
    expect(tar.length % BLOCK).toBe(0)
  })

  it('ends with two zero blocks', () => {
    expect(tar.slice(-BLOCK * 2).every((byte) => byte === 0)).toBe(true)
  })

  it('writes a ustar header for the file', () => {
    expect(field(tar, 0, 100)).toBe('index.ts')
    expect(field(tar, 257, 263)).toBe('ustar')
    expect(decoder.decode(tar.slice(156, 157))).toBe('0')
  })

  it('records the content length in octal', () => {
    expect(field(tar, 124, 136)).toBe('00000000005')
  })

  it('writes a checksum matching the header bytes', () => {
    const header = Uint8Array.from(tar.slice(0, BLOCK))
    header.fill(32, 148, 156)
    const expected = header.reduce((total, byte) => total + byte, 0)
    expect(parseInt(field(tar, 148, 156), 8)).toBe(expected)
  })

  it('stores the content immediately after the header', () => {
    expect(field(tar, BLOCK, BLOCK + 5)).toBe('hello')
  })

  it('lays out each file in its own header plus content blocks', () => {
    const two = createTar([
      { name: 'a.ts', content: 'x' },
      { name: 'b.ts', content: 'y' },
    ])
    expect(two.length).toBe(BLOCK * 6)
    expect(field(two, 0, 100)).toBe('a.ts')
    expect(field(two, BLOCK * 2, BLOCK * 2 + 100)).toBe('b.ts')
  })

  it('pads content longer than one block', () => {
    const big = createTar([{ name: 'big.ts', content: 'z'.repeat(600) }])
    expect(big.length).toBe(BLOCK * 5)
  })
})
