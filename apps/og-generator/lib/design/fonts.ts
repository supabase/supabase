import 'server-only'

import { create, type Font } from 'fontkit'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * Self-hosted fonts (brief §2) — static weights in WOFF, which satori (via
 * next/og) parses for rendering AND fontkit parses for server-side text
 * measurement (the headline auto-fit). One format, two consumers.
 *
 * NOTE: these are the Fontsource "latin" subset (covers Basic Latin + General
 * Punctuation: em-dash, curly quotes, ellipsis). Non-Latin glyphs would need
 * the full font; revisit if headlines ever need them.
 */

export type ManropeWeight = 400 | 500 | 600 | 700
export type IBMPlexMonoWeight = 400 | 500

const MANROPE_DIR = join(process.cwd(), 'public', 'fonts', 'manrope')
const IBM_PLEX_MONO_DIR = join(process.cwd(), 'public', 'fonts', 'ibm-plex-mono')

const MANROPE_FILE: Record<ManropeWeight, string> = {
  400: 'manrope-400.woff',
  500: 'manrope-500.woff',
  600: 'manrope-600.woff',
  700: 'manrope-700.woff',
}
const IBM_PLEX_MONO_FILE: Record<IBMPlexMonoWeight, string> = {
  400: 'ibm-plex-mono-400.woff',
  500: 'ibm-plex-mono-500.woff',
}

// Cache across requests within a warm process — fonts never change at runtime.
const bufferCache = new Map<string, Buffer>()
const fontkitCache = new Map<string, Font>()

async function buffer(dir: string, file: string): Promise<Buffer> {
  const key = `${dir}/${file}`
  let buf = bufferCache.get(key)
  if (!buf) {
    buf = await readFile(join(dir, file))
    bufferCache.set(key, buf)
  }
  return buf
}

/** Font descriptors in the shape next/og's `ImageResponse` expects. */
export async function satoriFonts(weights: ManropeWeight[] = [400, 500, 600, 700]) {
  const manrope = await Promise.all(
    weights.map(async (weight) => ({
      name: 'Manrope',
      data: await buffer(MANROPE_DIR, MANROPE_FILE[weight]),
      weight,
      style: 'normal' as const,
    }))
  )
  const plexMono = await Promise.all(
    ([400, 500] as IBMPlexMonoWeight[]).map(async (weight) => ({
      name: 'IBM Plex Mono',
      data: await buffer(IBM_PLEX_MONO_DIR, IBM_PLEX_MONO_FILE[weight]),
      weight,
      style: 'normal' as const,
    }))
  )
  return [...manrope, ...plexMono]
}

/** Parsed fontkit `Font` for server-side text measurement (headline auto-fit). */
export async function measurementFont(weight: ManropeWeight): Promise<Font> {
  const key = `manrope-${weight}`
  let font = fontkitCache.get(key)
  if (!font) {
    font = create(await buffer(MANROPE_DIR, MANROPE_FILE[weight])) as Font
    fontkitCache.set(key, font)
  }
  return font
}
