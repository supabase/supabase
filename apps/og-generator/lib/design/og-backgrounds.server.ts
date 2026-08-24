import 'server-only'

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { BackgroundId } from '@/lib/design/og-backgrounds'

/**
 * Reads the exact PNGs dropped into public/backgrounds/ (not generated
 * SVGs) and caches them as data URIs — same pattern as
 * lib/design/backgrounds.ts's random Thumb art. Sizing/position
 * (fit-to-height, right-aligned, no-repeat) is applied as CSS in
 * templates.tsx's rootBase(), not baked into the image. Server-only: reads
 * the filesystem, so it must stay out of app/page.tsx's Client Component
 * import graph (see lib/design/og-backgrounds.ts for the client-safe types).
 */

const BACKGROUNDS_DIR = join(process.cwd(), 'public', 'backgrounds')

const FILE: Record<Exclude<BackgroundId, 'none'>, string> = {
  'grid-background': 'grid-background.png',
  'graph-paper': 'graph-paper.png',
  'concentric-circles': 'concentric-circles.png',
}

const cache = new Map<string, string | null>()

function loadDataUri(filename: string): string | null {
  if (cache.has(filename)) return cache.get(filename) ?? null
  let uri: string | null
  try {
    const bytes = readFileSync(join(BACKGROUNDS_DIR, filename))
    uri = `data:image/png;base64,${bytes.toString('base64')}`
  } catch {
    uri = null
  }
  cache.set(filename, uri)
  return uri
}

export function backgroundDataUri(id: BackgroundId): string | null {
  if (id === 'none') return null
  return loadDataUri(FILE[id])
}
