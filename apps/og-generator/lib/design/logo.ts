import 'server-only'

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Static Supabase wordmark (brand identity, not a user-selectable icon/logo
 * asset) — used by the fixed-logo templates in templates.tsx, which render
 * it directly instead of going through the icon/logo-asset system.
 */

const WORDMARK_PATH = join(process.cwd(), 'public', 'brand-logos', 'supabase-wordmark.svg')
const WORDMARK_SVG = readFileSync(WORDMARK_PATH, 'utf-8')

// Intrinsic dimensions of the source SVG (viewBox="0 0 220 43").
export const SUPABASE_WORDMARK_ASPECT = 220 / 43

export const SUPABASE_WORDMARK_DATA_URI = `data:image/svg+xml;base64,${Buffer.from(WORDMARK_SVG).toString('base64')}`
