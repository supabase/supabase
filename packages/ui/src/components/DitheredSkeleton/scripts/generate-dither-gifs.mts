/**
 * Bakes the drifting, ordered-dither texture of `DitheredSkeleton` into two tiny looping GIFs
 * that `DitheredSkeletonGif` uses as masks: a sparse resting layer and a dense highlight layer.
 *
 * Run with: pnpm tsx packages/ui/src/components/DitheredSkeleton/scripts/generate-dither-gifs.mts
 */
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { format, resolveConfig } from 'prettier'

import { BAYER_8, hash } from '../dither'

// One GIF pixel is one dither cell, the component scales it up with `image-rendering: pixelated`.
const TILE = 64
const FRAMES = 60
// GIF delays are in hundredths of a second: 60 frames at 8cs is a 4.8s seamless loop at 12.5fps.
const DELAY_CS = 8
// Over one loop each octave drifts by a whole number of tiles, so the animation wraps seamlessly.
const COARSE = { cells: 11, shift: [1, -1] }
const FINE = { cells: 3.5, shift: [-1, 1] }
const HIGHLIGHT_BAND = 0.75
// The opacity pulse is baked in as a density pulse: two breaths per loop, so no CSS animation is needed.
const PULSES_PER_LOOP = 2
const PULSE_DEPTH = 0.3

const OUTPUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'dither-gifs.ts')
// The CSS-only `.shimmering-loader` in ui-patterns uses the base layer through a global variable.
const CSS_OUTPUT = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../../../ui-patterns/src/ShimmeringLoader/dither-gifs.css'
)

function tileableNoise(cells: number) {
  const period = Math.max(1, Math.round(TILE / cells))
  const scale = TILE / period
  return (x: number, y: number) => {
    const fx = x / scale
    const fy = y / scale
    const xi = Math.floor(fx)
    const yi = Math.floor(fy)
    const xf = fx - xi
    const yf = fy - yi
    const u = xf * xf * (3 - 2 * xf)
    const v = yf * yf * (3 - 2 * yf)
    const wrap = (n: number) => ((n % period) + period) % period
    const a = hash(wrap(xi), wrap(yi))
    const b = hash(wrap(xi + 1), wrap(yi))
    const c = hash(wrap(xi), wrap(yi + 1))
    const d = hash(wrap(xi + 1), wrap(yi + 1))
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
  }
}

function renderFrames() {
  const coarse = tileableNoise(COARSE.cells)
  const fine = tileableNoise(FINE.cells)
  const base: Uint8Array[] = []
  const highlight: Uint8Array[] = []

  for (let frame = 0; frame < FRAMES; frame++) {
    const progress = frame / FRAMES
    const pulse = 1 + PULSE_DEPTH * Math.sin(2 * Math.PI * PULSES_PER_LOOP * progress)
    const baseFrame = new Uint8Array(TILE * TILE)
    const highlightFrame = new Uint8Array(TILE * TILE)
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const grain =
          coarse(x + COARSE.shift[0] * TILE * progress, y + COARSE.shift[1] * TILE * progress) *
            0.65 +
          fine(x + FINE.shift[0] * TILE * progress, y + FINE.shift[1] * TILE * progress) * 0.35
        const threshold = BAYER_8[(y & 7) * 8 + (x & 7)]
        const resting = 0.05 + grain * 0.14
        const index = y * TILE + x
        baseFrame[index] = resting * pulse > threshold ? 1 : 0
        highlightFrame[index] =
          (resting + HIGHLIGHT_BAND * (0.35 + grain * 0.55)) * pulse > threshold ? 1 : 0
      }
    }
    base.push(baseFrame)
    highlight.push(highlightFrame)
  }
  return { base, highlight }
}

// Minimal GIF89a LZW encoder, following the reference variable-width code scheme.
function lzw(indices: Uint8Array, minCodeSize: number) {
  const clearCode = 1 << minCodeSize
  const endCode = clearCode + 1
  const bytes: number[] = []
  let codeSize = minCodeSize + 1
  let nextCode = endCode + 1
  let table = new Map<number, number>()
  let buffer = 0
  let bufferBits = 0

  const emit = (code: number) => {
    buffer |= code << bufferBits
    bufferBits += codeSize
    while (bufferBits >= 8) {
      bytes.push(buffer & 0xff)
      buffer >>>= 8
      bufferBits -= 8
    }
  }

  emit(clearCode)
  let prefix = indices[0]
  for (let i = 1; i < indices.length; i++) {
    const symbol = indices[i]
    const key = (prefix << 8) | symbol
    const existing = table.get(key)
    if (existing !== undefined) {
      prefix = existing
      continue
    }
    emit(prefix)
    if (nextCode === 4096) {
      emit(clearCode)
      table = new Map()
      codeSize = minCodeSize + 1
      nextCode = endCode + 1
    } else {
      if (nextCode >= 1 << codeSize) codeSize++
      table.set(key, nextCode++)
    }
    prefix = symbol
  }
  emit(prefix)
  emit(endCode)
  if (bufferBits > 0) bytes.push(buffer & 0xff)
  return bytes
}

