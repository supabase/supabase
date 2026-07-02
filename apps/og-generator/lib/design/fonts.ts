import 'server-only'

import { create, type Font } from 'fontkit'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * Self-hosted Manrope (brief §2) — static weights in WOFF, which satori (via
 * next/og) parses for rendering AND fontkit parses for server-side text
 * measurement (the headline auto-fit). One format, two consumers.
 *
 * NOTE: these are the Fontsource "latin" subset (covers Basic Latin + General
 * Punctuation: em-dash, curly quotes, ellipsis). Non-Latin glyphs would need
 * the full font; revisit if headlines ever need them.
 */

export type ManropeWeight = 400 | 500 | 600 | 700

const FONT_DIR = join(process.cwd(), 'public', 'fonts', 'manrope')

const FILE: Record<ManropeWeight, string> = {
  400: 'manrope-400.woff',
  500: 'manrope-500.woff',
  600: 'manrope-600.woff',
  700: 'manrope-700.woff',
}

// Cache across requests within a warm process — fonts never change at runtime.
const bufferCache = new Map<ManropeWeight, Buffer>()
const fontkitCache = new Map<ManropeWeight, Font>()

async function buffer(weight: ManropeWeight): Promise<Buffer> {
  let buf = bufferCache.get(weight)
  if (!buf) {
    buf = await readFile(join(FONT_DIR, FILE[weight]))
    bufferCache.set(weight, buf)
  }
  return buf
}

/** Font descriptors in the shape next/og's `ImageResponse` expects. */
export async function satoriFonts(weights: ManropeWeight[] = [400, 500, 600, 700]) {
  return Promise.all(
    weights.map(async (weight) => ({
      name: 'Manrope',
      data: await buffer(weight),
      weight,
      style: 'normal' as const,
    }))
  )
}

/** Parsed fontkit `Font` for server-side text measurement (headline auto-fit). */
export async function measurementFont(weight: ManropeWeight): Promise<Font> {
  let font = fontkitCache.get(weight)
  if (!font) {
    font = create(await buffer(weight)) as Font
    fontkitCache.set(weight, font)
  }
  return font
}
