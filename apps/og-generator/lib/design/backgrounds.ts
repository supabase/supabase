import 'server-only'

import { readdirSync, readFileSync } from 'node:fs'
import { extname, join } from 'node:path'

/**
 * Fallback background art for the icon-less Thumb (brief follow-up).
 *
 * OG/layout renders no longer use this — flat color only. Drop files into
 * public/backgrounds/ (SVG/PNG/JPEG/WebP) to grow the set; no code change
 * needed.
 */

const BACKGROUNDS_DIR = join(process.cwd(), 'public', 'backgrounds')

const MIME: Record<string, string> = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
}

/** A random background image from public/backgrounds, inlined as a data URI. Null if the folder is empty/missing. */
export function randomBackgroundDataUri(): string | null {
  let files: string[]
  try {
    files = readdirSync(BACKGROUNDS_DIR).filter((f) => extname(f).toLowerCase() in MIME)
  } catch {
    return null
  }
  if (files.length === 0) return null

  const file = files[Math.floor(Math.random() * files.length)]
  const mime = MIME[extname(file).toLowerCase()]
  const bytes = readFileSync(join(BACKGROUNDS_DIR, file))
  return `data:${mime};base64,${bytes.toString('base64')}`
}