function subBlocks(data: number[]) {
  const out: number[] = []
  for (let i = 0; i < data.length; i += 255) {
    const chunk = data.slice(i, i + 255)
    out.push(chunk.length, ...chunk)
  }
  out.push(0)
  return out
}

const u16 = (value: number) => [value & 0xff, value >> 8]

// Index 0 is "off" (black), 1 is "on" (white), and 2 is transparent, meaning "unchanged". The
// first frame is complete, then each frame only stores the cells that flipped inside their bounding
// box, which shrinks the file several times over. The component reads it as a luminance mask.
function encodeGif(frames: Uint8Array[]) {
  const bytes: number[] = [
    ...Buffer.from('GIF89a'),
    ...u16(TILE),
    ...u16(TILE),
    0b1000_0001, // global color table, 4 entries
    0,
    0,
    ...[0, 0, 0, 255, 255, 255, 0, 0, 0, 0, 0, 0],
    ...[0x21, 0xff, 0x0b, ...Buffer.from('NETSCAPE2.0'), 0x03, 0x01, 0x00, 0x00, 0x00],
  ]
  frames.forEach((frame, index) => {
    const previous = frames[index - 1]
    let [left, top, right, bottom] = [0, 0, TILE - 1, TILE - 1]
    if (previous) {
      ;[left, top, right, bottom] = [TILE, TILE, -1, -1]
      for (let i = 0; i < frame.length; i++) {
        if (frame[i] === previous[i]) continue
        const x = i % TILE
        const y = (i - x) / TILE
        left = Math.min(left, x)
        top = Math.min(top, y)
        right = Math.max(right, x)
        bottom = Math.max(bottom, y)
      }
      // Nothing changed: still emit a 1x1 transparent frame to keep the timing.
      if (right === -1) [left, top, right, bottom] = [0, 0, 0, 0]
    }
    const width = right - left + 1
    const height = bottom - top + 1
    const pixels = new Uint8Array(width * height)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (top + y) * TILE + left + x
        pixels[y * width + x] = previous && frame[i] === previous[i] ? 2 : frame[i]
      }
    }
    bytes.push(0x21, 0xf9, 0x04, (1 << 2) | (previous ? 1 : 0), ...u16(DELAY_CS), 2, 0)
    bytes.push(0x2c, ...u16(left), ...u16(top), ...u16(width), ...u16(height), 0)
    bytes.push(2, ...subBlocks(lzw(pixels, 2)))
  })
  bytes.push(0x3b)
  return Buffer.from(bytes)
}

const { base, highlight } = renderFrames()
const baseGif = encodeGif(base)
const highlightGif = encodeGif(highlight)
// Single-frame versions for reduced motion, since CSS can't pause an animated GIF.
const baseStill = encodeGif(base.slice(0, 1))
const highlightStill = encodeGif(highlight.slice(0, 1))

if (process.argv.includes('--out')) {
  const dir = process.argv[process.argv.indexOf('--out') + 1]
  writeFileSync(join(dir, 'dither-base.gif'), baseGif)
  writeFileSync(join(dir, 'dither-highlight.gif'), highlightGif)
}

const source = `// Generated by scripts/generate-dither-gifs.mts. Do not edit by hand.
// ${TILE}x${TILE} cells, ${FRAMES} frames at ${100 / DELAY_CS}fps, ${baseGif.length + highlightGif.length} bytes total.

export const DITHER_GIF_TILE = ${TILE}
export const DITHER_BASE_GIF = 'data:image/gif;base64,${baseGif.toString('base64')}'
export const DITHER_HIGHLIGHT_GIF = 'data:image/gif;base64,${highlightGif.toString('base64')}'
export const DITHER_BASE_STILL = 'data:image/gif;base64,${baseStill.toString('base64')}'
export const DITHER_HIGHLIGHT_STILL = 'data:image/gif;base64,${highlightStill.toString('base64')}'
`
writeFileSync(OUTPUT, await format(source, { ...(await resolveConfig(OUTPUT)), filepath: OUTPUT }))

const css = `/* Generated by packages/ui/src/components/DitheredSkeleton/scripts/generate-dither-gifs.mts. Do not edit by hand. */
:root {
  --dithered-skeleton-base: url(data:image/gif;base64,${baseGif.toString('base64')});
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --dithered-skeleton-base: url(data:image/gif;base64,${baseStill.toString('base64')});
  }
}
`
writeFileSync(
  CSS_OUTPUT,
  await format(css, { ...(await resolveConfig(CSS_OUTPUT)), filepath: CSS_OUTPUT })
)

console.log(
  `base: ${baseGif.length} bytes, highlight: ${highlightGif.length} bytes, stills: ${baseStill.length + highlightStill.length} bytes`
)
